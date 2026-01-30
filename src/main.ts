import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import started from 'electron-squirrel-startup';
import { createBlankCv, normalizeCvDocument, type CvDocument } from './shared/cv-model';
import { getCvSuggestedFileName, getCvTitle, renderCvHtmlDocument } from './shared/cv-template';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

interface ProjectSummary {
  id: string;
  title: string;
  lastEdited: string;
  tags: string[];
}

interface SaveProjectCvInput {
  projectId: string;
  cv: CvDocument;
}

type CreateBlankCvProjectResult = {
  project: ProjectSummary;
  cv: CvDocument;
};

type ExportCvPdfInput = {
  projectId: string;
  cv: CvDocument;
  suggestedFileName?: string;
};

type ExportCvPdfResult =
  | { canceled: true }
  | {
      canceled: false;
      savedPath: string;
    };

function assertProjectId(projectId: string): void {
  // Project IDs are generated via randomUUID().
  // Reject anything else to avoid path traversal.
  if (!/^[0-9a-fA-F-]{36}$/.test(projectId)) {
    throw new Error("Invalid projectId");
  }
}

function getProjectsRootDir(): string {
  return path.join(app.getPath('userData'), 'projects');
}

function getProjectDir(projectId: string): string {
  assertProjectId(projectId);
  return path.join(getProjectsRootDir(), projectId);
}

async function writeProjectRecord(projectDir: string, record: unknown): Promise<void> {
  await fs.writeFile(path.join(projectDir, 'project.json'), JSON.stringify(record, null, 2), 'utf8');
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function createPdfFromHtml(html: string): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  try {
    const dataUrl = `data:text/html;base64,${Buffer.from(html, 'utf8').toString('base64')}`;
    await win.webContents.loadURL(dataUrl);

    // Ensure fonts/layout are ready before printing.
    try {
      await win.webContents.executeJavaScript(
        'document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()',
        true
      );
    } catch {
      // ignore
    }

    return await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
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

async function readProjectSummary(projectDir: string): Promise<ProjectSummary | null> {
  try {
    const raw = await fs.readFile(path.join(projectDir, 'project.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : null;
    const title = typeof record.title === 'string' ? record.title : null;
    const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : null;
    const tags = Array.isArray(record.tags)
      ? record.tags.filter((t): t is string => typeof t === 'string')
      : [];

    if (!id || !title || !updatedAt) {
      return null;
    }

    return {
      id,
      title,
      lastEdited: updatedAt,
      tags,
    };
  } catch {
    return null;
  }
}

function registerIpcHandlers() {

  ipcMain.handle('cv:listProjects', async (): Promise<ProjectSummary[]> => {
    const projectsRootDir = getProjectsRootDir();
    await fs.mkdir(projectsRootDir, { recursive: true });

    const entries = await fs.readdir(projectsRootDir, { withFileTypes: true });
    const summaries: ProjectSummary[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const projectDir = path.join(projectsRootDir, entry.name);
      const summary = await readProjectSummary(projectDir);
      if (summary) {
        summaries.push(summary);
      }
    }

    summaries.sort((a, b) => b.lastEdited.localeCompare(a.lastEdited));
    return summaries;
  });


  ipcMain.handle('cv:createBlankCvProject', async (): Promise<CreateBlankCvProjectResult> => {
    const projectId = randomUUID();
    const projectDir = getProjectDir(projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const cv = createBlankCv();
    const now = new Date().toISOString();

    const projectRecord = {
      id: projectId,
      title: getCvTitle(cv),
      createdAt: now,
      updatedAt: now,
      tags: ['cv'],
    };

    await writeProjectRecord(projectDir, projectRecord);
    await fs.writeFile(path.join(projectDir, 'cv.json'), JSON.stringify(cv, null, 2), 'utf8');

    return {
      project: {
        id: projectId,
        title: projectRecord.title,
        lastEdited: now,
        tags: ['cv'],
      },
      cv,
    };
  });

  ipcMain.handle('cv:getProjectCv', async (_event, projectId: string): Promise<CvDocument> => {
    if (typeof projectId !== 'string') {
      throw new Error('Invalid payload: projectId must be a string');
    }
    const projectDir = getProjectDir(projectId);
    const raw = await readJsonFile(path.join(projectDir, 'cv.json'));
    return normalizeCvDocument(raw);
  });

  ipcMain.handle('cv:saveProjectCv', async (_event, input: SaveProjectCvInput): Promise<void> => {
    if (!input || typeof input.projectId !== 'string' || !input.cv) {
      throw new Error('Invalid payload');
    }

    const projectDir = getProjectDir(input.projectId);
    await fs.writeFile(path.join(projectDir, 'cv.json'), JSON.stringify(input.cv, null, 2), 'utf8');

    const now = new Date().toISOString();
    let existingCreatedAt: string | null = null;

    try {
      const existing = await readJsonFile(path.join(projectDir, 'project.json'));
      if (existing && typeof existing === 'object') {
        const record = existing as Record<string, unknown>;
        existingCreatedAt = typeof record.createdAt === 'string' ? record.createdAt : null;
      }
    } catch {
      // ignore
    }

    const projectRecord = {
      id: input.projectId,
      title: getCvTitle(input.cv),
      updatedAt: now,
      tags: ['cv'],
    };

    // Preserve createdAt if it exists.
    try {
      if (existingCreatedAt) {
        (projectRecord as typeof projectRecord & { createdAt?: string }).createdAt =
          existingCreatedAt;
      }
    } catch {
      // ignore
    }

    await writeProjectRecord(projectDir, projectRecord);
  });

  ipcMain.handle('cv:exportCvPdf', async (_event, input: ExportCvPdfInput): Promise<ExportCvPdfResult> => {
    if (!input || typeof input.projectId !== 'string' || !input.cv) {
      throw new Error('Invalid payload');
    }

    const parentWindow =
      BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const suggestedFileName =
      typeof input.suggestedFileName === 'string' && input.suggestedFileName.trim().length > 0
        ? input.suggestedFileName
        : getCvSuggestedFileName(input.cv);

    const saveResult = await dialog.showSaveDialog(parentWindow, {
      title: 'Export CV as PDF',
      defaultPath: path.join(app.getPath('documents'), suggestedFileName),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    const html = renderCvHtmlDocument(input.cv);
    const pdfBuffer = await createPdfFromHtml(html);
    await fs.writeFile(saveResult.filePath, pdfBuffer);

    return { canceled: false, savedPath: saveResult.filePath };
  });
}

const createWindow = () => {
  Menu.setApplicationMenu(null);

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    title: 'CV Pilot',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
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

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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
