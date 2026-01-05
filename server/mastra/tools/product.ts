import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for breaking down a product idea into tasks
 */
export const breakdownProject = createTool({
  id: 'breakdown-project',
  description: 'Break down a product idea into a list of actionable development tasks',
  inputSchema: z.object({
    projectIdea: z.string().describe('The main product or feature idea'),
    targetAudience: z.string().optional().describe('Who the product is for'),
    techStack: z.array(z.string()).default(['React', 'TypeScript']).describe('Technologies to use'),
    teamSize: z.object({
      engineers: z.number(),
      designers: z.number(),
      marketers: z.number(),
    }).describe('Current team composition'),
  }),
  outputSchema: z.object({
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum(['feature', 'bug', 'design', 'marketing', 'infrastructure']),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      estimatedHours: z.number(),
      requiredRole: z.enum(['engineer', 'designer', 'marketer', 'pm']),
      dependencies: z.array(z.string()).optional(),
    })),
    milestones: z.array(z.object({
      name: z.string(),
      tasks: z.array(z.string()),
      targetWeek: z.number(),
    })),
    mvpScope: z.string(),
  }),
  execute: async ({ context }) => {
    const { projectIdea, teamSize } = context;
    
    // Generate contextual tasks based on team size
    const tasks = [];
    
    // Always need setup
    tasks.push({
      title: 'Set up project infrastructure',
      description: 'Initialize repo, configure build tools, set up CI/CD',
      type: 'infrastructure' as const,
      priority: 'critical' as const,
      estimatedHours: 8,
      requiredRole: 'engineer' as const,
      dependencies: [],
    });

    // Core feature
    tasks.push({
      title: 'Implement core feature: ' + projectIdea.split(' ').slice(0, 3).join(' '),
      description: `Build the main functionality for: ${projectIdea}`,
      type: 'feature' as const,
      priority: 'high' as const,
      estimatedHours: 16,
      requiredRole: 'engineer' as const,
      dependencies: ['Set up project infrastructure'],
    });

    if (teamSize.designers > 0) {
      tasks.push({
        title: 'Design system and UI components',
        description: 'Create the visual design system, color palette, and base components',
        type: 'design' as const,
        priority: 'high' as const,
        estimatedHours: 12,
        requiredRole: 'designer' as const,
        dependencies: [],
      });
    }

    if (teamSize.marketers > 0) {
      tasks.push({
        title: 'Create landing page and marketing copy',
        description: 'Write compelling copy for the landing page and prepare launch materials',
        type: 'marketing' as const,
        priority: 'medium' as const,
        estimatedHours: 8,
        requiredRole: 'marketer' as const,
        dependencies: ['Design system and UI components'],
      });
    }

    // User management is almost always needed
    tasks.push({
      title: 'User authentication system',
      description: 'Implement sign up, login, password reset flows',
      type: 'feature' as const,
      priority: 'high' as const,
      estimatedHours: 12,
      requiredRole: 'engineer' as const,
      dependencies: ['Set up project infrastructure'],
    });

    return {
      tasks,
      milestones: [
        { name: 'Foundation', tasks: ['Set up project infrastructure', 'Design system and UI components'], targetWeek: 1 },
        { name: 'Core MVP', tasks: ['Implement core feature', 'User authentication system'], targetWeek: 2 },
        { name: 'Launch Ready', tasks: ['Create landing page and marketing copy'], targetWeek: 3 },
      ],
      mvpScope: `Minimum viable product for "${projectIdea}": Core functionality with user auth and basic UI`,
    };
  },
});

/**
 * Tool for prioritizing tasks
 */
export const prioritizeTasks = createTool({
  id: 'prioritize-tasks',
  description: 'Analyze and prioritize a list of tasks based on impact and effort',
  inputSchema: z.object({
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      currentPriority: z.string(),
      estimatedHours: z.number(),
    })),
    criteria: z.enum(['impact', 'quick-wins', 'dependencies', 'balanced']).default('balanced'),
  }),
  outputSchema: z.object({
    prioritizedTasks: z.array(z.object({
      id: z.string(),
      recommendedPriority: z.enum(['low', 'medium', 'high', 'critical']),
      reason: z.string(),
      suggestedOrder: z.number(),
    })),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { tasks, criteria } = context;
    
    const prioritized = tasks.map((task, index) => ({
      id: task.id,
      recommendedPriority: index < 2 ? 'critical' as const : index < 5 ? 'high' as const : 'medium' as const,
      reason: `Based on ${criteria} analysis`,
      suggestedOrder: index + 1,
    }));

    return {
      prioritizedTasks: prioritized,
      summary: `Prioritized ${tasks.length} tasks using ${criteria} criteria.`,
    };
  },
});

/**
 * Tool for writing user stories
 */
export const writeUserStory = createTool({
  id: 'write-user-story',
  description: 'Create a detailed user story with acceptance criteria',
  inputSchema: z.object({
    feature: z.string().describe('The feature to write a story for'),
    userType: z.string().default('user').describe('The type of user'),
    context: z.string().optional().describe('Additional context about the product'),
  }),
  outputSchema: z.object({
    userStory: z.string(),
    acceptanceCriteria: z.array(z.string()),
    technicalNotes: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { feature, userType } = context;
    
    return {
      userStory: `As a ${userType}, I want to ${feature.toLowerCase()}, so that I can achieve my goal efficiently.`,
      acceptanceCriteria: [
        `Given I am a ${userType}, when I access this feature, then I should see a clear interface`,
        `The feature should load within 2 seconds`,
        `Error states should be handled gracefully with user-friendly messages`,
        `The feature should be accessible via keyboard navigation`,
      ],
      technicalNotes: `Implement using React with proper loading and error states.`,
    };
  },
});

export const productTools = {
  breakdownProject,
  prioritizeTasks,
  writeUserStory,
};
