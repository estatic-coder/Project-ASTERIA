import { FileSystemService } from '../FileSystemService';
import { GitService } from '../GitService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ToolFunction = (args: any) => Promise<any>;

export interface ToolDefinition {
  name: string;
  description: string;
  execute: ToolFunction;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor(
    private fileSystem: FileSystemService,
    private gitService: GitService,
    private workspacePath: string
  ) {
    this.registerCoreTools();
  }

  private registerCoreTools() {
    this.register({
      name: 'read_file',
      description: 'Read the contents of a file',
      execute: async ({ path }) => await this.fileSystem.readFileContent(path)
    });

    this.register({
      name: 'list_directory',
      description: 'List contents of a directory',
      execute: async ({ path }) => await this.fileSystem.getProjectTree(path)
    });

    this.register({
      name: 'git_status',
      description: 'Check git status',
      execute: async () => await this.gitService.getStatus()
    });

    this.register({
      name: 'run_terminal',
      description: 'Run a shell command',
      execute: async ({ command }) => {
        try {
          const { stdout, stderr } = await execAsync(command, { cwd: this.workspacePath });
          return { stdout, stderr };
        } catch (e: any) {
          return { error: e.message };
        }
      }
    });
  }

  private register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}
