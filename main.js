const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const { fork, exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const log = require('electron-log');

// --- 1. LOGS CONFIGURATION ---
log.transports.file.level = 'info';
log.transports.file.fileName = 'main.log';
Object.assign(console, {
    log: log.log,
    info: log.info,
    error: log.error,
    warn: log.warn
});

// --- 2. DEEP LINK CONFIGURATION ---
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('invoice-app', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('invoice-app');
}

// --- 3. GLOBALS VAR ---
let mainWindow = null;
let backendProcess = null;
let deepLinkUrl = null;
let isAppReady = false; // <-- NEW : Track if React is ready
let isQuitting = false; // <-- NEW : Track if we confirmed quit

const BACKEND_PORT = 3000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const VITE_DEV_URL = 'http://localhost:5173';

// --- 4. INSTANCE UNIQUE ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, commandLine, _workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // 1. Robust link retrieval (Warm Start)
            const urlArg = commandLine.find(arg => arg.includes('invoice-app://'));

            if (urlArg) {
                // Raw cleaning
                let deepLink = urlArg.replace(/["']/g, "").trim();
                log.info(`🔗 Deep link détecté (Instance courante): ${deepLink}`);

                // 2. Update global variable (Buffer)
                deepLinkUrl = deepLink;

                // 3. If app is ready, send immediately.
                // Otherwise, do nothing. The 'did-finish-load' listener will handle it when React is ready.
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
    // Cold Start : Simply look for the argument
    // Do nothing else here, everything will happen in createWindow
    const startupUrl = process.argv.find(arg => arg.includes('invoice-app://'));
    if (startupUrl) {
        deepLinkUrl = startupUrl.replace(/["']/g, "").trim();
        log.info(`🔗 Deep link au démarrage (Cold Start) : ${deepLinkUrl}`);
    }
}

// --- 5. PATHS ---
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
        log.info('🐳 Docker verification...');
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
    log.info('🚀 Starting Backend...');

    await ensureDockerIsRunning(paths.serverPath);

    if (!fs.existsSync(paths.serverEntry)) {
        log.error('❌ File server.js not found !');
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

// --- 8. WAIT SERVEUR ---
function waitForServer() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 45;

        const check = () => {
            attempts++;
            http.get(BACKEND_URL + '/api/health', (res) => {
                log.info(`✅ Backend connected !`);
                resolve();
            }).on('error', () => {
                try {
                    if (attempts >= maxAttempts) {
                        reject(new Error(`Timeout Backend`));
                    } else {
                        setTimeout(check, 1000);
                    }
                } catch (error) {
                    log.error(`❌ Error waiting for server: ${error.message}`);
                    reject(error);
                }
            });
        };
        check();
    });
}

// --- 9. UI ---
function createMainWindow() {
    // 1. Create the window
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 700,
        center: true,
        show: false,
        backgroundColor: '#f0f2f5',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 2. Simple & Efficient HTML
    const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
          :root {
              --green-50: #f0fdf4;
              --green-100: #dcfce7;
              --green-600: #16a34a;
              --amber-50: #fffbeb;
              --gray-700: #374151;
              --gray-600: #4b5563;
          }
          body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex; flex-direction: column; justify-content: center; align-items: center; 
              height: 100vh; margin: 0; 
              background: linear-gradient(to bottom right, var(--green-50), #ffffff, var(--amber-50));
              color: #111827; user-select: none;
          }
          .container { text-align: center; padding: 24px; backdrop-filter: blur(2px); }
          .spinner {
              width: 48px; height: 48px; border-radius: 9999px; 
              border: 2px solid transparent; border-bottom-color: var(--green-600);
              animation: spin 1s linear infinite; margin: 0 auto 16px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin: 0 0 8px 0; color: #065f46; font-weight: 700; font-size: 18px; }
          p { color: #111827; margin: 0 0 6px 0; font-size: 14px; }
          .chip { display: inline-block; font-size: 11px; font-weight: 600; color: #065f46; background: var(--green-100); padding: 4px 8px; border-radius: 9999px; margin-bottom: 10px; }
          .timer { font-size: 12px; color: var(--gray-600); margin-top: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      </style>
    </head>
    <body>
      <div class="container">
          <div class="spinner"></div>
          <p>Chargement...</p>
      </div>
    </body>
    </html>
    `;

    // 3. Load and display
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    mainWindow.show();

    // 4. Launch Backend
    startBackend();

    // 5. Wait for server and redirect
    waitForServer()
        .then(() => {
            log.info('🌍 Server ready, loading application...');

            const targetUrl = app.isPackaged ? BACKEND_URL : VITE_DEV_URL;
            mainWindow.loadURL(targetUrl);

            // We listen for the end of the loading of the true page (NOT the loading screen)
            mainWindow.webContents.once('did-finish-load', () => {
                log.info('✅ React Application Loaded (did-finish-load)');
                isAppReady = true;

                // If we have a deep link waiting (Cold Start OR Warm Start during loading)
                if (deepLinkUrl) {
                    log.info(`� Envoi du Deep Link en attente : ${deepLinkUrl}`);

                    // Small delay to let React hydrate (Router)
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

    // 6. Intersection of the closing for confirmation
    mainWindow.on('close', (e) => {
        if (isQuitting) return; // Allow closing if already confirmed

        e.preventDefault();

        if (!isAppReady) {
            // FALLBACK : If React is not ready (Splash Screen / Backend loading)
            // On montre une boîte de dialogue native bloquante.
            const choice = dialog.showMessageBoxSync(mainWindow, {
                type: 'warning',
                buttons: ['Annuler', 'Quitter'],
                defaultId: 1,
                cancelId: 0,
                title: 'Quitter l\'application',
                message: 'Voulez-vous vraiment quitter Invoice App ?',
                detail: 'Le chargement est en cours. Toute opération sera interrompue.'
            });

            if (choice === 1) {
                isQuitting = true;
                app.quit();
            }
        } else {
            // CAS NOMINAL : React is ready, we use the styled modal.
            mainWindow.webContents.send('request-close');
        }
    });

    mainWindow.on('closed', () => mainWindow = null);
}

// IPC to finally quit
ipcMain.on('confirm-quit', () => {
    isQuitting = true; // Allow closing now
    app.quit();
});


// Move the startup logic INSIDE the "else" block (Primary Instance)
// to guarantee that the second instance never launches the backend or the window.
if (gotTheLock) {
    function setupMenu() {
        // Keep only View, Help and Window; remove File and Edit
        const template = [
            { role: 'viewMenu' },
            {
                role: 'help',
                submenu: [
                    {
                        label: 'Documentation',
                        click: async () => {
                            const { shell } = require('electron');
                            await shell.openExternal('https://www.cmdt-mali.net/');
                        }
                    }
                ]
            },
            { role: 'windowMenu' }
        ];
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    app.whenReady().then(() => { setupMenu(); createMainWindow(); });
    app.on('will-quit', () => stopBackend());
    app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
