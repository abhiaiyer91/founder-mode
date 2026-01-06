import { mastraClient } from './mastra-client';
import type { Task, TaskType, TaskPriority, Employee } from '../../types';
import { getEmployeeSystemPrompt } from './agents';

/**
 * AI Service - Unified AI integration for Founder Mode
 * 
 * This service provides a unified interface that:
 * 1. Uses the Mastra server when available (full power!)
 * 2. Falls back to simulation mode when server is unavailable
 * 
 * All AI calls go through Mastra - no direct OpenAI client usage.
 */
export class AIService {
  private enabled: boolean = false;
  private model: string = 'gpt-4o-mini';

  /**
   * Initialize the AI service
   * Checks for Mastra server connection
   */
  async initialize(): Promise<{ mode: 'mastra' | 'simulation' }> {
    const mastraConnected = await mastraClient.checkHealth();
    
    if (mastraConnected) {
      this.enabled = true;
      console.log('Connected to Mastra server');
      return { mode: 'mastra' };
    }
    
    this.enabled = false;
    return { mode: 'simulation' };
  }

  /**
   * Check if AI is enabled (Mastra server connected)
   */
  isEnabled(): boolean {
    return this.enabled && mastraClient.isConnected();
  }

  /**
   * Check if using Mastra server
   */
  isMastraMode(): boolean {
    return mastraClient.isConnected();
  }

  /**
   * Enable AI (when Mastra server is available)
   */
  enable() {
    if (mastraClient.isConnected()) {
      this.enabled = true;
    }
  }

  /**
   * Disable AI
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Set the model (for display purposes - actual model is controlled by Mastra server)
   */
  setModel(model: string) {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
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
    // Use Mastra server
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
        console.warn('Mastra engineer failed, falling back to simulation:', error);
      }
    }

    // Fall back to simulation
    return this.simulateEngineerWork(task);
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
    // Use Mastra server
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
        console.warn('Mastra PM failed, falling back to simulation:', error);
      }
    }

    // Fall back to simulation
    return this.simulatePMTasks(projectIdea, existingTasks);
  }

  /**
   * Have a designer create a design spec
   */
  async designerCreateSpec(componentName: string, purpose: string): Promise<{
    css: string;
    description: string;
  }> {
    // Use Mastra server
    if (this.isMastraMode()) {
      try {
        const result = await mastraClient.designerCreate(componentName, 'custom', purpose);
        const toolResult = result.toolCalls?.[0]?.result;
        
        return {
          css: toolResult?.css || result.css,
          description: `Mastra designed: ${componentName}`,
        };
      } catch (error) {
        console.warn('Mastra designer failed, falling back to simulation:', error);
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
    // Use Mastra server
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
        console.warn('Mastra marketer failed, falling back to simulation:', error);
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
