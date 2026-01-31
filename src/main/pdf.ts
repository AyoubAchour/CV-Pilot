import { BrowserWindow } from "electron";

export async function createPdfFromHtml(html: string): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  try {
    const dataUrl = `data:text/html;base64,${Buffer.from(html, "utf8").toString(
      "base64"
    )}`;
    await win.webContents.loadURL(dataUrl);

    // Ensure fonts/layout are ready before printing.
    try {
      await win.webContents.executeJavaScript(
        "document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()",
        true
      );
    } catch {
      // ignore
    }

    return await win.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margins: {
        // Units are inches (Electron docs). Roughly: 12mm top/bottom, 14mm left/right.
        top: 0.472,
        bottom: 0.472,
        left: 0.551,
        right: 0.551,
      },
    });
  } finally {
    try {
      win.close();
    } catch {
      // ignore
    }
  }
}
