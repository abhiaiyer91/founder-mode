/**
 * Missions - PM-created feature branches as git worktrees
 * 
 * Each mission represents a larger feature/epic that:
 * - Has its own git branch (worktree)
 * - Contains multiple tasks
 * - Can be pushed and merged independently
 */

export type MissionStatus = 
  | 'planning'      // PM is breaking down the mission
  | 'active'        // Tasks are being worked on
  | 'review'        // All tasks done, needs review
  | 'merging'       // Being merged to main
  | 'completed'     // Successfully merged
  | 'abandoned';    // Cancelled

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Mission {
  id: string;
  name: string;
  description: string;
  priority: MissionPriority;
  status: MissionStatus;
  
  // Git integration
  branchName: string;           // e.g., "mission/user-auth"
  worktreePath: string | null;  // Local path to worktree (server-side)
  baseBranch: string;           // Branch this was created from (usually "main")
  
  // Task tracking
  taskIds: string[];            // Tasks belonging to this mission
  
  // Progress
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  
  // Commits
  commits: MissionCommit[];
  
  // GitHub PR (if created)
  pullRequestUrl: string | null;
  pullRequestNumber: number | null;
}

export interface MissionCommit {
  sha: string;
  message: string;
  timestamp: number;
  filesChanged: string[];
}

export interface MissionBreakdown {
  missionId: string;
  suggestedTasks: Array<{
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedTicks: number;
    dependencies?: string[]; // Other task titles this depends on
  }>;
  estimatedTotalTicks: number;
  requiredRoles: Array<'engineer' | 'designer' | 'pm' | 'marketer'>;
}

// Mission templates for common patterns
export const MISSION_TEMPLATES: Array<{
  name: string;
  description: string;
  taskPatterns: Array<{
    titleTemplate: string;
    type: 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';
  }>;
}> = [
  {
    name: 'User Authentication',
    description: 'Add user login, signup, and session management',
    taskPatterns: [
      { titleTemplate: 'Create auth database schema', type: 'infrastructure' },
      { titleTemplate: 'Build login form component', type: 'feature' },
      { titleTemplate: 'Build signup form component', type: 'feature' },
      { titleTemplate: 'Implement session management', type: 'feature' },
      { titleTemplate: 'Design auth UI/UX', type: 'design' },
      { titleTemplate: 'Add password reset flow', type: 'feature' },
    ],
  },
  {
    name: 'Dashboard Feature',
    description: 'Create a dashboard with charts and metrics',
    taskPatterns: [
      { titleTemplate: 'Design dashboard layout', type: 'design' },
      { titleTemplate: 'Create dashboard page component', type: 'feature' },
      { titleTemplate: 'Build chart components', type: 'feature' },
      { titleTemplate: 'Add data fetching layer', type: 'feature' },
      { titleTemplate: 'Implement real-time updates', type: 'feature' },
    ],
  },
  {
    name: 'API Integration',
    description: 'Integrate with external API',
    taskPatterns: [
      { titleTemplate: 'Design API client architecture', type: 'infrastructure' },
      { titleTemplate: 'Create API client module', type: 'feature' },
      { titleTemplate: 'Add error handling and retries', type: 'feature' },
      { titleTemplate: 'Write API documentation', type: 'infrastructure' },
      { titleTemplate: 'Add rate limiting', type: 'feature' },
    ],
  },
  {
    name: 'Landing Page',
    description: 'Create marketing landing page',
    taskPatterns: [
      { titleTemplate: 'Design landing page mockup', type: 'design' },
      { titleTemplate: 'Build hero section', type: 'feature' },
      { titleTemplate: 'Create feature highlights section', type: 'feature' },
      { titleTemplate: 'Add testimonials section', type: 'feature' },
      { titleTemplate: 'Write landing page copy', type: 'marketing' },
      { titleTemplate: 'Add call-to-action buttons', type: 'feature' },
      { titleTemplate: 'Implement responsive design', type: 'design' },
    ],
  },
];
