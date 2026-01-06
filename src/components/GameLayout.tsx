/**
 * GameLayout - Wrapper for game screens with navigation
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { SavePanel } from './SavePanel';
import { EventPanel } from './EventPanel';
import { useState } from 'react';
import './GameLayout.css';

function formatGameTime(ticks: number): string {
  const days = Math.floor(ticks / 480);
  return `Day ${days + 1}`;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.floor(amount / 1000)}K`;
  return `$${amount}`;
}

export function GameLayout() {
  const navigate = useNavigate();
  const [showSavePanel, setShowSavePanel] = useState(false);
  
  const {
    project,
    tick,
    money,
    employees,
    tasks,
    isPaused,
    autopilot,
    focusMode,
    togglePause,
    toggleAutopilot,
  } = useGameStore();

  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const navItems = [
    { to: '/play', label: 'Dashboard', end: true },
    { to: '/play/hire', label: 'Hire' },
    { to: '/play/tasks', label: 'Tasks' },
    { to: '/play/team', label: 'Team' },
    { to: '/play/code', label: 'Code' },
    { to: '/play/preview', label: 'Preview' },
  ];

  return (
    <div className="game-layout">
      {/* Top Bar */}
      <header className="game-topbar">
        <div className="topbar-left">
          <button className="logo-btn" onClick={() => navigate('/projects')} title="Back to projects">
            ⌘
          </button>
          <div className="project-info">
            <span className="project-name">{project?.name || 'Untitled'}</span>
            <span className="game-day">{formatGameTime(tick)}</span>
          </div>
        </div>

        <nav className="topbar-nav">
          {navItems.map(item => (
            <NavLink 
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-right">
          <div className="topbar-stats">
            <div className="stat" title="Funding">
              <span className="stat-value">{formatMoney(money)}</span>
            </div>
            <div className="stat" title="Team">
              <span className="stat-label">Team</span>
              <span className="stat-value">{employees.length}</span>
            </div>
            <div className="stat" title="Tasks">
              <span className="stat-label">Tasks</span>
              <span className="stat-value">{activeTasks}/{completedTasks}</span>
            </div>
          </div>

          <div className="topbar-controls">
            <button
              className={`control-btn ${autopilot ? 'active' : ''}`}
              onClick={toggleAutopilot}
              title="Autopilot"
            >
              {autopilot ? 'Auto' : 'Manual'}
            </button>

            <button
              className={`control-btn ${isPaused ? 'paused' : ''}`}
              onClick={togglePause}
              title="Pause [Space]"
            >
              {isPaused ? '▶ Play' : '❚❚ Pause'}
            </button>

            <button
              className="push-btn"
              onClick={() => setShowSavePanel(true)}
              title="Push to GitHub"
            >
              Push
            </button>

            <NavLink 
              to="/play/settings" 
              className={({ isActive }) => `settings-btn ${isActive ? 'active' : ''}`}
              title="Settings [S]"
            >
              ⚙
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="game-main">
        <Outlet />
      </main>

      {/* Overlays */}
      {!focusMode && <EventPanel />}
      <SavePanel isOpen={showSavePanel} onClose={() => setShowSavePanel(false)} />
    </div>
  );
}

export default GameLayout;

