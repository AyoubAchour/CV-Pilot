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

    const out = await win.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    // Electron versions can return Buffer-like Uint8Array. Normalize to Buffer.
    return Buffer.isBuffer(out) ? out : Buffer.from(out);
  } finally {
    try {
      win.close();
    } catch {
      // ignore
    }
  }
}
