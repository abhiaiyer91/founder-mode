/**
 * Projects Screen - Command Center Style
 * 
 * Terminal-inspired project list with retro-futuristic aesthetic
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../../lib/auth';
import { ConfirmModal } from '../tui';
import type { SavedProject } from '../../types';
import './ProjectsScreen.css';

// Storage key for saved projects
const PROJECTS_STORAGE_KEY = 'founder-mode-projects';
const CURRENT_PROJECT_KEY = 'founder-mode-game';

export function ProjectsScreen() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);
  const { data: session } = useSession();
  const navigate = useNavigate();

  // Load saved projects from localStorage
  useEffect(() => {
    const loadProjects = () => {
      try {
        const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SavedProject[];
          // Sort by last played (most recent first)
          parsed.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
          setProjects(parsed);
        }
        
        // Also check current project and add it if not in list
        const currentGame = localStorage.getItem(CURRENT_PROJECT_KEY);
        if (currentGame) {
          const gameState = JSON.parse(currentGame);
          if (gameState.state?.project) {
            const currentProject = gameState.state.project;
            const exists = projects.some(p => p.id === currentProject.id);
            if (!exists) {
              const savedProject: SavedProject = {
                id: currentProject.id,
                name: currentProject.name,
                description: currentProject.description || currentProject.idea,
                projectType: currentProject.projectType || 'frontend',
                createdAt: currentProject.createdAt || Date.now(),
                lastPlayedAt: Date.now(),
                tick: gameState.state.tick || 0,
                money: gameState.state.money || 100000,
                employeeCount: gameState.state.employees?.length || 0,
                tasksCompleted: gameState.state.stats?.tasksCompleted || 0,
              };
              setProjects(prev => {
                const updated = [savedProject, ...prev.filter(p => p.id !== currentProject.id)];
                localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to load projects:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, []);

  const handleContinueProject = (project: SavedProject) => {
    // Update last played time
    const updated = projects.map(p => 
      p.id === project.id ? { ...p, lastPlayedAt: Date.now() } : p
    );
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    
    // Check if this project matches the current game state
    const currentGame = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentGame) {
      try {
        const gameState = JSON.parse(currentGame);
        if (gameState.state?.project?.id === project.id) {
          // Current game matches, navigate to play
          navigate('/play');
          return;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Different project - for now just go to play (will use current state)
    // TODO: Support multiple saved game states
    navigate('/play');
  };

  const handleDeleteProject = (project: SavedProject) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    
    const updated = projects.filter(p => p.id !== projectToDelete.id);
    setProjects(updated);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    
    // If this was the current project, clear the game state
    const currentGame = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentGame) {
      try {
        const gameState = JSON.parse(currentGame);
        if (gameState.state?.project?.id === projectToDelete.id) {
          localStorage.removeItem(CURRENT_PROJECT_KEY);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    setProjectToDelete(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'frontend': return '◇';
      case 'backend': return '◆';
      case 'fullstack': return '◈';
      case 'cli': return '▣';
      case 'library': return '◎';
      case 'mobile': return '◉';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <div className="projects-screen">
        <div className="projects-loading">[ LOADING PROJECTS ]</div>
      </div>
    );
  }

  return (
    <div className="projects-screen">
      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={
          <>
            Are you sure you want to delete <strong>"{projectToDelete?.name}"</strong>? 
            This action cannot be undone and all project data will be lost.
          </>
        }
        confirmLabel="Delete Project"
        cancelLabel="Keep It"
        variant="danger"
        onConfirm={confirmDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />
      
      <header className="projects-header">
        <nav className="projects-nav">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">⌘</span>
            <span className="logo-text">Founder Mode</span>
          </Link>
          
          <div className="nav-right">
            {session && (
              <span className="user-name">{session.user?.name || session.user?.email}</span>
            )}
            <Link to="/start" className="new-project-btn">
              <span className="btn-icon">+</span>
              New Project
            </Link>
          </div>
        </nav>
      </header>

      <main className="projects-content">
        {projects.length === 0 ? (
          <div className="no-projects">
            <div className="no-projects-icon">[ EMPTY ]</div>
            <h2>No Active Missions</h2>
            <p>Initialize your first project to begin building</p>
            <Link to="/start" className="start-btn">Initialize Project</Link>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-card-header">
                  <div className="project-type-icon">{getProjectTypeIcon(project.projectType)}</div>
                </div>
                
                <div className="project-info">
                  <div className="project-title">
                    <h3>{project.name}</h3>
                    <span className="project-type">{project.projectType}</span>
                  </div>
                  <p className="project-description">{project.description}</p>
                </div>
                
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-value">{formatMoney(project.money)}</span>
                    <span className="stat-label">Funds</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{project.employeeCount}</span>
                    <span className="stat-label">Team</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{project.tasksCompleted}</span>
                    <span className="stat-label">Done</span>
                  </div>
                </div>

                <div className="project-meta">
                  {formatDate(project.lastPlayedAt)}
                </div>

                <div className="project-actions">
                  <button 
                    className="continue-btn"
                    onClick={() => handleContinueProject(project)}
                  >
                    Resume →
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteProject(project)}
                    title="Delete project"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectsScreen;
