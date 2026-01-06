/**
 * Mastra Client - Connects to the Mastra server from the browser
 * 
 * This client provides a clean interface to interact with the Mastra-powered
 * AI agents running on the server.
 */

import type { Task, TaskType, TaskPriority } from '../../types';

const DEFAULT_SERVER_URL = 'http://localhost:3001';

export interface MastraClientConfig {
  serverUrl?: string;
}

export interface AgentResponse {
  role: string;
  text: string;
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
}

export interface EngineerWorkResult {
  success: boolean;
  code: string;
  toolCalls?: Array<{
    toolName: string;
    result: {
      componentCode?: string;
      cssCode?: string;
      filePath?: string;
      code?: string;
    };
  }>;
}

export interface PMBreakdownResult {
  success: boolean;
  response: string;
  toolCalls?: Array<{
    toolName: string;
    result: {
      tasks: Array<{
        title: string;
        description: string;
        type: TaskType;
        priority: TaskPriority;
        estimatedHours: number;
        requiredRole: string;
      }>;
      milestones: Array<{
        name: string;
        tasks: string[];
        targetWeek: number;
      }>;
      mvpScope: string;
    };
  }>;
}

export interface DesignerCreateResult {
  success: boolean;
  css: string;
  toolCalls?: Array<{
    toolName: string;
    result: {
      css: string;
      usage: string;
    };
  }>;
}

export interface MarketerCreateResult {
  success: boolean;
  content: string;
  toolCalls?: Array<{
    toolName: string;
    result: {
      hero?: { headline: string; subheadline: string; cta: string };
      post?: string;
      subjectLine?: string;
      body?: string;
    };
  }>;
}

/**
 * Client for interacting with the Mastra AI server
 */
export class MastraClient {
  private serverUrl: string;
  private connected: boolean = false;

  constructor(config: MastraClientConfig = {}) {
    this.serverUrl = config.serverUrl || DEFAULT_SERVER_URL;
  }

  /**
   * Check if the Mastra server is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        this.connected = data.status === 'ok';
        return this.connected;
      }
      return false;
    } catch {
      this.connected = false;
      return false;
    }
  }

  /**
   * Check if connected to the server
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Set the server URL
   */
  setServerUrl(url: string) {
    this.serverUrl = url;
    this.connected = false;
  }

  /**
   * Generate a response from any agent
   */
  async generate(role: 'engineer' | 'pm' | 'designer' | 'marketer', prompt: string): Promise<AgentResponse> {
    const response = await fetch(`${this.serverUrl}/api/agents/${role}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Agent request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Have an engineer work on a task
   */
  async engineerWork(task: Task, projectContext: string): Promise<EngineerWorkResult> {
    const response = await fetch(`${this.serverUrl}/api/engineer/work`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, projectContext }),
    });

    if (!response.ok) {
      throw new Error(`Engineer work request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Have a PM break down a project into tasks
   */
  async pmBreakdown(
    projectIdea: string,
    existingTasks: string[] = [],
    teamSize: { engineers: number; designers: number; marketers: number } = { engineers: 1, designers: 0, marketers: 0 }
  ): Promise<PMBreakdownResult> {
    const response = await fetch(`${this.serverUrl}/api/pm/breakdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIdea, existingTasks, teamSize }),
    });

    if (!response.ok) {
      throw new Error(`PM breakdown request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Have a designer create styles
   */
  async designerCreate(
    componentName: string,
    componentType: 'button' | 'card' | 'input' | 'modal' | 'nav' | 'list' | 'custom',
    description: string
  ): Promise<DesignerCreateResult> {
    const response = await fetch(`${this.serverUrl}/api/designer/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentName, componentType, description }),
    });

    if (!response.ok) {
      throw new Error(`Designer create request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Have a marketer create content
   */
  async marketerCreate(
    contentType: 'landing-page' | 'social-media' | 'email',
    productName: string,
    productDescription: string,
    targetAudience?: string
  ): Promise<MarketerCreateResult> {
    const response = await fetch(`${this.serverUrl}/api/marketer/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, productName, productDescription, targetAudience }),
    });

    if (!response.ok) {
      throw new Error(`Marketer create request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute a specific tool directly
   */
  async executeTool<T = unknown>(toolId: string, input: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.serverUrl}/api/tools/${toolId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error(`Tool execution failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result as T;
  }
}

// Export singleton instance
export const mastraClient = new MastraClient();
