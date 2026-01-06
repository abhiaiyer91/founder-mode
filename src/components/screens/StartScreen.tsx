/**
 * Start Screen - New Project Creation
 * 
 * Clean, modern design matching the landing page aesthetic
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useSession } from '../../lib/auth';
import { GitHubImport } from '../GitHubImport';
import './StartScreen.css';

export function StartScreen() {
  const [idea, setIdea] = useState('');
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  const startProject = useGameStore(state => state.startProject);
  const { data: session } = useSession();
  const navigate = useNavigate();

  // Load saved idea from localStorage (passed from landing page)
  useEffect(() => {
    const savedIdea = localStorage.getItem('founder-mode-idea');
    if (savedIdea) {
      setIdea(savedIdea);
      localStorage.removeItem('founder-mode-idea');
    }
  }, []);

  // Check for GitHub OAuth callback (token in URL fragment)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('github_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('github_token');
      const user = params.get('github_user');
      
      if (token) {
        localStorage.setItem('github_token', token);
        if (user) {
          localStorage.setItem('github_user', user);
        }
        window.history.replaceState(null, '', window.location.pathname);
        setShowGitHubImport(true);
      }
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (idea.trim().length >= 10) {
      startProject(idea.trim());
      // Navigate to the game after starting the project
      navigate('/');
    }
  };

  const isValid = idea.trim().length >= 10;

  return (
    <div className="start-screen">
      {/* Header */}
      <header className="start-header">
        <nav className="start-nav">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">⌘</span>
            <span className="logo-text">Founder Mode</span>
          </Link>
          
          <div className="nav-right">
            {session && (
              <span className="user-name">{session.user?.name || session.user?.email}</span>
            )}
            <Link to="/projects" className="projects-link">My Projects</Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="start-main">
        <div className="start-content">
          <div className="start-badge">New Project</div>
          
          <h1>What will you build?</h1>
          <p className="start-subtitle">
            Describe your startup idea and your AI team will start building it.
          </p>

          <form onSubmit={handleSubmit} className="idea-form">
            <div className="idea-input-wrapper">
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="A SaaS platform that helps remote teams..."
                className="idea-input"
                rows={4}
                maxLength={500}
                autoFocus
              />
              <div className="input-footer">
                <span className="char-count">{idea.length}/500</span>
                {idea.length > 0 && idea.length < 10 && (
                  <span className="char-warning">At least 10 characters</span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className={`start-btn ${isValid ? 'active' : ''}`}
              disabled={!isValid}
            >
              Start Building →
            </button>
          </form>

          <div className="or-divider">
            <span>or</span>
          </div>

          <button 
            className="github-btn" 
            onClick={() => setShowGitHubImport(true)}
          >
            <span className="github-icon">◉</span>
            Import from GitHub
          </button>

          <p className="start-tip">
            <strong>Tip:</strong> Be specific! "A task management app for remote teams with Slack integration" 
            works better than "an app"
          </p>
        </div>
      </main>

      {showGitHubImport && (
        <GitHubImport onClose={() => setShowGitHubImport(false)} />
      )}
    </div>
  );
}

export default StartScreen;
