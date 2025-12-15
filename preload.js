const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDeepLink: (callback) => {
        // 1. On définit la fonction listener nommée
        const listener = (event, url) => callback(url);
        
        // 2. On attache l'écouteur
        ipcRenderer.on('deep-link', listener);
        
        // 3. IMPORTANT : On retourne une fonction pour le retirer
        return () => {
            ipcRenderer.removeListener('deep-link', listener);
        };
    }
});