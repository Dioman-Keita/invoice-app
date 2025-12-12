const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDeepLink: (callback) => ipcRenderer.on('deep-link', (event, url) => callback(url))
});