import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);

export class GitService {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async getStatus(): Promise<any> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.workspacePath });
      const files = stdout.split('\n').filter(Boolean).map(line => {
        const status = line.slice(0, 2);
        const file = line.slice(3);
        return { status, file };
      });
      return { success: true, files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDiff(filePath?: string): Promise<any> {
    try {
      const command = filePath ? `git diff HEAD -- ${filePath}` : 'git diff HEAD';
      const { stdout } = await execAsync(command, { cwd: this.workspacePath });
      return { success: true, diff: stdout };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBranch(): Promise<any> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.workspacePath });
      return { success: true, branch: stdout.trim() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
