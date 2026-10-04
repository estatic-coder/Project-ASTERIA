// ASTERIA IPC Bridge — renderer-side API for Electron IPC calls.
// All calls go through ipcRenderer (contextIsolation: false).

const { ipcRenderer } = (window as any).require('electron');

export const AsteriaAPI = {
  // ── Dialogs ────────────────────────────────────────────────────
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),
  openFile: (): Promise<string[] | null> => ipcRenderer.invoke('dialog:openFile'),

  // ── Filesystem ─────────────────────────────────────────────────
  readTree: (dirPath: string): Promise<any[]> => ipcRenderer.invoke('fs:readTree', dirPath),
  readFile: (filePath: string): Promise<string | null> => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('fs:writeFile', filePath, content),
  createFile: (filePath: string): Promise<boolean> => ipcRenderer.invoke('fs:createFile', filePath),
  createFolder: (dirPath: string): Promise<boolean> => ipcRenderer.invoke('fs:createFolder', dirPath),
  rename: (oldPath: string, newPath: string): Promise<boolean> => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  deleteItem: (filePath: string): Promise<boolean> => ipcRenderer.invoke('fs:delete', filePath),
  revealInExplorer: (filePath: string): Promise<void> => ipcRenderer.invoke('fs:revealInExplorer', filePath),
  exists: (filePath: string): Promise<boolean> => ipcRenderer.invoke('fs:exists', filePath),

  // ── Ollama ────────────────────────────────────────────────────
  listModels: (): Promise<{ models: { name: string; size: number }[] }> => ipcRenderer.invoke('ollama:listModels'),
};

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
};
