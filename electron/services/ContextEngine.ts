import { FileSystemService } from './FileSystemService';

export class ContextEngine {
  private fileSystem: FileSystemService;
  constructor(workspacePath: string) {
    this.fileSystem = new FileSystemService(workspacePath);
  }

  /**
   * Retrieves relevant context for the Oracle based on recent files or query.
   */
  async buildContext(activeFiles: string[]): Promise<string> {
    let contextStr = "PROJECT CONTEXT\n\n";
    
    contextStr += "Relevant files observed:\n";
    for (const file of activeFiles) {
      const content = await this.fileSystem.readFileContent(file);
      if (content) {
        contextStr += `--- START ${file} ---\n`;
        contextStr += content;
        contextStr += `\n--- END ${file} ---\n\n`;
      }
    }

    return contextStr;
  }
}
