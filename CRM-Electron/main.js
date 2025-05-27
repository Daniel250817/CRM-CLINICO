const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');

function createWindow() {
  // Crear la ventana del navegador
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    },
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e60fa',
      symbolColor: '#ffffff'
    }
  });

  // Ocultar el menú
  mainWindow.setMenu(null);

  // Cargar el archivo HTML
  mainWindow.loadFile('index.html');z

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Cuando la aplicación esté lista, crear la ventana
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 