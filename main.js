const { app, BrowserWindow, remote, contextBridge } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    minWidth: 400,
    minHeight: 400,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, // Set to false for security
      contextIsolation: true, // Enable context isolation
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.webContents.on("devtools-opened", () => {
    mainWindow.webContents.closeDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.setAsDefaultProtocolClient("Pixchums v4");
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
