/**
 * Integration Types - GitHub and Linear imports
 */

// GitHub Issue
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  assignee: { login: string } | null;
  created_at: string;
  html_url: string;
}

// Linear Issue
export interface LinearIssue {
  id: string;
  identifier: string; // e.g., "ENG-123"
  title: string;
  description: string | null;
  state: { name: string; type: string };
  priority: number; // 0-4
  labels: Array<{ name: string; color: string }>;
  assignee: { name: string } | null;
  createdAt: string;
  url: string;
}

// Normalized task from any source
export interface ImportedTask {
  externalId: string;
  source: 'github' | 'linear' | 'manual';
  sourceUrl?: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];
  importedAt: number;
}

// Task Queue Item
export interface QueuedTask extends ImportedTask {
  queuePosition: number;
  autoAssign: boolean; // Auto-assign when employee is available
  preferredRole?: 'engineer' | 'designer' | 'pm' | 'marketer';
}

// Integration Config
export interface IntegrationConfig {
  github?: {
    enabled: boolean;
    token?: string;
    repo?: string; // owner/repo format
    autoImport: boolean;
    labelFilter?: string[];
  };
  linear?: {
    enabled: boolean;
    apiKey?: string;
    teamId?: string;
    autoImport: boolean;
    stateFilter?: string[];
  };
}
