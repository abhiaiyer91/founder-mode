/**
 * GitHubConnect - OAuth-based GitHub connection
 * 
 * Uses OAuth flow instead of PAT for better UX and security.
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './GitHubConnect.css';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/github/callback`;
const GITHUB_SCOPE = 'repo user:email';

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export function GitHubConnect({ onClose }: { onClose?: () => void }) {
  const { gitHubConnection, gitRepo, project } = useGameStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [createNew, setCreateNew] = useState(true);
  const [userRepos, setUserRepos] = useState<Array<{ name: string; full_name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize repo name from project
  useEffect(() => {
    if (project) {
      setRepoName(project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    }
  }, [project]);

  // Check for OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      
      if (code && state === localStorage.getItem('github_oauth_state')) {
        setIsConnecting(true);
        localStorage.removeItem('github_oauth_state');
        
        try {
          // Try to use a token exchange endpoint
          const response = await fetch('/api/auth/github/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          
          if (response.ok) {
            const { access_token } = await response.json();
            
            // Verify token and get user info
            const userResponse = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            });
            
            if (userResponse.ok) {
              const user: GitHubUser = await userResponse.json();
              sessionStorage.setItem('github_access_token', access_token);
              useGameStore.setState({
                gitHubConnection: {
                  connected: true,
                  username: user.login,
                  repoName: null,
                  repoUrl: null,
                  lastPush: null,
                },
              });
              useGameStore.getState().addNotification(
                `🐙 Connected to GitHub as ${user.login}`,
                'success'
              );
            }
          }
          
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch {
          setError('Failed to complete GitHub authorization');
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    handleCallback();
  }, []);

  // Load user repos when connected
  useEffect(() => {
    if (gitHubConnection.connected) {
      loadUserRepos();
    }
  }, [gitHubConnection.connected]);

  const startOAuth = () => {
    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    localStorage.setItem('github_oauth_state', state);
    
    // Redirect to GitHub OAuth
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
    authUrl.searchParams.set('scope', GITHUB_SCOPE);
    authUrl.searchParams.set('state', state);
    
    window.location.href = authUrl.toString();
  };

  const loadUserRepos = async () => {
    const token = sessionStorage.getItem('github_access_token');
    if (!token) return;
    
    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (response.ok) {
        const repos: Array<{ name: string; full_name: string }> = await response.json();
        setUserRepos(repos.map(r => ({ name: r.name, full_name: r.full_name })));
      }
    } catch (error) {
      console.error('Failed to load repos:', error);
    }
  };

  const createRepository = async () => {
    const token = sessionStorage.getItem('github_access_token');
    if (!token || !repoName) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: project?.description || 'Built with Founder Mode',
          private: false,
          auto_init: false,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create repository');
      }
      
      const repo = await response.json();
      
      useGameStore.setState({
        gitHubConnection: {
          ...gitHubConnection,
          repoName: repo.name,
          repoUrl: repo.html_url,
        },
      });
      
      useGameStore.getState().addNotification(
        `✅ Created repository: ${repo.full_name}`,
        'success'
      );
      
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const selectRepository = async (fullName: string) => {
    const token = sessionStorage.getItem('github_access_token');
    if (!token) return;
    
    setIsConnecting(true);
    
    try {
      const response = await fetch(`https://api.github.com/repos/${fullName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (response.ok) {
        const repo = await response.json();
        
        useGameStore.setState({
          gitHubConnection: {
            ...gitHubConnection,
            repoName: repo.name,
            repoUrl: repo.html_url,
          },
        });
        
        useGameStore.getState().addNotification(
          `✅ Connected to: ${repo.full_name}`,
          'success'
        );
        
        onClose?.();
      }
    } catch {
      setError('Failed to select repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    sessionStorage.removeItem('github_access_token');
    useGameStore.getState().disconnectGitHub();
  };

  // Not connected yet
  if (!gitHubConnection.connected) {
    return (
      <div className="github-connect">
        <div className="connect-header">
          <span className="github-logo">🐙</span>
          <h3>Connect to GitHub</h3>
        </div>
        
        <p className="connect-description">
          Connect your GitHub account to push your code and track your project in a real repository.
        </p>
        
        {error && <div className="connect-error">{error}</div>}
        
        <button 
          className="oauth-btn"
          onClick={startOAuth}
          disabled={isConnecting || !GITHUB_CLIENT_ID}
        >
          {isConnecting ? (
            <>⏳ Connecting...</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </>
          )}
        </button>
        
        {!GITHUB_CLIENT_ID && (
          <p className="connect-hint">
            Set <code>VITE_GITHUB_CLIENT_ID</code> in your environment to enable OAuth.
          </p>
        )}
      </div>
    );
  }

  // Connected but no repo selected
  if (!gitHubConnection.repoName) {
    return (
      <div className="github-connect">
        <div className="connect-header">
          <span className="github-logo">🐙</span>
          <h3>Choose Repository</h3>
        </div>
        
        <div className="connected-user">
          <span className="user-badge">
            ✅ Signed in as <strong>@{gitHubConnection.username}</strong>
          </span>
          <button className="disconnect-btn" onClick={disconnect}>
            Disconnect
          </button>
        </div>
        
        {error && <div className="connect-error">{error}</div>}
        
        <div className="repo-options">
          <div className="option-tabs">
            <button 
              className={createNew ? 'active' : ''} 
              onClick={() => setCreateNew(true)}
            >
              Create New
            </button>
            <button 
              className={!createNew ? 'active' : ''} 
              onClick={() => setCreateNew(false)}
            >
              Use Existing
            </button>
          </div>
          
          {createNew ? (
            <div className="create-repo">
              <label>Repository Name</label>
              <div className="repo-input">
                <span className="repo-prefix">{gitHubConnection.username}/</span>
                <input
                  type="text"
                  value={repoName}
                  onChange={e => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-awesome-project"
                />
              </div>
              <button 
                className="create-btn"
                onClick={createRepository}
                disabled={isConnecting || !repoName}
              >
                {isConnecting ? '⏳ Creating...' : '🚀 Create Repository'}
              </button>
            </div>
          ) : (
            <div className="select-repo">
              {userRepos.length === 0 ? (
                <p className="no-repos">Loading repositories...</p>
              ) : (
                <div className="repo-list">
                  {userRepos.slice(0, 10).map(repo => (
                    <button
                      key={repo.full_name}
                      className="repo-item"
                      onClick={() => selectRepository(repo.full_name)}
                    >
                      <span className="repo-name">{repo.name}</span>
                      <span className="repo-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fully connected
  return (
    <div className="github-connect connected">
      <div className="connect-header">
        <span className="github-logo">🐙</span>
        <h3>GitHub Connected</h3>
      </div>
      
      <div className="repo-info">
        <a 
          href={gitHubConnection.repoUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="repo-link"
        >
          <span className="repo-icon">📁</span>
          <span className="repo-path">
            {gitHubConnection.username}/{gitHubConnection.repoName}
          </span>
          <span className="external-icon">↗</span>
        </a>
      </div>
      
      <div className="repo-stats">
        <div className="stat">
          <span className="stat-value">{gitRepo?.stats.totalCommits || 0}</span>
          <span className="stat-label">commits</span>
        </div>
        <div className="stat">
          <span className="stat-value">{gitRepo?.stats.totalFiles || 0}</span>
          <span className="stat-label">files</span>
        </div>
        <div className="stat">
          <span className="stat-value">{gitRepo?.stats.totalLines || 0}</span>
          <span className="stat-label">lines</span>
        </div>
      </div>
      
      {gitHubConnection.lastPush && (
        <p className="last-push">
          Last pushed {new Date(gitHubConnection.lastPush).toLocaleString()}
        </p>
      )}
      
      <div className="connect-actions">
        <button 
          className="push-btn"
          onClick={() => useGameStore.getState().pushToGitHub()}
        >
          🚀 Push to GitHub
        </button>
        <button className="disconnect-btn" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default GitHubConnect;
