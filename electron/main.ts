import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#04060e',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 14, y: 13 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  }
};

// ─── IPC: File System ─────────────────────────────────────────────

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
  if (result.canceled) return null;
  return result.filePaths;
});

async function buildTree(dirPath: string, depth = 0): Promise<any[]> {
  const IGNORED = new Set(['node_modules', '.git', '.next', 'dist', 'dist-electron', '__pycache__', '.DS_Store']);
  if (depth > 8) return [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: any[] = [];
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      nodes.push({ name: entry.name, path: fullPath, type: 'folder', children: await buildTree(fullPath, depth + 1) });
    } else {
      nodes.push({ name: entry.name, path: fullPath, type: 'file' });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

ipcMain.handle('fs:readTree', async (_, dirPath: string) => buildTree(dirPath));

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try { return await fs.readFile(filePath, 'utf-8'); } catch { return null; }
});

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try { await fs.writeFile(filePath, content, 'utf-8'); return true; } catch { return false; }
});

ipcMain.handle('fs:createFile', async (_, filePath: string) => {
  try { await fs.writeFile(filePath, '', 'utf-8'); return true; } catch { return false; }
});

ipcMain.handle('fs:createFolder', async (_, dirPath: string) => {
  try { await fs.mkdir(dirPath, { recursive: true }); return true; } catch { return false; }
});

ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
  try { await fs.rename(oldPath, newPath); return true; } catch { return false; }
});

ipcMain.handle('fs:delete', async (_, filePath: string) => {
  try { await fs.rm(filePath, { recursive: true, force: true }); return true; } catch { return false; }
});

ipcMain.handle('fs:revealInExplorer', async (_, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('fs:exists', async (_, filePath: string) => existsSync(filePath));

// ─── IPC: Ollama ──────────────────────────────────────────────────

ipcMain.handle('ollama:listModels', async () => {
  const http = await import('http');
  return new Promise((resolve) => {
    const req = http.default.get('http://localhost:11434/api/tags', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ models: [] }); }
      });
    });
    req.on('error', () => resolve({ models: [] }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ models: [] }); });
  });
});

// ─── App Lifecycle ────────────────────────────────────────────────

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
