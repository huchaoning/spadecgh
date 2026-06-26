import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 810,
        titleBarStyle: 'hidden',
        title: 'hducgh',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'dist/favicon.png'),
        ...(process.platform !== 'darwin' && { titleBarOverlay: true })
    });

    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.setTitle('hducgh');
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});