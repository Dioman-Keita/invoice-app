const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onDeepLink: (callback) => {
        // 1. Define the named listener function
        const listener = (event, url) => callback(url);

        // 2. Attach the listener
        ipcRenderer.on('deep-link', listener);

        // 3. IMPORTANT : Return a function to remove the listener
        return () => {
            ipcRenderer.removeListener('deep-link', listener);
        };
    },
    onRequestClose: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('request-close', listener);
        return () => {
            ipcRenderer.removeListener('request-close', listener);
        };
    },
    confirmQuit: () => {
        ipcRenderer.send('confirm-quit');
    }
});