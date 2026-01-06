/**
 * Game Top Bar - Clean, minimal design
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { SavePanel } from './SavePanel';
import type { GameScreen } from '../types';
import './RTSTopBar.css';

function formatGameTime(ticks: number): string {
  const days = Math.floor(ticks / 480);
  return `Day ${days + 1}`;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.floor(amount / 1000)}K`;
  return `$${amount}`;
}

export function RTSTopBar() {
  const [showSavePanel, setShowSavePanel] = useState(false);
  
  const {
    screen,
    tick,
    money,
    employees,
    tasks,
    isPaused,
    autopilot,
    project,
    setScreen,
    togglePause,
    toggleAutopilot,
  } = useGameStore();

  const activeCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const teamCount = employees.length;

  // Core navigation items
  const navItems: { id: GameScreen; label: string; hotkey: string }[] = [
    { id: 'rts', label: 'Build', hotkey: 'B' },
    { id: 'tasks', label: 'Tasks', hotkey: 'T' },
    { id: 'team', label: 'Team', hotkey: 'E' },
    { id: 'artifacts', label: 'Code', hotkey: 'A' },
    { id: 'preview', label: 'Preview', hotkey: 'P' },
  ];

  const gameScreens: GameScreen[] = ['rts', 'campus', 'dashboard', 'command', 'queue', 'missions', 'preview', 'tasks', 'team', 'hire', 'office', 'code', 'settings', 'tech', 'achievements', 'artifacts'];
  if (!gameScreens.includes(screen)) return null;

  return (
    <header className="game-header">
      <div className="game-header-inner">
        {/* Left: Logo + Project */}
        <div className="header-left">
          <Link to="/projects" className="header-logo" title="Back to projects">
            <span className="logo-icon">⌘</span>
          </Link>
          <div className="project-info">
            <span className="project-name">{project?.name || 'Untitled'}</span>
            <span className="project-day">{formatGameTime(tick)}</span>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="header-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? 'active' : ''}`}
              onClick={() => setScreen(item.id)}
              title={`${item.label} [${item.hotkey}]`}
            >
              {item.label}
            </button>
          ))}
          <button
            className={`nav-item ${screen === 'hire' ? 'active' : ''}`}
            onClick={() => setScreen('hire')}
            title="Hire [H]"
          >
            + Hire
          </button>
        </nav>

        {/* Right: Stats + Controls */}
        <div className="header-right">
          {/* Quick Stats */}
          <div className="header-stats">
            <div className="stat" title="Funding">
              <span className="stat-value">{formatMoney(money)}</span>
            </div>
            <div className="stat" title="Team size">
              <span className="stat-label">Team</span>
              <span className="stat-value">{teamCount}</span>
            </div>
            <div className="stat" title="Active / Completed tasks">
              <span className="stat-label">Tasks</span>
              <span className="stat-value">{activeCount}/{doneCount}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="header-controls">
            <button
              className={`control-btn ${autopilot ? 'active' : ''}`}
              onClick={toggleAutopilot}
              title="Autopilot mode"
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
              className="save-btn"
              onClick={() => setShowSavePanel(true)}
              title="Push to GitHub"
            >
              Push
            </button>
          </div>
        </div>
      </div>

      <SavePanel 
        isOpen={showSavePanel}
        onClose={() => setShowSavePanel(false)}
      />
    </header>
  );
}

export default RTSTopBar;
