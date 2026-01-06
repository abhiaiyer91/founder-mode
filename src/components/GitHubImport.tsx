/**
 * GitHub Import - Import existing GitHub projects into Founder Mode
 * 
 * Allows users to:
 * 1. Connect their GitHub account
 * 2. Browse their repositories
 * 3. Import a repo and start playing from there
 */

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './GitHubImport.css';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  updated_at: string;
  private: boolean;
}

interface ImportState {
  step: 'connect' | 'browse' | 'analyze' | 'ready';
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  loading: boolean;
  error: string | null;
  analysis: RepoAnalysis | null;
}

interface RepoAnalysis {
  languages: { name: string; percentage: number }[];
  suggestedTasks: SuggestedTask[];
  teamSize: number;
  complexity: 'simple' | 'medium' | 'complex';
}

interface SuggestedTask {
  title: string;
  type: 'feature' | 'bug' | 'refactor' | 'doc';
  priority: 'low' | 'medium' | 'high';
  source: 'issues' | 'readme' | 'analysis';
}

export function GitHubImport({ onClose }: { onClose: () => void }) {
  const { startProject, hireEmployee, createTask, setScreen } = useGameStore();
  
  const [state, setState] = useState<ImportState>({
    step: 'connect',
    repos: [],
    selectedRepo: null,
    loading: false,
    error: null,
    analysis: null,
  });
  
  const [githubToken, setGithubToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'stars'>('updated');

  // Check if user has GitHub token
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setGithubToken(savedToken);
      fetchRepos(savedToken);
    }
  }, []);

  const fetchRepos = async (token: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories. Check your token.');
      }
      
      const repos: GitHubRepo[] = await response.json();
      
      setState(prev => ({
        ...prev,
        step: 'browse',
        repos,
        loading: false,
      }));
      
      localStorage.setItem('github_token', token);
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to connect',
      }));
    }
  };

  const handleConnect = () => {
    if (!githubToken.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a GitHub token' }));
      return;
    }
    fetchRepos(githubToken);
  };

  const handleSelectRepo = async (repo: GitHubRepo) => {
    setState(prev => ({
      ...prev,
      selectedRepo: repo,
      step: 'analyze',
      loading: true,
    }));

    // Simulate analysis (in real app, would analyze README, issues, etc.)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = analyzeRepo(repo);
    
    setState(prev => ({
      ...prev,
      analysis,
      step: 'ready',
      loading: false,
    }));
  };

  const analyzeRepo = (repo: GitHubRepo): RepoAnalysis => {
    // Generate realistic analysis based on repo data
    const languages = [
      { name: repo.language || 'JavaScript', percentage: 65 },
      { name: 'CSS', percentage: 20 },
      { name: 'HTML', percentage: 15 },
    ];

    const suggestedTasks: SuggestedTask[] = [];
    
    // Add tasks based on issues
    if (repo.open_issues_count > 0) {
      suggestedTasks.push({
        title: `Address ${Math.min(repo.open_issues_count, 5)} open issues`,
        type: 'bug',
        priority: 'high',
        source: 'issues',
      });
    }

    // Add standard tasks
    suggestedTasks.push(
      {
        title: 'Review and improve documentation',
        type: 'doc',
        priority: 'medium',
        source: 'analysis',
      },
      {
        title: 'Add unit tests for core functionality',
        type: 'feature',
        priority: 'high',
        source: 'analysis',
      },
      {
        title: 'Refactor for better code organization',
        type: 'refactor',
        priority: 'low',
        source: 'analysis',
      },
    );

    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (repo.stargazers_count > 100 || repo.open_issues_count > 20) {
      complexity = 'complex';
    } else if (repo.stargazers_count > 10 || repo.open_issues_count > 5) {
      complexity = 'medium';
    }

    // Suggest team size based on complexity
    const teamSize = complexity === 'complex' ? 4 : complexity === 'medium' ? 2 : 1;

    return {
      languages,
      suggestedTasks,
      teamSize,
      complexity,
    };
  };

  const handleStartGame = () => {
    if (!state.selectedRepo || !state.analysis) return;

    // Create project from GitHub repo description
    const projectIdea = `${state.selectedRepo.name}: ${state.selectedRepo.description || 'A software project imported from GitHub'}`;
    startProject(projectIdea);

    // Add starter employees based on analysis
    const roles: { role: 'engineer' | 'designer' | 'pm'; level: 'junior' | 'mid' | 'senior' }[] = [
      { role: 'engineer', level: 'junior' },
    ];
    if (state.analysis.teamSize >= 2) roles.push({ role: 'engineer', level: 'mid' });
    if (state.analysis.teamSize >= 3) roles.push({ role: 'designer', level: 'junior' });
    if (state.analysis.teamSize >= 4) roles.push({ role: 'pm', level: 'junior' });

    roles.forEach(({ role, level }) => {
      hireEmployee(role, level);
    });

    // Create initial tasks from analysis
    state.analysis.suggestedTasks.forEach((task) => {
      createTask({
        title: task.title,
        description: `Imported from GitHub analysis: ${task.source}`,
        type: task.type === 'bug' ? 'bug' : 'feature',
        status: 'todo',
        priority: task.priority,
        assigneeId: null,
        estimatedTicks: task.priority === 'high' ? 80 : task.priority === 'medium' ? 40 : 20,
      });
    });

    // Save GitHub repo URL for later use
    localStorage.setItem('founder-mode-github-repo', state.selectedRepo.html_url);

    // Start the game
    setScreen('rts');
    onClose();
  };

  // Filter and sort repos
  const filteredRepos = state.repos
    .filter(repo => 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'stars') {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  return (
    <div className="github-import-overlay" onClick={onClose}>
      <div className="github-import" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <div className="header-icon">🐙</div>
          <h2>Import from GitHub</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {state.step === 'connect' && (
          <div className="import-step connect-step">
            <div className="step-intro">
              <p>Connect your GitHub account to import an existing project.</p>
              <a 
                href="https://github.com/settings/tokens/new?description=Founder%20Mode&scopes=repo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="token-link"
              >
                Create a Personal Access Token →
              </a>
            </div>

            <div className="token-input">
              <label>GitHub Personal Access Token</label>
              <input
                type="password"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <span className="token-hint">Token is stored locally only</span>
            </div>

            {state.error && (
              <div className="import-error">{state.error}</div>
            )}

            <div className="step-actions">
              <button className="secondary-btn" onClick={onClose}>Cancel</button>
              <button 
                className="primary-btn" 
                onClick={handleConnect}
                disabled={state.loading}
              >
                {state.loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        {state.step === 'browse' && (
          <div className="import-step browse-step">
            <div className="repo-controls">
              <input
                type="text"
                className="repo-search"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as 'updated' | 'stars')}
                className="sort-select"
              >
                <option value="updated">Recently Updated</option>
                <option value="stars">Most Stars</option>
              </select>
            </div>

            <div className="repo-list">
              {filteredRepos.length === 0 ? (
                <div className="no-repos">
                  {searchQuery ? 'No matching repositories' : 'No repositories found'}
                </div>
              ) : (
                filteredRepos.map(repo => (
                  <button
                    key={repo.id}
                    className="repo-card"
                    onClick={() => handleSelectRepo(repo)}
                  >
                    <div className="repo-main">
                      <div className="repo-name">
                        {repo.private && <span className="private-badge">🔒</span>}
                        {repo.name}
                      </div>
                      <div className="repo-desc">
                        {repo.description || 'No description'}
                      </div>
                    </div>
                    <div className="repo-meta">
                      {repo.language && (
                        <span className="repo-lang">{repo.language}</span>
                      )}
                      <span className="repo-stars">⭐ {repo.stargazers_count}</span>
                      {repo.open_issues_count > 0 && (
                        <span className="repo-issues">📝 {repo.open_issues_count}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="step-actions">
              <button className="secondary-btn" onClick={() => setState(prev => ({ ...prev, step: 'connect' }))}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {state.step === 'analyze' && (
          <div className="import-step analyze-step">
            <div className="analyze-content">
              <div className="analyze-spinner">🔍</div>
              <h3>Analyzing {state.selectedRepo?.name}...</h3>
              <p>Scanning code, issues, and documentation</p>
            </div>
          </div>
        )}

        {state.step === 'ready' && state.selectedRepo && state.analysis && (
          <div className="import-step ready-step">
            <div className="repo-summary">
              <h3>{state.selectedRepo.name}</h3>
              <p>{state.selectedRepo.description}</p>
              <div className="complexity-badge" data-complexity={state.analysis.complexity}>
                {state.analysis.complexity} project
              </div>
            </div>

            <div className="analysis-results">
              <div className="result-section">
                <h4>🔧 Languages</h4>
                <div className="languages">
                  {state.analysis.languages.map(lang => (
                    <div key={lang.name} className="lang-bar">
                      <span className="lang-name">{lang.name}</span>
                      <div className="lang-progress">
                        <div 
                          className="lang-fill" 
                          style={{ width: `${lang.percentage}%` }}
                        />
                      </div>
                      <span className="lang-pct">{lang.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <h4>📋 Suggested Tasks ({state.analysis.suggestedTasks.length})</h4>
                <div className="task-preview">
                  {state.analysis.suggestedTasks.slice(0, 3).map((task, i) => (
                    <div key={i} className="preview-task">
                      <span className={`task-priority priority-${task.priority}`}>
                        {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <span className="task-title">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <h4>👥 Recommended Team</h4>
                <p>{state.analysis.teamSize} employee{state.analysis.teamSize > 1 ? 's' : ''} to start</p>
              </div>
            </div>

            <div className="step-actions">
              <button className="secondary-btn" onClick={() => setState(prev => ({ ...prev, step: 'browse' }))}>
                ← Choose Different
              </button>
              <button className="primary-btn start-btn" onClick={handleStartGame}>
                🚀 Start Building
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GitHubImport;
