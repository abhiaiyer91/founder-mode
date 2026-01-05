import { useState, useEffect } from 'react';
import { Terminal, Box, Menu, Input } from '../tui';
import type { MenuItem } from '../tui';
import { useGameStore } from '../../store/gameStore';
import { aiService, mastraClient } from '../../lib/ai';
import { saveApiKey, removeApiKey, hasStoredKey } from '../../lib/storage/secureStorage';
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
    stats,
    aiSettings,
    configureAI,
    disableAI,
  } = useGameStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [mastraConnected, setMastraConnected] = useState(false);
  const [checkingMastra, setCheckingMastra] = useState(false);
  const [hasPersistedKey, setHasPersistedKey] = useState(false);

  // Check Mastra server connection and persisted key
  useEffect(() => {
    checkMastraConnection();
    setHasPersistedKey(hasStoredKey('openai'));
  }, []);

  const checkMastraConnection = async () => {
    setCheckingMastra(true);
    const connected = await mastraClient.checkHealth();
    setMastraConnected(connected);
    setCheckingMastra(false);
  };

  const speedOptions: MenuItem[] = [
    { id: 'paused', label: '⏸️ Paused', shortcut: '0' },
    { id: 'normal', label: '▶️ Normal (1x)', shortcut: '1' },
    { id: 'fast', label: '⏩ Fast (2x)', shortcut: '2' },
    { id: 'turbo', label: '⚡ Turbo (10x)', shortcut: '3' },
  ];

  const handleSpeedChange = (item: MenuItem) => {
    setGameSpeed(item.id as GameSpeed);
  };

  const handleConfigureAI = () => {
    if (apiKeyInput.trim()) {
      const key = apiKeyInput.trim();
      configureAI(key);
      saveApiKey('openai', key); // Persist the key
      setHasPersistedKey(true);
      setApiKeyInput('');
      setShowApiKeyInput(false);
    }
  };

  const handleDisableAI = () => {
    disableAI();
    removeApiKey('openai'); // Remove persisted key
    setHasPersistedKey(false);
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

          {/* AI Configuration - Featured prominently */}
          <Box title="🤖 AI CONFIGURATION (MASTRA)" variant="accent" className="settings-section ai-section">
            <p className="section-desc">
              Connect your AI provider to power your team with real intelligence.
              Your employees will use AI to write actual code, create designs, and more!
            </p>

            {/* Mastra Server Status */}
            <div className="mastra-status">
              <div className="status-row">
                <span className="status-label">Mastra Server:</span>
                <span className={`status-badge ${mastraConnected ? 'enabled' : 'disabled'}`}>
                  {checkingMastra ? '⏳ Checking...' : mastraConnected ? '🟢 CONNECTED' : '🔴 NOT RUNNING'}
                </span>
                <button className="check-btn" onClick={checkMastraConnection} disabled={checkingMastra}>
                  ↻ Refresh
                </button>
              </div>
              {!mastraConnected && (
                <div className="mastra-help">
                  <p>Start the Mastra server for full AI power:</p>
                  <code>pnpm dev:server</code>
                  <p className="hint">Or run both frontend and server: <code>pnpm dev:all</code></p>
                </div>
              )}
            </div>
            
            <div className="ai-status">
              <span className="status-label">AI Status:</span>
              <span className={`status-badge ${aiSettings.enabled ? 'enabled' : mastraConnected ? 'enabled' : 'disabled'}`}>
                {mastraConnected ? '🚀 MASTRA MODE' : aiSettings.enabled ? '🟢 OPENAI MODE' : '🔴 SIMULATION MODE'}
              </span>
            </div>

            {aiSettings.enabled ? (
              <div className="ai-enabled-info">
                <p>✅ Your team is powered by <strong>{aiSettings.model}</strong></p>
                <p className="api-key-hint">
                  API Key: {aiService.getMaskedApiKey() || '****'}
                  {hasPersistedKey && <span className="persisted-badge"> 💾 Saved</span>}
                </p>
                <button className="disable-ai-btn" onClick={handleDisableAI}>
                  Disable AI & Clear Saved Key
                </button>
              </div>
            ) : showApiKeyInput ? (
              <div className="api-key-form">
                <Input
                  value={apiKeyInput}
                  onChange={setApiKeyInput}
                  onSubmit={handleConfigureAI}
                  placeholder="sk-..."
                  prompt="OpenAI API Key:"
                />
                <div className="form-actions">
                  <button className="save-btn" onClick={handleConfigureAI}>
                    Connect AI
                  </button>
                  <button className="cancel-btn" onClick={() => setShowApiKeyInput(false)}>
                    Cancel
                  </button>
                </div>
                <p className="api-key-note">
                  Your API key is stored locally and never sent to our servers.
                  Get a key at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
                </p>
              </div>
            ) : (
              <button className="enable-ai-btn" onClick={() => setShowApiKeyInput(true)}>
                🔑 Connect OpenAI API Key
              </button>
            )}

            <div className="ai-features">
              <h4>With AI enabled, your team can:</h4>
              <ul>
                <li>👨‍💻 <strong>Engineers</strong> - Write real, working code for your project</li>
                <li>📊 <strong>PMs</strong> - Break down your idea into smart, prioritized tasks</li>
                <li>🎨 <strong>Designers</strong> - Create CSS and design specifications</li>
                <li>📢 <strong>Marketers</strong> - Write compelling copy and content</li>
              </ul>
            </div>
          </Box>

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
                <span className="label">Lines of Code</span>
                <span className="value">{stats.linesOfCodeGenerated}</span>
              </div>
              <div className="stat-item">
                <span className="label">Commits</span>
                <span className="value">{stats.commitsCreated}</span>
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
              <p>Powered by <strong>Mastra</strong> AI framework.</p>
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
