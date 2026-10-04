export type PermissionLevel = 'ASK' | 'ALLOW' | 'DENY';

export interface ToolPermission {
  name: string;
  level: PermissionLevel;
  dangerous: boolean;
}

export class PermissionManager {
  private permissions: Map<string, ToolPermission> = new Map();

  constructor() {
    // Default Permissions based on requirements
    this.register('read_file', 'ALLOW', false);
    this.register('write_file', 'ASK', false);
    this.register('edit_file', 'ASK', false);
    this.register('list_directory', 'ALLOW', false);
    this.register('search_files', 'ALLOW', false);
    this.register('run_terminal', 'ASK', true);
    this.register('run_tests', 'ALLOW', false);
    this.register('git_status', 'ALLOW', false);
    this.register('git_diff', 'ALLOW', false);
    this.register('git_commit', 'ASK', false);
    this.register('rm', 'ASK', true); // Potentially destructive
  }

  private register(name: string, level: PermissionLevel, dangerous: boolean) {
    this.permissions.set(name, { name, level, dangerous });
  }

  getPermission(toolName: string): ToolPermission {
    return this.permissions.get(toolName) || { name: toolName, level: 'ASK', dangerous: true };
  }

  setPermission(toolName: string, level: PermissionLevel) {
    const existing = this.permissions.get(toolName);
    if (existing) {
      if (existing.dangerous) {
        // Enforce that dangerous tools must ALWAYS be 'ASK' or 'DENY', never 'ALLOW' implicitly
        this.permissions.set(toolName, { ...existing, level: level === 'ALLOW' ? 'ASK' : level });
      } else {
        this.permissions.set(toolName, { ...existing, level });
      }
    }
  }

  async checkPermission(toolName: string, args: any, askCallback: (tool: string, args: any) => Promise<boolean>): Promise<boolean> {
    const perm = this.getPermission(toolName);
    
    // Hardcoded blocks for highly destructive terminal commands if passed via run_terminal
    if (toolName === 'run_terminal' && args.command) {
      const cmd = args.command as string;
      if (cmd.includes('rm -rf') || cmd.includes('sudo') || cmd.includes('git reset --hard') || cmd.includes('git clean')) {
        return await askCallback(toolName, args);
      }
    }

    if (perm.level === 'DENY') return false;
    if (perm.level === 'ALLOW') return true;
    
    // Level is ASK
    return await askCallback(toolName, args);
  }
}
