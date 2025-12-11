const { app, BrowserWindow, dialog } = require('electron');
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

// --- 2. VARIABLES GLOBALES ---
let mainWindow = null;
let backendProcess = null;

// ON FORCE LE PORT 3000
const BACKEND_PORT = 3000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// --- 3. SINGLE INSTANCE ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// --- 4. GESTION DES CHEMINS ---
function getResourcesPaths() {
    const isProd = app.isPackaged;
    const rootPath = isProd ? process.resourcesPath : __dirname;
    const serverPath = path.join(rootPath, 'server');
    const clientDistPath = path.join(rootPath, 'client', 'dist');

    let serverEntry = path.join(serverPath, 'dist', 'server', 'server.js');
    if (!fs.existsSync(serverEntry)) serverEntry = path.join(serverPath, 'dist', 'server.js');
    if (!fs.existsSync(serverEntry)) serverEntry = path.join(serverPath, 'server.js');

    return { serverPath, clientDistPath, serverEntry };
}

// --- 5. GESTION DOCKER (NOUVEAU) ---
function ensureDockerIsRunning(cwd) {
    return new Promise((resolve) => {
        log.info('🐳 Tentative de redémarrage des services Docker...');
        
        // On tente un 'up -d' qui est plus safe qu'un restart
        // --remove-orphans nettoie les vieux conteneurs
        exec('docker compose up -d --remove-orphans', { cwd }, (error, stdout, stderr) => {
            if (error) {
                log.warn(`⚠️ Docker warning: ${error.message}`);
                // On ne reject pas, on essaie quand même de lancer le backend
                // car Docker est peut-être déjà lancé
            } else {
                log.info(`✅ Docker Output: ${stdout}`);
            }
            resolve();
        });
    });
}

// --- 6. DÉMARRAGE DU BACKEND ---
async function startBackend() {
    const paths = getResourcesPaths();
    
    log.info('🚀 Démarrage Backend...');
    
    // TENTATIVE DOCKER AVANT LE BACKEND
    await ensureDockerIsRunning(paths.serverPath);

    if (!fs.existsSync(paths.serverEntry)) {
        log.error('❌ Fichier server.js introuvable !');
        return;
    }

    const env = { 
        ...process.env, 
        PORT: BACKEND_PORT,
        NODE_ENV: app.isPackaged ? 'production' : 'development',
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

// --- 7. ATTENTE DU SERVEUR ---
function waitForServer() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 45; // 45 secondes max (Docker peut être lent)
        
        const check = () => {
            attempts++;
            http.get(BACKEND_URL + '/api/health', (res) => {
                log.info(`✅ Backend connecté !`);
                resolve();
            }).on('error', (err) => {
                if (attempts >= maxAttempts) {
                    reject(new Error(`Timeout: Le serveur ne répond pas sur le port ${BACKEND_PORT}`));
                } else {
                    setTimeout(check, 1000);
                }
            });
        };
        check();
    });
}

// --- 8. UI ---
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false, 
        backgroundColor: '#f5f5f5',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // HTML AVEC TIMER
    const loadingHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
            body { 
                font-family: 'Segoe UI', sans-serif; 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: #f0f2f5; 
                color: #333; 
                user-select: none;
            }
            .container { text-align: center; }
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { margin-bottom: 10px; color: #2c3e50; }
            p { color: #7f8c8d; }
            .timer { 
                font-size: 12px; 
                color: #95a5a6; 
                margin-top: 15px; 
                font-family: monospace;
            }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="spinner"></div>
            <h2>Démarrage de Invoice App</h2>
            <p>Initialisation de la base de données et du serveur...</p>
            <div class="timer" id="timer">Temps écoulé : 0s</div>
        </div>
        <script>
            let seconds = 0;
            setInterval(() => {
                seconds++;
                document.getElementById('timer').innerText = 'Temps écoulé : ' + seconds + 's';
            }, 1000);
        </script>
      </body>
      </html>
    `;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    mainWindow.show();

    startBackend();

    waitForServer()
        .then(() => {
            log.info('🌍 Chargement de l\'application...');
            mainWindow.loadURL(BACKEND_URL);
        })
        .catch((err) => {
            log.error(err);
            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Erreur Serveur',
                message: "Impossible de démarrer les services.",
                detail: "Vérifiez que Docker Desktop est bien lancé.\n\nErreur: " + err.message
            });
        });
        
    mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(createMainWindow);
app.on('will-quit', () => stopBackend());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });