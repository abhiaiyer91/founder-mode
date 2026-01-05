import OpenAI from 'openai';
import { getAgent } from './agents';
import type { Task, TaskType, TaskPriority } from '../../types';

/**
 * AI Service - Browser-compatible AI integration
 * 
 * This service handles all AI interactions for the game.
 * It uses the OpenAI API directly for browser compatibility.
 * 
 * In a production setup, you could:
 * 1. Use a backend API powered by Mastra
 * 2. Use Mastra's edge runtime
 * 3. Proxy through your own server
 */
export class AIService {
  private client: OpenAI | null = null;
  private _apiKey: string | null = null;
  private enabled: boolean = false;
  private model: string = 'gpt-4o-mini';

  /**
   * Configure the AI service with an API key
   */
  configure(apiKey: string, model: string = 'gpt-4o-mini') {
    this._apiKey = apiKey;
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for browser use
    });
    this.enabled = true;
  }

  /**
   * Get masked API key for display
   */
  getMaskedApiKey(): string | null {
    if (!this._apiKey) return null;
    return `****${this._apiKey.slice(-4)}`;
  }

  /**
   * Check if AI is enabled
   */
  isEnabled(): boolean {
    return this.enabled && !!this.client;
  }

  /**
   * Disable AI (fall back to simulated responses)
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
   * Have an engineer work on a coding task
   */
  async engineerWorkOnTask(task: Task, projectContext: string): Promise<{
    code: string;
    files: { path: string; content: string }[];
    explanation: string;
  }> {
    if (!this.isEnabled() || !this.client) {
      return this.simulateEngineerWork(task);
    }

    try {
      const agent = getAgent('engineer');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `You are working on this task: "${task.title}"

Task type: ${task.type}
Description: ${task.description || 'No additional description'}

Project context: ${projectContext}

Generate the React/TypeScript code needed to complete this task. Create a complete, working component or module.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const code = response.choices[0]?.message?.content || '';
      
      // Extract file path from code comment if present
      const fileMatch = code.match(/\/\/\s*(?:File|Path):\s*(.+)/i);
      const filePath = fileMatch 
        ? fileMatch[1].trim()
        : `src/components/${task.title.replace(/\s+/g, '')}.tsx`;

      return {
        code,
        files: [{ path: filePath, content: code }],
        explanation: `AI completed: ${task.title}`,
      };
    } catch (error) {
      console.error('AI Engineer error:', error);
      return this.simulateEngineerWork(task);
    }
  }

  /**
   * Have a PM break down the project into tasks
   */
  async pmGenerateTasks(
    projectIdea: string,
    existingTasks: string[],
    teamSize: { engineers: number; designers: number; marketers: number }
  ): Promise<{
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    estimatedTicks: number;
  }[]> {
    if (!this.isEnabled() || !this.client) {
      return this.simulatePMTasks(projectIdea, existingTasks);
    }

    try {
      const agent = getAgent('pm');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `Break down this project idea into actionable tasks:

Project Idea: "${projectIdea}"

Current team:
- ${teamSize.engineers} engineer(s)
- ${teamSize.designers} designer(s)
- ${teamSize.marketers} marketer(s)

Existing tasks (avoid duplicates): ${existingTasks.length > 0 ? existingTasks.join(', ') : 'None yet'}

Create 3-5 new tasks that would help build this project. Focus on the most impactful work first.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '[]';
      
      // Try to parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map((t: { title: string; description: string; type: TaskType; priority: TaskPriority; estimatedHours?: number }) => ({
          title: t.title,
          description: t.description || '',
          type: t.type || 'feature',
          priority: t.priority || 'medium',
          estimatedTicks: ((t.estimatedHours || 4) * 15), // Convert hours to ticks
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
    if (!this.isEnabled() || !this.client) {
      return this.simulateDesignerWork(componentName);
    }

    try {
      const agent = getAgent('designer');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `Create CSS styles for a component called "${componentName}".

Purpose: ${purpose}

Create modern, clean CSS with hover states, transitions, and responsive design.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const css = response.choices[0]?.message?.content || '';
      
      return {
        css,
        description: `Design spec for ${componentName}`,
      };
    } catch (error) {
      console.error('AI Designer error:', error);
      return this.simulateDesignerWork(componentName);
    }
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
    if (!this.isEnabled() || !this.client) {
      return this.simulateMarketerWork(productName, contentType);
    }

    try {
      const agent = getAgent('marketer');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `Create ${contentType} marketing content for "${productName}".

Product description: ${productDescription}

Create compelling copy that would convert visitors into users.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Try to extract headline from content
      const lines = content.split('\n').filter(l => l.trim());
      const headline = lines[0]?.replace(/^#+\s*/, '') || `Introducing ${productName}`;
      
      return {
        headline,
        content,
        cta: 'Get Started Free',
      };
    } catch (error) {
      console.error('AI Marketer error:', error);
      return this.simulateMarketerWork(productName, contentType);
    }
  }

  // ============================================
  // Simulation fallbacks when AI is not enabled
  // ============================================

  private simulateEngineerWork(task: Task) {
    const codeTemplates: Record<string, string> = {
      feature: `// File: src/components/${task.title.replace(/\s+/g, '')}.tsx
import { useState, useEffect } from 'react';

interface ${task.title.replace(/\s+/g, '')}Props {
  // Add props here
}

export function ${task.title.replace(/\s+/g, '')}({ }: ${task.title.replace(/\s+/g, '')}Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data or initialize
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="${task.title.replace(/\s+/g, '-').toLowerCase()}">
      <h2>${task.title}</h2>
      {/* Component implementation */}
    </div>
  );
}

export default ${task.title.replace(/\s+/g, '')};`,
      bug: `// File: src/fixes/${task.title.replace(/\s+/g, '-').toLowerCase()}.ts
// Bug Fix: ${task.title}
// 
// Issue: The component was not properly handling edge cases
// Solution: Added proper validation and error handling

export function fix${task.title.replace(/\s+/g, '')}() {
  // Validate input before processing
  const validateInput = (input: unknown): boolean => {
    if (!input) return false;
    // Add validation logic
    return true;
  };

  // Handle edge cases
  const handleEdgeCase = () => {
    try {
      // Implementation
    } catch (error) {
      console.error('Error handled:', error);
    }
  };

  return { validateInput, handleEdgeCase };
}`,
      design: `/* File: src/styles/${task.title.replace(/\s+/g, '-').toLowerCase()}.css */
/* Design: ${task.title} */

.${task.title.replace(/\s+/g, '-').toLowerCase()} {
  background: var(--terminal-bg);
  border: 1px solid var(--terminal-border);
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s ease;
}

.${task.title.replace(/\s+/g, '-').toLowerCase()}:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 255, 136, 0.1);
}`,
      infrastructure: `# File: docker-compose.yml
# Infrastructure: ${task.title}

version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3`,
      marketing: `<!-- File: src/pages/landing.html -->
<!-- Marketing: ${task.title} -->

<section class="hero">
  <h1>Build Something Amazing</h1>
  <p class="subtitle">The fastest way to turn your ideas into reality.</p>
  <div class="cta-buttons">
    <button class="primary">Get Started Free</button>
    <button class="secondary">Watch Demo</button>
  </div>
</section>`,
    };

    const code = codeTemplates[task.type] || codeTemplates.feature;
    
    return {
      code,
      files: [{ 
        path: `src/${task.title.replace(/\s+/g, '-').toLowerCase()}.tsx`, 
        content: code 
      }],
      explanation: `Completed ${task.type}: ${task.title}`,
    };
  }

  private simulatePMTasks(projectIdea: string, existingTasks: string[]) {
    const allTaskIdeas = [
      { title: 'Set up project structure', type: 'infrastructure' as TaskType, priority: 'high' as TaskPriority },
      { title: 'Create user authentication', type: 'feature' as TaskType, priority: 'high' as TaskPriority },
      { title: 'Design main dashboard', type: 'design' as TaskType, priority: 'high' as TaskPriority },
      { title: 'Build API endpoints', type: 'feature' as TaskType, priority: 'medium' as TaskPriority },
      { title: 'Write landing page copy', type: 'marketing' as TaskType, priority: 'medium' as TaskPriority },
      { title: 'Set up CI/CD pipeline', type: 'infrastructure' as TaskType, priority: 'medium' as TaskPriority },
      { title: 'Create onboarding flow', type: 'feature' as TaskType, priority: 'medium' as TaskPriority },
      { title: 'Design mobile responsive', type: 'design' as TaskType, priority: 'low' as TaskPriority },
    ];

    return allTaskIdeas
      .filter(t => !existingTasks.some(e => e.toLowerCase().includes(t.title.toLowerCase())))
      .slice(0, 3)
      .map(t => ({
        ...t,
        description: `AI-generated task for: ${projectIdea.slice(0, 50)}...`,
        estimatedTicks: 60 + Math.floor(Math.random() * 60),
      }));
  }

  private simulateDesignerWork(componentName: string) {
    return {
      css: `/* Styles for ${componentName} */
.${componentName.toLowerCase().replace(/\s+/g, '-')} {
  background: var(--terminal-bg);
  border: 1px solid var(--terminal-border);
  padding: 16px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

.${componentName.toLowerCase().replace(/\s+/g, '-')}:hover {
  border-color: var(--color-accent);
}

.${componentName.toLowerCase().replace(/\s+/g, '-')} .title {
  color: var(--color-accent);
  font-weight: bold;
  margin-bottom: 12px;
}`,
      description: `Modern, clean design for ${componentName}`,
    };
  }

  private simulateMarketerWork(productName: string, contentType: string) {
    return {
      headline: `Build Amazing Things with ${productName}`,
      content: `${productName} is the fastest way to go from idea to launch.

Join thousands of founders who ship faster with our AI-powered development platform.

Stop dreaming. Start building.`,
      cta: contentType === 'email' ? 'Learn More' : 'Get Started Free',
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Re-export agent definitions
export * from './agents';
