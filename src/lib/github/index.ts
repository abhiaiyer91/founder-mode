/**
 * GitHub Integration - Push generated code to repos
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface CommitFile {
  path: string;
  content: string;
}

export interface CommitResult {
  success: boolean;
  sha?: string;
  url?: string;
  error?: string;
}

class GitHubService {
  private config: GitHubConfig | null = null;

  configure(config: GitHubConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!(this.config?.token && this.config?.owner && this.config?.repo);
  }

  getConfig(): GitHubConfig | null {
    return this.config;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'GitHub not configured' };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github+json',
          },
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.message || 'Failed to connect' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  async pushFiles(files: CommitFile[], message: string): Promise<CommitResult> {
    if (!this.config) {
      return { success: false, error: 'GitHub not configured' };
    }

    try {
      // Use server endpoint to push (avoids CORS issues)
      const response = await fetch(`${API_BASE}/api/github/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Token': this.config.token,
        },
        body: JSON.stringify({
          owner: this.config.owner,
          repo: this.config.repo,
          branch: this.config.branch || 'main',
          files,
          message,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          sha: data.sha,
          url: data.url,
        };
      } else {
        return { success: false, error: data.error || 'Failed to push' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'GitHub not configured' };
    }

    try {
      // Get the SHA of the source branch
      const refResponse = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${fromBranch}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github+json',
          },
        }
      );

      if (!refResponse.ok) {
        return { success: false, error: 'Source branch not found' };
      }

      const refData = await refResponse.json();
      const sha = refData.object.sha;

      // Create new branch
      const createResponse = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha,
          }),
        }
      );

      if (createResponse.ok) {
        return { success: true };
      } else {
        const data = await createResponse.json();
        return { success: false, error: data.message || 'Failed to create branch' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  }
}

export const githubService = new GitHubService();
export default githubService;
