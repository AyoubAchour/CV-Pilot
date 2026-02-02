import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import pngToIco from 'png-to-ico';

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureWindowsIco({ pngPath, icoPath }) {
  if (process.platform !== 'win32') return;
  if (await fileExists(icoPath)) return;
  if (!(await fileExists(pngPath))) return;

  const buf = await pngToIco(pngPath);
  await fs.writeFile(icoPath, buf);
}

async function main() {
  const repoRoot = process.cwd();
  const assetsDir = path.join(repoRoot, 'assets');

  const pngPath = path.join(assetsDir, 'icon.png');
  const icoPath = path.join(assetsDir, 'icon.ico');

  await ensureWindowsIco({ pngPath, icoPath });
}

main().catch((err) => {
  // Keep CI logs readable, but fail fast when icon generation breaks.
  console.error('[generate-icons]', err);
  process.exitCode = 1;
});
