/**
 * GitHub OAuth Hook - Manage GitHub authentication
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  token: string;
}

export function useGitHub() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthConfigured, setOauthConfigured] = useState(false);

  // Check for OAuth token in URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('github_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('github_token');
      const login = params.get('github_user');
      const avatar = params.get('github_avatar');

      if (token && login) {
        const userData: GitHubUser = {
          login,
          avatar_url: avatar || '',
          token,
        };
        localStorage.setItem('github_user', JSON.stringify(userData));
        setUser(userData);
        
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // Check for existing user in localStorage
    const stored = localStorage.getItem('github_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('github_user');
      }
    }

    // Check if OAuth is configured
    checkOAuthStatus();
    
    setIsLoading(false);
  }, []);

  const checkOAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/oauth/github/status`);
      const data = await response.json();
      setOauthConfigured(data.configured);
    } catch {
      setOauthConfigured(false);
    }
  };

  const login = useCallback(() => {
    // Redirect to OAuth flow
    window.location.href = `${API_BASE}/api/oauth/github`;
  }, []);

  const logout = useCallback(async () => {
    if (user?.token) {
      try {
        await fetch(`${API_BASE}/api/oauth/github/revoke`, {
          method: 'POST',
          headers: {
            'X-GitHub-Token': user.token,
          },
        });
      } catch {
        // Ignore revoke errors
      }
    }
    localStorage.removeItem('github_user');
    setUser(null);
  }, [user]);

  const getRepos = useCallback(async (): Promise<Array<{ name: string; full_name: string; private: boolean }>> => {
    if (!user?.token) return [];

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/vnd.github+json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Ignore errors
    }
    return [];
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    oauthConfigured,
    login,
    logout,
    getRepos,
  };
}

export default useGitHub;
