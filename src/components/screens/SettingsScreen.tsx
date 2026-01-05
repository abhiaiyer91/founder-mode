import { Terminal, Box, Menu } from '../tui';
import type { MenuItem } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { GameSpeed } from '../../types';
import './SettingsScreen.css';

export function SettingsScreen() {
  const { 
    gameSpeed, 
    setGameSpeed, 
    setScreen, 
    tick,
    money,
    employees,
    tasks,
    project,
    stats
  } = useGameStore();

  const speedOptions: MenuItem[] = [
    { id: 'paused', label: '⏸️ Paused', shortcut: '0' },
    { id: 'normal', label: '▶️ Normal (1x)', shortcut: '1' },
    { id: 'fast', label: '⏩ Fast (2x)', shortcut: '2' },
    { id: 'turbo', label: '⚡ Turbo (10x)', shortcut: '3' },
  ];

  const handleSpeedChange = (item: MenuItem) => {
    setGameSpeed(item.id as GameSpeed);
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game? All progress will be lost!')) {
      window.location.reload();
    }
  };

  const exportSave = () => {
    const saveData = {
      project,
      money,
      employees,
      tasks,
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

  return (
    <div className="settings-screen">
      <Terminal title="SETTINGS">
        <div className="settings-layout">
          <h2>⚙️ Game Settings</h2>

          <Box title="GAME SPEED" className="settings-section">
            <p className="section-desc">
              Control how fast time passes in the game. Pausing stops all progress.
            </p>
            <div className="speed-options">
              <Menu
                items={speedOptions}
                onSelect={handleSpeedChange}
                horizontal
                showShortcuts
              />
            </div>
            <div className="current-speed">
              Current: <span className={`speed-badge ${gameSpeed}`}>{gameSpeed.toUpperCase()}</span>
            </div>
          </Box>

          <Box title="GAME STATISTICS" className="settings-section">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="label">Game Time</span>
                <span className="value">{Math.floor(tick / 60)} hours</span>
              </div>
              <div className="stat-item">
                <span className="label">Tasks Completed</span>
                <span className="value">{stats.tasksCompleted}</span>
              </div>
              <div className="stat-item">
                <span className="label">Team Size</span>
                <span className="value">{employees.length}</span>
              </div>
              <div className="stat-item">
                <span className="label">Current Funds</span>
                <span className="value">${money.toLocaleString()}</span>
              </div>
            </div>
          </Box>

          <Box title="SAVE & LOAD" className="settings-section">
            <p className="section-desc">
              Export your progress or start fresh. Games auto-save to browser storage.
            </p>
            <div className="save-actions">
              <button className="save-btn" onClick={exportSave}>
                💾 Export Save
              </button>
              <button className="reset-btn" onClick={resetGame}>
                🔄 Reset Game
              </button>
            </div>
          </Box>

          <Box title="KEYBOARD SHORTCUTS" className="settings-section">
            <div className="shortcuts-list">
              <div className="shortcut">
                <kbd>H</kbd>
                <span>Open Hire Screen</span>
              </div>
              <div className="shortcut">
                <kbd>T</kbd>
                <span>Open Task Board</span>
              </div>
              <div className="shortcut">
                <kbd>E</kbd>
                <span>Open Team View</span>
              </div>
              <div className="shortcut">
                <kbd>C</kbd>
                <span>View Generated Code</span>
              </div>
              <div className="shortcut">
                <kbd>S</kbd>
                <span>Settings</span>
              </div>
              <div className="shortcut">
                <kbd>ESC</kbd>
                <span>Go Back / Close</span>
              </div>
              <div className="shortcut">
                <kbd>1-3</kbd>
                <span>Change Game Speed</span>
              </div>
              <div className="shortcut">
                <kbd>0</kbd>
                <span>Pause Game</span>
              </div>
            </div>
          </Box>

          <Box title="ABOUT" className="settings-section">
            <div className="about-content">
              <p><strong>Founder Mode</strong> v0.1.0</p>
              <p>A startup simulation game where your AI team builds real software.</p>
              <p className="tagline">"Build a real startup. Ship real code. Play the game."</p>
            </div>
          </Box>

          <div className="settings-footer">
            <button className="back-btn" onClick={() => setScreen('office')}>
              ← Back to Office [ESC]
            </button>
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default SettingsScreen;
