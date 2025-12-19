const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (app.isPackaged) {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.removeMenu?.();
    mainWindow.loadFile(indexHtml);
  } else {
    const devServer = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServer);
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
