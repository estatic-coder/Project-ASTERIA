import { PermissionManager } from './PermissionManager';
import { ToolRegistry } from './ToolRegistry';
import { FileSystemService } from '../FileSystemService';
import { GitService } from '../GitService';

export interface AgentActivity {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'denied' | 'waiting_permission';
  detail: string;
}

export class OracleAgent {
  private permissionManager: PermissionManager;
  private toolRegistry: ToolRegistry;

  constructor(workspacePath: string) {
    this.permissionManager = new PermissionManager();
    const fsService = new FileSystemService(workspacePath);
    const gitService = new GitService(workspacePath);
    this.toolRegistry = new ToolRegistry(fsService, gitService, workspacePath);
  }

  /**
   * Main execution loop for the agent.
   * In a complete app, this would query Ollama, parse JSON tool calls, and execute.
   * Here we mock a multi-step plan to demonstrate the timeline and permission system.
   */
  async executePlan(
    prompt: string, 
    onActivityUpdate: (activity: AgentActivity) => void,
    requestPermission: (tool: string, args: any) => Promise<boolean>
  ) {
    const activities: AgentActivity[] = [];
    const update = (act: AgentActivity) => {
      const idx = activities.findIndex(a => a.id === act.id);
      if (idx >= 0) activities[idx] = act;
      else activities.push(act);
      onActivityUpdate(act);
    };

    // Step 1: Observe
    const act1: AgentActivity = { id: '1', tool: 'git_status', status: 'running', detail: 'Checking project state' };
    update(act1);
    await new Promise(r => setTimeout(r, 800));
    
    const allowed1 = await this.permissionManager.checkPermission('git_status', {}, requestPermission);
    if (allowed1) {
      const tool = this.toolRegistry.getTool('git_status');
      if (tool) await tool.execute({});
      update({ ...act1, status: 'success', detail: 'Checked project state' });
    }

    // Step 2: Read
    const act2: AgentActivity = { id: '2', tool: 'read_file', status: 'running', detail: 'Reading package.json' };
    update(act2);
    await new Promise(r => setTimeout(r, 1000));
    update({ ...act2, status: 'success', detail: 'Read package.json' });

    // Step 3: Edit (Requires Permission)
    const act3: AgentActivity = { id: '3', tool: 'edit_file', status: 'waiting_permission', detail: 'Preparing to modify configuration' };
    update(act3);
    
    const allowed3 = await this.permissionManager.checkPermission('edit_file', { file: 'package.json' }, requestPermission);
    
    if (!allowed3) {
      update({ ...act3, status: 'denied', detail: 'Permission denied by user' });
      return;
    }
    
    update({ ...act3, status: 'running', detail: 'Applying changes' });
    await new Promise(r => setTimeout(r, 1500));
    update({ ...act3, status: 'success', detail: 'Applied changes to package.json' });

    // Step 4: Run Tests
    const act4: AgentActivity = { id: '4', tool: 'run_terminal', status: 'running', detail: 'Running test suite' };
    update(act4);
    await new Promise(r => setTimeout(r, 1200));
    update({ ...act4, status: 'success', detail: 'Tests passed' });
  }
}
