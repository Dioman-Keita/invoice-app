const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { fork, exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const log = require('electron-log');

// --- 1. CONFIGURATION LOGS ---
log.transports.file.level = 'info';
log.transports.file.fileName = 'main.log';
Object.assign(console, {
    log: log.log,
    info: log.info,
    error: log.error,
    warn: log.warn
});

// --- 2. CONFIGURATION DEEP LINK ---
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('invoice-app', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('invoice-app');
}

// --- 3. VARIABLES GLOBALES ---
let mainWindow = null;
let backendProcess = null;
let deepLinkUrl = null;
let isAppReady = false; // <-- NOUVEAU : On track si React est prêt

const BACKEND_PORT = 3000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// --- 4. INSTANCE UNIQUE ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // 1. Récupération robuste du lien (Warm Start)
            const urlArg = commandLine.find(arg => arg.includes('invoice-app://'));

            if (urlArg) {
                // Nettoyage brut
                let deepLink = urlArg.replace(/["']/g, "").trim();
                log.info(`🔗 Deep link détecté (Instance courante): ${deepLink}`);

                // 2. Mise à jour de la variable globale (Buffer)
                deepLinkUrl = deepLink;

                // 3. Si l'app est déjà prête, on envoie tout de suite.
                // Sinon, on ne fait RIEN. Le listener 'did-finish-load' s'en chargera quand React sera prêt.
                if (isAppReady) {
                    mainWindow.webContents.send('deep-link', deepLink);
                    log.info('📤 Deep link envoyé immédiatement (App Ready)');
                } else {
                    log.info('⏳ Deep link mis en tampon (App not Ready yet)');
                }
            }
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    deepLinkUrl = url;
    log.info(`🔗 Deep link (Mac): ${url}`);
    if (mainWindow && isAppReady) {
        mainWindow.webContents.send('deep-link', url);
    }
});

if (process.platform === 'win32') {
    // Cold Start : On cherche simplement l'argument
    // On ne fait RIEN d'autre ici, tout se jouera dans le createWindow
    const startupUrl = process.argv.find(arg => arg.includes('invoice-app://'));
    if (startupUrl) {
        deepLinkUrl = startupUrl.replace(/["']/g, "").trim();
        log.info(`🔗 Deep link au démarrage (Cold Start) : ${deepLinkUrl}`);
    }
}

// --- 5. CHEMINS ---
function getResourcesPaths() {
    const isProd = app.isPackaged;
    const rootPath = isProd ? process.resourcesPath : __dirname;

    const serverPath = path.join(rootPath, 'server');
    const clientDistPath = path.join(rootPath, 'client', 'dist');
    const templatesPath = path.join(serverPath, 'templates');

    let serverEntry = path.join(serverPath, 'dist', 'server', 'server.js');
    if (!fs.existsSync(serverEntry)) serverEntry = path.join(serverPath, 'dist', 'server.js');
    if (!fs.existsSync(serverEntry)) serverEntry = path.join(serverPath, 'server.js');

    return { serverPath, clientDistPath, serverEntry, templatesPath };
}

// --- 6. DOCKER ---
function ensureDockerIsRunning(cwd) {
    return new Promise((resolve) => {
        log.info('🐳 Vérification Docker...');
        exec('docker compose up -d --remove-orphans', { cwd }, (error, stdout, stderr) => {
            if (error) log.warn(`⚠️ Docker warning: ${error.message}`);
            else log.info(`✅ Docker Output: ${stdout}`);
            resolve();
        });
    });
}

// --- 7. BACKEND ---
async function startBackend() {
    const paths = getResourcesPaths();
    log.info('🚀 Démarrage Backend...');

    await ensureDockerIsRunning(paths.serverPath);

    if (!fs.existsSync(paths.serverEntry)) {
        log.error('❌ Fichier server.js introuvable !');
        return;
    }

    const env = {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: app.isPackaged ? 'production' : 'development',
        SERVER_TEMPLATES_PATH: paths.templatesPath,
        CLIENT_DIST_PATH: paths.clientDistPath,
        ELECTRON_RUN_AS_NODE: '1'
    };

    try {
        backendProcess = fork(paths.serverEntry, [], {
            cwd: paths.serverPath,
            env: env,
            silent: true
        });

        backendProcess.stdout.on('data', (data) => log.info(`[SERVER] ${data}`));
        backendProcess.stderr.on('data', (data) => log.error(`[SERVER ERROR] ${data}`));

    } catch (e) {
        log.error("❌ Exception fork:", e);
    }
}

function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
}

// --- 8. ATTENTE SERVEUR ---
function waitForServer() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 45;

        const check = () => {
            attempts++;
            http.get(BACKEND_URL + '/api/health', (res) => {
                log.info(`✅ Backend connecté !`);
                resolve();
            }).on('error', (err) => {
                if (attempts >= maxAttempts) {
                    reject(new Error(`Timeout Backend`));
                } else {
                    setTimeout(check, 1000);
                }
            });
        };
        check();
    });
}

// --- 9. UI ---
function createMainWindow() {
    // 1. Création de la fenêtre
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        backgroundColor: '#f0f2f5',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 2. Le HTML Simple & Efficace
    const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
          body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex; flex-direction: column; justify-content: center; align-items: center; 
              height: 100vh; margin: 0; background: #f0f2f5; color: #333; user-select: none;
          }
          .container { text-align: center; }
          .spinner {
              border: 4px solid #e5e7eb; border-top: 4px solid #3498db; border-radius: 50%;
              width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin-bottom: 10px; color: #2c3e50; font-weight: 600; }
          p { color: #7f8c8d; margin-top: 0; }
          .timer { font-size: 12px; color: #95a5a6; margin-top: 20px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
          <div class="spinner"></div>
          <h2>Démarrage de l'application, veuillez patienter un instant 😎</h2>
          <p>Initialisation de la base de données et du serveur...</p>
          <div class="timer" id="timer">Temps écoulé : 0s</div>
      </div>
      <script>
          let seconds = 0;
          setInterval(() => { seconds++; document.getElementById('timer').innerText = 'Temps écoulé : ' + seconds + 's'; }, 1000);
      </script>
    </body>
    </html>
    `;

    // 3. Chargement et affichage
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    mainWindow.show();

    // 4. Lancement Backend
    startBackend();

    // 5. Attente du serveur et redirection
    waitForServer()
        .then(() => {
            log.info('🌍 Serveur prêt, chargement application...');

            // On charge TOUJOURS l'URL normale
            mainWindow.loadURL(BACKEND_URL);

            // On écoute la fin du chargement de la vraie page (PAS du loading screen)
            mainWindow.webContents.once('did-finish-load', () => {
                log.info('✅ React Application Loaded (did-finish-load)');
                isAppReady = true;

                // SI on a un deep link en attente (Cold Start OU Warm Start pdt le chargement)
                if (deepLinkUrl) {
                    log.info(`� Envoi du Deep Link en attente : ${deepLinkUrl}`);

                    // Petit délai pour laisser React s'hydrater (Router)
                    setTimeout(() => {
                        mainWindow.webContents.send('deep-link', deepLinkUrl);
                        // On ne clear pas forcément deepLinkUrl si on veut pouvoir le rejouer au reload, 
                        // mais ici c'est bon.
                        deepLinkUrl = null;
                    }, 1000);
                }
            });
        })
        .catch((err) => {
            log.error(err);
            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Erreur Fatale',
                message: "Le serveur n'a pas pu démarrer.",
                detail: err.message + "\nVérifiez que Docker est lancé."
            });
        });

    mainWindow.on('closed', () => mainWindow = null);
}


// Déplacement de la logique de démarrage À L'INTÉRIEUR du bloc "else" (Primary Instance)
// pour garantir que la seconde instance ne lance JAMAIS le backend ni la fenêtre.
if (gotTheLock) {
    app.whenReady().then(createMainWindow);
    app.on('will-quit', () => stopBackend());
    app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
