/**
 * Settings Screen - Clean, modern design matching other screens
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getConfiguredProviders } from '../../lib/storage/secureStorage';
import './SettingsScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SettingsScreen() {
  const navigate = useNavigate();
  const { 
    tick,
    money,
    employees,
    project,
    stats,
  } = useGameStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const confirmResetGame = () => {
    localStorage.removeItem('founder-mode-game');
    window.location.reload();
  };

  const exportSave = () => {
    const saveData = {
      project,
      money,
      employees,
      stats,
      tick,
      version: '0.1.0',
      savedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `founder-mode-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get configured API providers
  const configuredProviders = getConfiguredProviders();
  
  // Count employees by AI provider
  const employeesByProvider = employees.reduce((acc, emp) => {
    const provider = emp.aiProvider || 'none';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="settings-screen">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Game</h2>
              <button className="close-btn" onClick={() => setShowResetConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to reset the game? <strong>All progress will be permanently lost</strong>, 
                including your project, team, funds, and achievements.
              </p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button className="confirm-btn danger" onClick={confirmResetGame}>
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-container">
        {/* Header */}
        <header className="settings-header">
          <div className="header-info">
            <h1>Settings</h1>
            <p>Game options and statistics</p>
          </div>
          <button className="back-btn" onClick={() => navigate('/play')}>
            ← Back
          </button>
        </header>

        <div className="settings-grid">
          {/* Left Column */}
          <div className="settings-column">
            {/* Statistics */}
            <section className="settings-card">
              <h2>Statistics</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Game Time</span>
                  <span className="stat-value">{Math.floor(tick / 60)}h</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tasks Done</span>
                  <span className="stat-value">{stats.tasksCompleted}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lines of Code</span>
                  <span className="stat-value">{stats.linesOfCodeGenerated.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Commits</span>
                  <span className="stat-value">{stats.commitsCreated}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Team Size</span>
                  <span className="stat-value">{employees.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Funds</span>
                  <span className="stat-value highlight">{formatMoney(money)}</span>
                </div>
              </div>
            </section>

            {/* AI Providers */}
            <section className="settings-card">
              <h2>AI Providers</h2>
              <p className="card-description">
                API keys are configured per-employee when hiring.
              </p>
              
              <div className="providers-list">
                {configuredProviders.length === 0 ? (
                  <p className="no-providers">No API keys configured yet. Hire an employee to add one.</p>
                ) : (
                  configuredProviders.map(provider => (
                    <div key={provider} className="provider-row">
                      <span className="provider-name">{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                      <span className="provider-status">✓ Configured</span>
                      {employeesByProvider[provider] > 0 && (
                        <span className="provider-count">{employeesByProvider[provider]} employee{employeesByProvider[provider] > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="settings-column">
            {/* Save & Reset */}
            <section className="settings-card">
              <h2>Save & Reset</h2>
              <p className="card-description">Export your progress or start fresh.</p>
              
              <div className="action-buttons">
                <button className="action-btn" onClick={exportSave}>
                  <span className="btn-icon">↓</span>
                  Export Save
                </button>
                <button className="action-btn danger" onClick={() => setShowResetConfirm(true)}>
                  <span className="btn-icon">↺</span>
                  Reset Game
                </button>
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section className="settings-card">
              <h2>Keyboard Shortcuts</h2>
              <div className="shortcuts-grid">
                <div className="shortcut"><kbd>H</kbd><span>Hire</span></div>
                <div className="shortcut"><kbd>T</kbd><span>Tasks</span></div>
                <div className="shortcut"><kbd>E</kbd><span>Team</span></div>
                <div className="shortcut"><kbd>C</kbd><span>Code</span></div>
                <div className="shortcut"><kbd>S</kbd><span>Settings</span></div>
                <div className="shortcut"><kbd>ESC</kbd><span>Back</span></div>
                <div className="shortcut"><kbd>Space</kbd><span>Pause</span></div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="settings-footer">
          <p><strong>Founder Mode</strong> v0.1.0 — A startup simulation powered by <strong>Mastra</strong></p>
        </footer>
      </div>
    </div>
  );
}

export default SettingsScreen;
