/**
 * Game API Client
 * 
 * Handles all communication with the backend for game persistence.
 * The backend handles Convex operations - client doesn't talk to Convex directly.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface GameState {
  tick: number;
  money: number;
  runway: number;
  project: {
    id: string;
    name: string;
    description: string;
    idea: string;
    techStack: string[];
    repository: string | null;
    createdAt: number;
  } | null;
  employees: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    avatarEmoji: string;
    salary: number;
    currentTaskId: string | null;
    hiredAt: number;
    tasksCompleted: number;
    totalTicksWorked: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    estimatedTicks: number;
    progressTicks: number;
    createdAt: number;
    completedAt: number | null;
    codeGenerated: string | null;
    filesCreated: string[];
  }>;
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    tasksCompleted: number;
    linesOfCodeGenerated: number;
    commitsCreated: number;
    featuresShipped: number;
  };
}

interface SaveInfo {
  id: string;
  name: string;
  tick: number;
  money: number;
  createdAt: number;
  updatedAt: number;
}

class GameApiClient {
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }
    return headers;
  }

  /**
   * List all saves for the current user
   */
  async listSaves(): Promise<SaveInfo[]> {
    if (!this.userId) {
      console.log('No user ID, returning empty saves');
      return [];
    }

    try {
      const response = await fetch(`${API_BASE}/api/game/saves`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to list saves: ${response.statusText}`);
      }

      const data = await response.json();
      return data.saves || [];
    } catch (error) {
      console.error('Error listing saves:', error);
      return [];
    }
  }

  /**
   * Create a new game save
   */
  async createSave(name: string, gameState: GameState): Promise<string | null> {
    if (!this.userId) {
      console.log('No user ID, cannot create save');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/api/game/saves`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, gameState }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create save: ${response.statusText}`);
      }

      const data = await response.json();
      return data.saveId;
    } catch (error) {
      console.error('Error creating save:', error);
      return null;
    }
  }

  /**
   * Sync game state (auto-save)
   */
  async syncGameState(saveId: string | null, gameState: GameState): Promise<{ success: boolean; saveId: string | null }> {
    try {
      const response = await fetch(`${API_BASE}/api/game/sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ saveId, gameState }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, saveId: data.saveId };
    } catch (error) {
      console.error('Error syncing game state:', error);
      return { success: false, saveId: null };
    }
  }

  /**
   * Load a game save
   */
  async loadSave(saveId: string): Promise<GameState | null> {
    try {
      const response = await fetch(`${API_BASE}/api/game/sync/${saveId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load save: ${response.statusText}`);
      }

      const data = await response.json();
      return data.gameState;
    } catch (error) {
      console.error('Error loading save:', error);
      return null;
    }
  }

  /**
   * Delete a save
   */
  async deleteSave(saveId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/game/saves/${saveId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting save:', error);
      return false;
    }
  }
}

// Export singleton instance
export const gameApi = new GameApiClient();

export type { GameState, SaveInfo };
