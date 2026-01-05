/**
 * Missions API Client - Git worktree management
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CreateWorktreeResult {
  success: boolean;
  worktreePath?: string;
  branchName?: string;
  error?: string;
}

export interface CommitResult {
  success: boolean;
  sha?: string;
  message?: string;
  filesChanged?: string[];
  error?: string;
}

export interface PushResult {
  success: boolean;
  branchName?: string;
  repo?: string;
  error?: string;
}

export interface CreatePRResult {
  success: boolean;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  error?: string;
}

export interface MergeResult {
  success: boolean;
  sha?: string;
  merged?: boolean;
  error?: string;
}

export interface WorktreeStatus {
  exists: boolean;
  branch?: string;
  hasChanges?: boolean;
  commitsAhead?: number;
  worktreePath?: string;
}

export interface MissionsApiConfig {
  token: string;
  repo: string; // owner/repo
}

let config: MissionsApiConfig | null = null;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config?.token) {
    headers['X-GitHub-Token'] = config.token;
  }
  if (config?.repo) {
    headers['X-GitHub-Repo'] = config.repo;
  }
  return headers;
}

export const missionsApi = {
  /**
   * Configure the API with GitHub credentials
   */
  configure(newConfig: MissionsApiConfig) {
    config = newConfig;
  },

  /**
   * Check if configured
   */
  isConfigured(): boolean {
    return !!(config?.token && config?.repo);
  },

  /**
   * Create a git worktree for a mission
   */
  async createWorktree(
    missionId: string,
    branchName: string,
    baseBranch = 'main'
  ): Promise<CreateWorktreeResult> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/worktree`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ branchName, baseBranch }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Remove a worktree
   */
  async removeWorktree(missionId: string, deleteBranch = false): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/worktree`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ deleteBranch }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Write files to a mission's worktree
   */
  async writeFiles(
    missionId: string,
    files: Array<{ path: string; content: string }>
  ): Promise<{ success: boolean; filesWritten?: string[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/files`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ files }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Commit changes in a mission's worktree
   */
  async commit(
    missionId: string,
    message: string,
    files?: string[]
  ): Promise<CommitResult> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/commit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, files }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Push a mission branch to GitHub
   */
  async push(missionId: string, branchName: string): Promise<PushResult> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/push`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ branchName }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Create a pull request for a mission
   */
  async createPR(
    missionId: string,
    title: string,
    body: string,
    branchName: string,
    baseBranch = 'main'
  ): Promise<CreatePRResult> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/pr`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, body, branchName, baseBranch }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Merge a mission's pull request
   */
  async merge(
    missionId: string,
    pullRequestNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'
  ): Promise<MergeResult> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/merge`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pullRequestNumber, mergeMethod }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get worktree status
   */
  async getStatus(missionId: string): Promise<WorktreeStatus> {
    try {
      const response = await fetch(`${API_BASE}/api/missions/${missionId}/status`, {
        headers: getHeaders(),
      });

      const data = await response.json();
      return data;
    } catch {
      return { exists: false };
    }
  },
};

export default missionsApi;
