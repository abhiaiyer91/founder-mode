import OpenAI from 'openai';
import { getAgent, getEmployeeSystemPrompt } from './agents';
import { mastraClient } from './mastra-client';
import type { Task, TaskType, TaskPriority, Employee } from '../../types';

/**
 * AI Service - Unified AI integration for Founder Mode
 * 
 * This service provides a unified interface that:
 * 1. Uses the Mastra server when available (full power!)
 * 2. Falls back to direct OpenAI when server is unavailable but API key is set
 * 3. Uses simulation mode when neither is available
 */
export class AIService {
  private client: OpenAI | null = null;
  private _apiKey: string | null = null;
  private enabled: boolean = false;
  private model: string = 'gpt-4o-mini';
  private useMastraServer: boolean = false;

  /**
   * Initialize the AI service
   * Checks for Mastra server first, then falls back to OpenAI
   */
  async initialize(): Promise<{ mode: 'mastra' | 'openai' | 'simulation' }> {
    // Try to connect to Mastra server first
    const mastraConnected = await mastraClient.checkHealth();
    
    if (mastraConnected) {
      this.useMastraServer = true;
      this.enabled = true;
      console.log('🤖 Connected to Mastra server');
      return { mode: 'mastra' };
    }
    
    // Fall back to OpenAI if API key is set
    if (this._apiKey && this.client) {
      this.useMastraServer = false;
      this.enabled = true;
      return { mode: 'openai' };
    }
    
    return { mode: 'simulation' };
  }

  /**
   * Configure with OpenAI API key (fallback mode)
   */
  configure(apiKey: string, model: string = 'gpt-4o-mini') {
    this._apiKey = apiKey;
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.enabled = true;
  }

  /**
   * Check if AI is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if using Mastra server
   */
  isMastraMode(): boolean {
    return this.useMastraServer && mastraClient.isConnected();
  }

  /**
   * Disable AI
   */
  disable() {
    this.enabled = false;
    this.client = null;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get masked API key for display
   */
  getMaskedApiKey(): string | null {
    if (!this._apiKey) return null;
    return `****${this._apiKey.slice(-4)}`;
  }

  /**
   * Have an engineer work on a coding task
   * @param task - The task to work on
   * @param projectContext - Context about the project
   * @param employee - Optional employee for custom prompts
   */
  async engineerWorkOnTask(task: Task, projectContext: string, employee?: Employee): Promise<{
    code: string;
    files: { path: string; content: string }[];
    explanation: string;
  }> {
    // Try Mastra server first
    if (this.isMastraMode()) {
      try {
        const result = await mastraClient.engineerWork(task, projectContext, employee);
        
        // Extract code from tool calls if available
        const toolResult = result.toolCalls?.[0]?.result;
        const code = toolResult?.componentCode || toolResult?.code || result.code;
        const filePath = toolResult?.filePath || `src/components/${task.title.replace(/\s+/g, '')}.tsx`;
        
        return {
          code,
          files: [{ path: filePath, content: code }],
          explanation: `Mastra agent completed: ${task.title}`,
        };
      } catch (error) {
        console.warn('Mastra engineer failed, falling back:', error);
      }
    }

    // Fall back to direct OpenAI
    if (!this.enabled || !this.client) {
      return this.simulateEngineerWork(task);
    }

    try {
      // Use employee-specific prompt if available, otherwise use default agent
      const systemPrompt = employee 
        ? getEmployeeSystemPrompt(employee)
        : getAgent('engineer').systemPrompt;
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Work on this task: "${task.title}"\n\nType: ${task.type}\nDescription: ${task.description || 'No description'}\n\nProject: ${projectContext}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const code = response.choices[0]?.message?.content || '';
      
      return {
        code,
        files: [{ path: `src/components/${task.title.replace(/\s+/g, '')}.tsx`, content: code }],
        explanation: `AI completed: ${task.title}`,
      };
    } catch (error) {
      console.error('AI Engineer error:', error);
      return this.simulateEngineerWork(task);
    }
  }

  /**
   * Have a PM break down the project into tasks
   * @param projectIdea - The project idea to break down
   * @param existingTasks - Already created tasks
   * @param teamSize - Current team composition
   * @param employee - Optional employee for custom prompts
   */
  async pmGenerateTasks(
    projectIdea: string,
    existingTasks: string[],
    teamSize: { engineers: number; designers: number; marketers: number },
    employee?: Employee
  ): Promise<{
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    estimatedTicks: number;
  }[]> {
    // Try Mastra server first
    if (this.isMastraMode()) {
      try {
        const result = await mastraClient.pmBreakdown(projectIdea, existingTasks, teamSize, employee);
        
        // Extract tasks from tool calls
        const toolResult = result.toolCalls?.[0]?.result;
        if (toolResult?.tasks) {
          return toolResult.tasks.map(t => ({
            title: t.title,
            description: t.description,
            type: t.type,
            priority: t.priority,
            estimatedTicks: (t.estimatedHours || 4) * 15,
          }));
        }
      } catch (error) {
        console.warn('Mastra PM failed, falling back:', error);
      }
    }

    // Fall back to direct OpenAI
    if (!this.enabled || !this.client) {
      return this.simulatePMTasks(projectIdea, existingTasks);
    }

    try {
      // Use employee-specific prompt if available, otherwise use default agent
      const systemPrompt = employee 
        ? getEmployeeSystemPrompt(employee)
        : getAgent('pm').systemPrompt;
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Break down: "${projectIdea}"\n\nTeam: ${teamSize.engineers} engineers, ${teamSize.designers} designers, ${teamSize.marketers} marketers\n\nExisting: ${existingTasks.join(', ') || 'None'}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map((t: { title: string; description: string; type: TaskType; priority: TaskPriority; estimatedHours?: number }) => ({
          title: t.title,
          description: t.description || '',
          type: t.type || 'feature',
          priority: t.priority || 'medium',
          estimatedTicks: ((t.estimatedHours || 4) * 15),
        }));
      }
      
      return this.simulatePMTasks(projectIdea, existingTasks);
    } catch (error) {
      console.error('AI PM error:', error);
      return this.simulatePMTasks(projectIdea, existingTasks);
    }
  }

  /**
   * Have a designer create a design spec
   */
  async designerCreateSpec(componentName: string, purpose: string): Promise<{
    css: string;
    description: string;
  }> {
    // Try Mastra server first
    if (this.isMastraMode()) {
      try {
        const result = await mastraClient.designerCreate(componentName, 'custom', purpose);
        const toolResult = result.toolCalls?.[0]?.result;
        
        return {
          css: toolResult?.css || result.css,
          description: `Mastra designed: ${componentName}`,
        };
      } catch (error) {
        console.warn('Mastra designer failed, falling back:', error);
      }
    }

    // Fall back to simulation
    return this.simulateDesignerWork(componentName);
  }

  /**
   * Have a marketer create content
   */
  async marketerCreateContent(
    productName: string,
    productDescription: string,
    contentType: 'landing-page' | 'social-media' | 'email'
  ): Promise<{
    headline: string;
    content: string;
    cta: string;
  }> {
    // Try Mastra server first
    if (this.isMastraMode()) {
      try {
        const result = await mastraClient.marketerCreate(contentType, productName, productDescription);
        const toolResult = result.toolCalls?.[0]?.result;
        
        if (toolResult?.hero) {
          return {
            headline: toolResult.hero.headline,
            content: result.content,
            cta: toolResult.hero.cta,
          };
        }
        
        return {
          headline: `${productName}`,
          content: result.content,
          cta: 'Get Started',
        };
      } catch (error) {
        console.warn('Mastra marketer failed, falling back:', error);
      }
    }

    // Fall back to simulation
    return this.simulateMarketerWork(productName);
  }

  // ============================================
  // Simulation fallbacks
  // ============================================

  private simulateEngineerWork(task: Task) {
    const code = `// File: src/components/${task.title.replace(/\s+/g, '')}.tsx
// ${task.type}: ${task.title}

import { useState } from 'react';

export function ${task.title.replace(/\s+/g, '')}() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="${task.title.replace(/\s+/g, '-').toLowerCase()}">
      <h2>${task.title}</h2>
      {/* Implementation */}
    </div>
  );
}`;
    
    return {
      code,
      files: [{ path: `src/components/${task.title.replace(/\s+/g, '')}.tsx`, content: code }],
      explanation: `Simulated: ${task.title}`,
    };
  }

  private simulatePMTasks(projectIdea: string, existingTasks: string[]) {
    const ideas = [
      { title: 'Set up project', type: 'infrastructure' as TaskType, priority: 'high' as TaskPriority },
      { title: 'Core feature', type: 'feature' as TaskType, priority: 'high' as TaskPriority },
      { title: 'Design system', type: 'design' as TaskType, priority: 'medium' as TaskPriority },
    ];

    return ideas
      .filter(t => !existingTasks.includes(t.title))
      .map(t => ({
        ...t,
        description: `For: ${projectIdea.slice(0, 50)}`,
        estimatedTicks: 60,
      }));
  }

  private simulateDesignerWork(componentName: string) {
    return {
      css: `.${componentName.toLowerCase()} { /* styles */ }`,
      description: `Simulated design for ${componentName}`,
    };
  }

  private simulateMarketerWork(productName: string) {
    return {
      headline: `Build with ${productName}`,
      content: `${productName} helps you ship faster.`,
      cta: 'Get Started',
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Re-exports
export { mastraClient } from './mastra-client';
export * from './agents';
