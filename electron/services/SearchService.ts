import { FileSystemService } from './FileSystemService';

export class SearchService {
  private fileSystem: FileSystemService;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.fileSystem = new FileSystemService(workspacePath);
  }

  async searchFilesByName(query: string): Promise<string[]> {
    const results: string[] = [];
    
    // Naive recursive search mock
    const searchRecursive = async (dir: string) => {
      const tree = await this.fileSystem.getProjectTree(dir);
      for (const node of tree) {
        if (node.type === 'file' && node.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(node.path);
        } else if (node.type === 'folder' && node.children) {
          await searchRecursive(node.path);
        }
      }
    };
    
    await searchRecursive(this.workspacePath);
    return results;
  }

  async searchSemantic(query: string): Promise<any[]> {
    // Mocking semantic search behavior
    return [
      { file: 'src/components/OraclePanel.tsx', score: 0.95, snippet: 'Implement dark mode toggle...' },
      { file: 'src/App.tsx', score: 0.82, snippet: 'const [oracleOpen, setOracleOpen] = useState(true);' }
    ];
  }
}
