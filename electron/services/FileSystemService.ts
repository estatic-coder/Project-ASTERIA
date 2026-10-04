import fs from 'fs/promises';
import path from 'path';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export class FileSystemService {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async getProjectTree(dir: string = this.workspacePath): Promise<FileNode[]> {
    const nodes: FileNode[] = [];
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name === 'node_modules' || item.name === '.git') continue;

        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          nodes.push({
            name: item.name,
            path: fullPath,
            type: 'folder',
            children: await this.getProjectTree(fullPath)
          });
        } else {
          nodes.push({
            name: item.name,
            path: fullPath,
            type: 'file'
          });
        }
      }
    } catch (error) {
      console.error('Failed to read directory:', error);
    }
    return nodes;
  }

  async readFileContent(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(path.join(this.workspacePath, filePath), 'utf-8');
    } catch {
      return null;
    }
  }
}
