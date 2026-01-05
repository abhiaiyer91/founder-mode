import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SavePanel } from './SavePanel';
import { PMAdvisorBadge } from './PMAdvisor';
import type { GameScreen } from '../types';
import './RTSTopBar.css';

// Format game time
function formatGameTime(ticks: number): string {
  const days = Math.floor(ticks / 480);
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (weeks > 0) {
    return `W${weeks + 1}D${remainingDays + 1}`;
  }
  return `Day ${days + 1}`;
}

export function RTSTopBar() {
  const [showSavePanel, setShowSavePanel] = useState(false);
  
  const {
    screen,
    tick,
    money,
    runway,
    employees,
    tasks,
    taskQueue,
    gameSpeed,
    alerts,
    focusMode,
    autopilot,
    setScreen,
    setGameSpeed,
    togglePause,
    toggleFocusMode,
    toggleAutopilot,
  } = useGameStore();

  const queueCount = taskQueue.items.filter(i => i.status === 'queued').length;
  const activeCount = tasks.filter(t => t.status === 'in_progress').length;
  const idleCount = employees.filter(e => e.status === 'idle').length;
  const unreadAlerts = alerts.filter(a => !a.dismissed).length;
  const completedWithCode = tasks.filter(t => t.status === 'done' && t.codeGenerated).length;

  const views: { id: GameScreen; label: string; icon: string; hotkey: string }[] = [
    { id: 'rts', label: 'RTS', icon: '🏰', hotkey: 'R' },      // Isometric view (Civ/Warcraft)
    { id: 'dashboard', label: 'Dashboard', icon: '📊', hotkey: 'D' },
    { id: 'command', label: 'Command', icon: '🎮', hotkey: 'C' },
    { id: 'queue', label: 'Queue', icon: '📥', hotkey: 'Q' },
    { id: 'missions', label: 'Missions', icon: '🎯', hotkey: 'M' }, // Git worktrees
    { id: 'tasks', label: 'Tasks', icon: '📋', hotkey: 'T' },
    { id: 'team', label: 'Team', icon: '👥', hotkey: 'E' },
    { id: 'hire', label: 'Hire', icon: '👋', hotkey: 'H' },
    { id: 'tech', label: 'Tech', icon: '🔬', hotkey: 'U' },
    { id: 'achievements', label: 'Trophies', icon: '🏆', hotkey: 'A' },
  ];

  // Only show in game screens
  const gameScreens: GameScreen[] = ['rts', 'dashboard', 'command', 'queue', 'missions', 'tasks', 'team', 'hire', 'office', 'code', 'settings', 'tech', 'achievements'];
  if (!gameScreens.includes(screen)) return null;

  return (
    <div className="rts-topbar">
      {/* Left: Resources */}
      <div className="topbar-section resources">
        <div className="resource money" title="Cash on hand">
          <span className="resource-icon">💰</span>
          <span className="resource-value">${money.toLocaleString()}</span>
        </div>
        <div className="resource runway" title="Months of runway">
          <span className="resource-icon">📅</span>
          <span className="resource-value">{runway}mo</span>
        </div>
        <div className="resource time" title="Game time">
          <span className="resource-icon">⏱️</span>
          <span className="resource-value">{formatGameTime(tick)}</span>
        </div>
        <PMAdvisorBadge />
      </div>

      {/* Center: View Switcher */}
      <div className="topbar-section views">
        {views.map(view => (
          <button
            key={view.id}
            className={`view-btn ${screen === view.id ? 'active' : ''}`}
            onClick={() => setScreen(view.id)}
            title={`${view.label} [${view.hotkey}]`}
          >
            <span className="view-icon">{view.icon}</span>
            <span className="view-label">{view.label}</span>
            {view.id === 'queue' && queueCount > 0 && (
              <span className="view-badge">{queueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Right: Status & Speed */}
      <div className="topbar-section status">
        <div className="mode-toggles">
          <button
            className={`mode-btn ${autopilot ? 'active' : ''}`}
            onClick={toggleAutopilot}
            title="Autopilot - AI works autonomously"
          >
            🤖 {autopilot ? 'AUTO' : 'Manual'}
          </button>
          <button
            className={`mode-btn ${focusMode ? 'active' : ''}`}
            onClick={toggleFocusMode}
            title="Focus Mode - Hide distractions"
          >
            🎯 {focusMode ? 'Focus' : 'Normal'}
          </button>
        </div>

        <div className="status-indicators">
          <span className="indicator" title="Active tasks">
            🔨 {activeCount}
          </span>
          <span className="indicator idle" title="Idle employees">
            💤 {idleCount}
          </span>
          {unreadAlerts > 0 && !focusMode && (
            <span className="indicator alert" title="Alerts">
              ⚠️ {unreadAlerts}
            </span>
          )}
        </div>

        <button
          className={`save-btn ${completedWithCode > 0 ? 'has-code' : ''}`}
          onClick={() => setShowSavePanel(true)}
          title="Save to GitHub"
        >
          💾 {completedWithCode > 0 && <span className="code-count">{completedWithCode}</span>}
        </button>

        <div className="speed-controls">
          <button
            className={`speed-btn ${gameSpeed === 'paused' ? 'active paused' : ''}`}
            onClick={togglePause}
            title="Pause [Space]"
          >
            {gameSpeed === 'paused' ? '▶' : '⏸'}
          </button>
          <button
            className={`speed-btn ${gameSpeed === 'normal' ? 'active' : ''}`}
            onClick={() => setGameSpeed('normal')}
            title="Normal [1]"
          >
            1×
          </button>
          <button
            className={`speed-btn ${gameSpeed === 'fast' ? 'active' : ''}`}
            onClick={() => setGameSpeed('fast')}
            title="Fast [2]"
          >
            2×
          </button>
          <button
            className={`speed-btn ${gameSpeed === 'turbo' ? 'active' : ''}`}
            onClick={() => setGameSpeed('turbo')}
            title="Turbo [3]"
          >
            3×
          </button>
        </div>
      </div>

      <SavePanel 
        isOpen={showSavePanel}
        onClose={() => setShowSavePanel(false)}
      />
    </div>
  );
}

export default RTSTopBar;
