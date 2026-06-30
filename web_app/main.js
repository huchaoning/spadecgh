import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 810,
        titleBarStyle: "hidden",
        title: "hducgh",
        backgroundColor: "#ffffff00",
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, "dist/favicon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        ...(process.platform !== "darwin" && {
            titleBarOverlay: {
                color: "#ffffff00",
            }
        })
    });

    mainWindow.on("close", (e) => {
        e.preventDefault();
        mainWindow.hide();
        setTimeout(() => {
            app.exit();
        }, 5)
    });

    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));

    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.setTitle("hducgh");
        mainWindow.show();
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    app.quit();
});