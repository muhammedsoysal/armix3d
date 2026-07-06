import { app, BrowserWindow } from "electron";

// Adım 7'de gerçek mod seçim ekranı gelecek; şimdilik dev sunucuları sabit.
const DEMO_3D_URL = process.env.DEMO_3D_URL ?? "http://localhost:5173";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    backgroundColor: "#0a0c10",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  void win.loadURL(DEMO_3D_URL);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
