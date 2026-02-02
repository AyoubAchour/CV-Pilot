import 'dotenv/config';

import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'node:path';

import { registerIpcHandlers } from './main/ipc/register';

if (process.platform === 'win32') {
  app.setAppUserModelId('com.ayoubachour.vita');
}

const createWindow = () => {
  Menu.setApplicationMenu(null);

  const iconPath = MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? path.resolve(process.cwd(), 'assets', 'icon.png')
    : path.join(process.resourcesPath, 'assets', 'icon.png');

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    title: 'VITA',
    ...(process.platform === 'win32' || process.platform === 'linux'
      ? { icon: iconPath }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Prevent in-app navigation and popups. Open external links in the system browser.
  const allowedOrigin = MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin
    : null;

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        void shell.openExternal(u.toString());
      }
    } catch {
      // ignore
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);

      // Allow navigation only to our own dev server origin (dev) or local file (prod).
      if (allowedOrigin && u.origin === allowedOrigin) {
        return;
      }
      if (!allowedOrigin && u.protocol === 'file:') {
        return;
      }

      event.preventDefault();

      if (u.protocol === 'http:' || u.protocol === 'https:') {
        void shell.openExternal(u.toString());
      }
    } catch {
      event.preventDefault();
    }
  });

  // Only open DevTools in development.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  registerIpcHandlers();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
