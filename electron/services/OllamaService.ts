import http from 'http';

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
}

export class OllamaService {
  private baseUrl = 'http://127.0.0.1:11434';

  /**
   * Checks if Ollama is running and returns the list of available models.
   */
  async getModels(): Promise<{ success: boolean; models?: OllamaModel[]; error?: string }> {
    return new Promise((resolve) => {
      const req = http.get(`${this.baseUrl}/api/tags`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: true, models: parsed.models });
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse Ollama response' });
          }
        });
      });

      req.on('error', (_e) => {
        resolve({ success: false, error: 'Ollama is not running or not reachable at ' + this.baseUrl });
      });

      req.setTimeout(2000, () => {
        req.destroy();
        resolve({ success: false, error: 'Connection to Ollama timed out' });
      });
    });
  }

  /**
   * Simple non-streaming or streaming mock generation endpoint.
   * For the phase 3 scaffold, we provide a unified signature.
   */
  async generateResponse(model: string, prompt: string, onToken: (token: string) => void): Promise<string> {
    // In a full implementation, we'd use http.request to POST to /api/chat with stream: true
    // Here we provide the architectural skeleton and mock the behavior if Ollama isn't active
    return new Promise((resolve) => {
      const mockResponse = `This is a simulated response from the Oracle using ${model}. I observed the prompt: "${prompt}". Let me plan out the next steps.`;
      let currentIdx = 0;
      
      const interval = setInterval(() => {
        if (currentIdx < mockResponse.length) {
          const chunk = mockResponse.slice(currentIdx, currentIdx + 5);
          onToken(chunk);
          currentIdx += 5;
        } else {
          clearInterval(interval);
          resolve(mockResponse);
        }
      }, 50);
    });
  }
}
