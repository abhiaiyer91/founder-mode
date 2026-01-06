/**
 * PM Brain - Continuous product thinking loop
 * 
 * The PM agent continuously evaluates the state of the product and:
 * 1. Identifies what's missing or needs improvement
 * 2. Creates epics (high-level goals)
 * 3. Breaks epics into missions (feature branches)
 * 4. Breaks missions into tasks (individual work items)
 * 
 * This creates a multi-level hierarchy:
 * Epic (big goal) → Mission (feature branch) → Task (single PR/commit)
 */

import type { 
  Task, 
  Employee, 
  Project,
  Mission,
  MissionPriority,
} from '../../types';

// ============================================
// Types
// ============================================

export type EpicStatus = 'planned' | 'active' | 'completed' | 'blocked';
export type ProductPhase = 'mvp' | 'growth' | 'scale' | 'mature';

export interface Epic {
  id: string;
  name: string;
  description: string;
  status: EpicStatus;
  priority: MissionPriority;
  missionIds: string[];
  createdAt: number;
  completedAt: number | null;
  phase: ProductPhase; // When this epic is relevant
}

export interface ProductState {
  phase: ProductPhase;
  hasAuth: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
  hasUI: boolean;
  hasLanding: boolean;
  hasPricing: boolean;
  hasOnboarding: boolean;
  hasAnalytics: boolean;
  hasTesting: boolean;
  hasCI: boolean;
  hasDocumentation: boolean;
  featureCount: number;
  bugCount: number;
  techDebtScore: number; // 0-100
  userFeedbackScore: number; // 0-100
}

export interface PMThought {
  type: 'observation' | 'priority' | 'decision' | 'action';
  message: string;
  timestamp: number;
}

export interface PMState {
  thoughts: PMThought[];
  productState: ProductState;
  epics: Epic[];
  lastEvaluation: number;
  autoGenerateEnabled: boolean;
}

// ============================================
// Product Analysis
// ============================================

/**
 * Analyze current product state from tasks and missions
 */
export function analyzeProductState(
  _project: Project | null, // Used for future product name analysis
  tasks: Task[],
  missions: Mission[],
  tick: number
): ProductState {
  const completedTasks = tasks.filter(t => t.status === 'done');
  const taskTitles = completedTasks.map(t => t.title.toLowerCase()).join(' ');
  const missionNames = missions.map(m => m.name.toLowerCase()).join(' ');
  const searchText = taskTitles + ' ' + missionNames;
  
  // Detect what features exist based on task/mission names
  const hasAuth = /auth|login|signup|session|password/.test(searchText);
  const hasDatabase = /database|schema|model|migration|postgres|mongo/.test(searchText);
  const hasAPI = /api|endpoint|route|rest|graphql/.test(searchText);
  const hasUI = /component|page|screen|dashboard|interface|ui/.test(searchText);
  const hasLanding = /landing|hero|marketing|homepage/.test(searchText);
  const hasPricing = /pricing|payment|stripe|billing|subscription/.test(searchText);
  const hasOnboarding = /onboard|tutorial|wizard|guide|welcome/.test(searchText);
  const hasAnalytics = /analytics|tracking|metrics|dashboard|chart/.test(searchText);
  const hasTesting = /test|spec|jest|cypress|coverage/.test(searchText);
  const hasCI = /ci|deploy|pipeline|github action|vercel/.test(searchText);
  const hasDocumentation = /readme|doc|guide|api doc/.test(searchText);
  
  // Count features and bugs
  const featureCount = completedTasks.filter(t => t.type === 'feature').length;
  const bugCount = tasks.filter(t => t.type === 'bug' && t.status !== 'done').length;
  
  // Estimate tech debt (based on age of tasks, lack of testing, etc.)
  const avgTaskAge = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => sum + (tick - t.createdAt), 0) / completedTasks.length
    : 0;
  const techDebtScore = Math.min(100, Math.max(0, 
    (hasTesting ? 0 : 30) + 
    (hasCI ? 0 : 20) + 
    (bugCount * 5) +
    (avgTaskAge > 1000 ? 20 : 0)
  ));
  
  // Determine product phase based on features
  let phase: ProductPhase = 'mvp';
  const coreFeatures = [hasAuth, hasDatabase, hasAPI, hasUI].filter(Boolean).length;
  const growthFeatures = [hasLanding, hasPricing, hasOnboarding, hasAnalytics].filter(Boolean).length;
  
  if (coreFeatures >= 3 && growthFeatures >= 2) {
    phase = 'scale';
  } else if (coreFeatures >= 2 && growthFeatures >= 1) {
    phase = 'growth';
  } else if (coreFeatures >= 1) {
    phase = 'mvp';
  }
  
  return {
    phase,
    hasAuth,
    hasDatabase,
    hasAPI,
    hasUI,
    hasLanding,
    hasPricing,
    hasOnboarding,
    hasAnalytics,
    hasTesting,
    hasCI,
    hasDocumentation,
    featureCount,
    bugCount,
    techDebtScore,
    userFeedbackScore: 50, // Default, could be enhanced later
  };
}

// ============================================
// Mission Generation Templates
// ============================================

interface MissionTemplate {
  name: string;
  description: string;
  priority: MissionPriority;
  phase: ProductPhase[];
  requiredCondition: (state: ProductState) => boolean;
  tasks: Array<{
    title: string;
    type: 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';
    estimatedTicks: number;
  }>;
}

export const MISSION_GENERATION_TEMPLATES: MissionTemplate[] = [
  // MVP Phase
  {
    name: 'Core Database Setup',
    description: 'Set up the database schema and models for the application',
    priority: 'critical',
    phase: ['mvp'],
    requiredCondition: (state) => !state.hasDatabase,
    tasks: [
      { title: 'Design database schema', type: 'infrastructure', estimatedTicks: 300 },
      { title: 'Create database models', type: 'feature', estimatedTicks: 400 },
      { title: 'Set up migrations', type: 'infrastructure', estimatedTicks: 200 },
      { title: 'Add seed data', type: 'infrastructure', estimatedTicks: 150 },
    ],
  },
  {
    name: 'User Authentication',
    description: 'Implement secure user authentication with login, signup, and session management',
    priority: 'critical',
    phase: ['mvp'],
    requiredCondition: (state) => state.hasDatabase && !state.hasAuth,
    tasks: [
      { title: 'Create user model', type: 'feature', estimatedTicks: 200 },
      { title: 'Build signup flow', type: 'feature', estimatedTicks: 350 },
      { title: 'Build login flow', type: 'feature', estimatedTicks: 300 },
      { title: 'Implement session management', type: 'feature', estimatedTicks: 250 },
      { title: 'Add password reset', type: 'feature', estimatedTicks: 300 },
      { title: 'Design auth UI', type: 'design', estimatedTicks: 200 },
    ],
  },
  {
    name: 'API Foundation',
    description: 'Create the core API structure with routes and middleware',
    priority: 'high',
    phase: ['mvp'],
    requiredCondition: (state) => !state.hasAPI,
    tasks: [
      { title: 'Set up API router', type: 'infrastructure', estimatedTicks: 200 },
      { title: 'Add authentication middleware', type: 'feature', estimatedTicks: 250 },
      { title: 'Create error handling', type: 'feature', estimatedTicks: 150 },
      { title: 'Add request validation', type: 'feature', estimatedTicks: 200 },
      { title: 'Set up CORS', type: 'infrastructure', estimatedTicks: 100 },
    ],
  },
  {
    name: 'Core UI Components',
    description: 'Build the foundational UI component library',
    priority: 'high',
    phase: ['mvp'],
    requiredCondition: (state) => !state.hasUI,
    tasks: [
      { title: 'Create design system tokens', type: 'design', estimatedTicks: 200 },
      { title: 'Build Button component', type: 'feature', estimatedTicks: 150 },
      { title: 'Build Input component', type: 'feature', estimatedTicks: 150 },
      { title: 'Build Card component', type: 'feature', estimatedTicks: 150 },
      { title: 'Build Modal component', type: 'feature', estimatedTicks: 200 },
      { title: 'Build Navigation component', type: 'feature', estimatedTicks: 250 },
      { title: 'Add dark mode support', type: 'design', estimatedTicks: 200 },
    ],
  },
  
  // Growth Phase
  {
    name: 'Marketing Landing Page',
    description: 'Create a compelling landing page to attract users',
    priority: 'high',
    phase: ['growth'],
    requiredCondition: (state) => state.phase !== 'mvp' && !state.hasLanding,
    tasks: [
      { title: 'Design landing page layout', type: 'design', estimatedTicks: 300 },
      { title: 'Build hero section', type: 'feature', estimatedTicks: 250 },
      { title: 'Create features showcase', type: 'feature', estimatedTicks: 300 },
      { title: 'Add testimonials section', type: 'feature', estimatedTicks: 200 },
      { title: 'Write landing page copy', type: 'marketing', estimatedTicks: 250 },
      { title: 'Add CTA buttons', type: 'feature', estimatedTicks: 100 },
      { title: 'Implement responsive design', type: 'design', estimatedTicks: 200 },
      { title: 'Add animations', type: 'design', estimatedTicks: 200 },
    ],
  },
  {
    name: 'User Onboarding',
    description: 'Guide new users through the product with an onboarding flow',
    priority: 'medium',
    phase: ['growth'],
    requiredCondition: (state) => state.hasAuth && !state.hasOnboarding,
    tasks: [
      { title: 'Design onboarding flow', type: 'design', estimatedTicks: 250 },
      { title: 'Build welcome screen', type: 'feature', estimatedTicks: 200 },
      { title: 'Create product tour', type: 'feature', estimatedTicks: 350 },
      { title: 'Add tooltips system', type: 'feature', estimatedTicks: 200 },
      { title: 'Track onboarding completion', type: 'feature', estimatedTicks: 150 },
    ],
  },
  {
    name: 'Analytics Dashboard',
    description: 'Build analytics to understand user behavior',
    priority: 'medium',
    phase: ['growth', 'scale'],
    requiredCondition: (state) => !state.hasAnalytics,
    tasks: [
      { title: 'Set up analytics tracking', type: 'infrastructure', estimatedTicks: 250 },
      { title: 'Create events schema', type: 'infrastructure', estimatedTicks: 150 },
      { title: 'Build analytics dashboard', type: 'feature', estimatedTicks: 400 },
      { title: 'Add charts and graphs', type: 'feature', estimatedTicks: 350 },
      { title: 'Create metrics API', type: 'feature', estimatedTicks: 250 },
    ],
  },
  
  // Scale Phase
  {
    name: 'Payment Integration',
    description: 'Add payment processing and subscription management',
    priority: 'critical',
    phase: ['scale'],
    requiredCondition: (state) => state.phase === 'scale' && !state.hasPricing,
    tasks: [
      { title: 'Integrate Stripe', type: 'feature', estimatedTicks: 400 },
      { title: 'Create pricing page', type: 'feature', estimatedTicks: 300 },
      { title: 'Build checkout flow', type: 'feature', estimatedTicks: 350 },
      { title: 'Add subscription management', type: 'feature', estimatedTicks: 300 },
      { title: 'Handle webhooks', type: 'feature', estimatedTicks: 250 },
      { title: 'Create billing portal', type: 'feature', estimatedTicks: 250 },
    ],
  },
  {
    name: 'Testing Suite',
    description: 'Add comprehensive testing to ensure quality',
    priority: 'high',
    phase: ['growth', 'scale'],
    requiredCondition: (state) => state.techDebtScore > 50 && !state.hasTesting,
    tasks: [
      { title: 'Set up testing framework', type: 'infrastructure', estimatedTicks: 200 },
      { title: 'Write unit tests for core logic', type: 'infrastructure', estimatedTicks: 400 },
      { title: 'Add integration tests', type: 'infrastructure', estimatedTicks: 350 },
      { title: 'Set up E2E tests', type: 'infrastructure', estimatedTicks: 300 },
      { title: 'Add test coverage reporting', type: 'infrastructure', estimatedTicks: 150 },
    ],
  },
  {
    name: 'CI/CD Pipeline',
    description: 'Automate testing and deployment',
    priority: 'medium',
    phase: ['growth', 'scale'],
    requiredCondition: (state) => state.hasTesting && !state.hasCI,
    tasks: [
      { title: 'Set up GitHub Actions', type: 'infrastructure', estimatedTicks: 250 },
      { title: 'Configure automated testing', type: 'infrastructure', estimatedTicks: 200 },
      { title: 'Add deployment pipeline', type: 'infrastructure', estimatedTicks: 300 },
      { title: 'Set up staging environment', type: 'infrastructure', estimatedTicks: 250 },
      { title: 'Add deployment notifications', type: 'infrastructure', estimatedTicks: 100 },
    ],
  },
  
  // Always Relevant
  {
    name: 'Bug Fixes Sprint',
    description: 'Address accumulated bugs and issues',
    priority: 'high',
    phase: ['mvp', 'growth', 'scale', 'mature'],
    requiredCondition: (state) => state.bugCount >= 3,
    tasks: [
      { title: 'Triage and prioritize bugs', type: 'bug', estimatedTicks: 100 },
      { title: 'Fix critical bugs', type: 'bug', estimatedTicks: 400 },
      { title: 'Fix medium priority bugs', type: 'bug', estimatedTicks: 300 },
      { title: 'Update error handling', type: 'bug', estimatedTicks: 200 },
    ],
  },
  {
    name: 'Documentation',
    description: 'Create comprehensive documentation',
    priority: 'low',
    phase: ['growth', 'scale', 'mature'],
    requiredCondition: (state) => state.featureCount >= 5 && !state.hasDocumentation,
    tasks: [
      { title: 'Write README', type: 'infrastructure', estimatedTicks: 150 },
      { title: 'Create API documentation', type: 'infrastructure', estimatedTicks: 300 },
      { title: 'Add code comments', type: 'infrastructure', estimatedTicks: 200 },
      { title: 'Create user guide', type: 'marketing', estimatedTicks: 250 },
    ],
  },
];

// ============================================
// PM Decision Making
// ============================================

/**
 * Evaluate what missions should be created based on product state
 */
export function evaluateNextMissions(
  productState: ProductState,
  existingMissions: Mission[],
  maxSuggestions: number = 3
): MissionTemplate[] {
  const existingNames = new Set(existingMissions.map(m => m.name.toLowerCase()));
  
  // Filter templates to those that:
  // 1. Match current phase or are always relevant
  // 2. Meet their required condition
  // 3. Haven't already been created
  const eligibleTemplates = MISSION_GENERATION_TEMPLATES.filter(template => {
    const phaseMatch = template.phase.includes(productState.phase);
    const conditionMet = template.requiredCondition(productState);
    const notExists = !existingNames.has(template.name.toLowerCase());
    
    return phaseMatch && conditionMet && notExists;
  });
  
  // Sort by priority
  const priorityOrder: Record<MissionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  const sorted = eligibleTemplates.sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
  
  return sorted.slice(0, maxSuggestions);
}

/**
 * Generate PM thoughts based on current state
 */
export function generatePMThoughts(
  productState: ProductState,
  missions: Mission[],
  tasks: Task[],
  employees: Employee[]
): PMThought[] {
  const thoughts: PMThought[] = [];
  const now = Date.now();
  
  // Observation: Current phase
  thoughts.push({
    type: 'observation',
    message: `Product is in ${productState.phase.toUpperCase()} phase with ${productState.featureCount} features shipped.`,
    timestamp: now,
  });
  
  // Observation: What's missing
  const missing: string[] = [];
  if (!productState.hasDatabase) missing.push('database');
  if (!productState.hasAuth) missing.push('authentication');
  if (!productState.hasAPI) missing.push('API');
  if (!productState.hasUI) missing.push('UI components');
  
  if (missing.length > 0) {
    thoughts.push({
      type: 'observation',
      message: `Missing core features: ${missing.join(', ')}`,
      timestamp: now + 1,
    });
  }
  
  // Observation: Team status
  const idle = employees.filter(e => e.status === 'idle').length;
  const working = employees.filter(e => e.status === 'working').length;
  
  thoughts.push({
    type: 'observation',
    message: `Team: ${working} working, ${idle} idle out of ${employees.length} total.`,
    timestamp: now + 2,
  });
  
  // Priority assessment
  const activeMissions = missions.filter(m => m.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
  
  if (idle > 0 && pendingTasks === 0) {
    thoughts.push({
      type: 'priority',
      message: `⚠️ ${idle} idle employees with no pending tasks. Need to generate more work.`,
      timestamp: now + 3,
    });
  }
  
  if (activeMissions === 0) {
    thoughts.push({
      type: 'priority',
      message: `No active missions. Should start a new feature initiative.`,
      timestamp: now + 4,
    });
  }
  
  // Tech debt warning
  if (productState.techDebtScore > 60) {
    thoughts.push({
      type: 'priority',
      message: `⚠️ Tech debt is high (${productState.techDebtScore}/100). Consider adding tests and documentation.`,
      timestamp: now + 5,
    });
  }
  
  // Bug warning
  if (productState.bugCount > 0) {
    thoughts.push({
      type: 'priority',
      message: `🐛 ${productState.bugCount} open bugs need attention.`,
      timestamp: now + 6,
    });
  }
  
  return thoughts;
}

// ============================================
// Epics (High-level grouping)
// ============================================

export const EPIC_TEMPLATES: Omit<Epic, 'id' | 'missionIds' | 'createdAt' | 'completedAt'>[] = [
  {
    name: 'Foundation',
    description: 'Core infrastructure and authentication',
    status: 'planned',
    priority: 'critical',
    phase: 'mvp',
  },
  {
    name: 'Core Product',
    description: 'Main product features and functionality',
    status: 'planned',
    priority: 'critical',
    phase: 'mvp',
  },
  {
    name: 'Growth Engine',
    description: 'Marketing, onboarding, and user acquisition',
    status: 'planned',
    priority: 'high',
    phase: 'growth',
  },
  {
    name: 'Monetization',
    description: 'Payments, subscriptions, and revenue',
    status: 'planned',
    priority: 'high',
    phase: 'scale',
  },
  {
    name: 'Quality & Scale',
    description: 'Testing, CI/CD, and performance',
    status: 'planned',
    priority: 'medium',
    phase: 'scale',
  },
];

export default {
  analyzeProductState,
  evaluateNextMissions,
  generatePMThoughts,
  MISSION_GENERATION_TEMPLATES,
  EPIC_TEMPLATES,
};
