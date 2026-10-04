import { ipcMain } from 'electron';
import { GitService } from './GitService';
import { FileSystemService } from './FileSystemService';
import { SearchService } from './SearchService';
import { ContextEngine } from './ContextEngine';
import { DiagnosticsService } from './DiagnosticsService';

export function setupIPC(workspacePath: string) {
  const gitService = new GitService(workspacePath);
  const fileSystem = new FileSystemService(workspacePath);
  const searchService = new SearchService(workspacePath);
  const contextEngine = new ContextEngine(workspacePath);
  const diagnostics = new DiagnosticsService(workspacePath);

  // File System
  ipcMain.handle('fs:getTree', async () => await fileSystem.getProjectTree());
  ipcMain.handle('fs:readFile', async (_, path) => await fileSystem.readFileContent(path));

  // Git
  ipcMain.handle('git:getStatus', async () => await gitService.getStatus());
  ipcMain.handle('git:getDiff', async (_, path) => await gitService.getDiff(path));
  ipcMain.handle('git:getBranch', async () => await gitService.getBranch());

  // Search
  ipcMain.handle('search:files', async (_, query) => await searchService.searchFilesByName(query));
  ipcMain.handle('search:semantic', async (_, query) => await searchService.searchSemantic(query));

  // Context & Diagnostics
  ipcMain.handle('context:build', async (_, files) => await contextEngine.buildContext(files));
  ipcMain.handle('diagnostics:get', async () => await diagnostics.getDiagnostics());
}
