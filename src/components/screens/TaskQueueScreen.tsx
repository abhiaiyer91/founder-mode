import { useState } from 'react';
import { Terminal, Box } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { QueuedTaskItem } from '../../types';
import './TaskQueueScreen.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Queue Item Component
function QueueItem({ 
  item, 
  onRemove, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast,
}: { 
  item: QueuedTaskItem;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const priorityColors: Record<string, string> = {
    critical: '#f85149',
    high: '#d29922',
    medium: '#00ff88',
    low: '#8b949e',
  };
  
  const sourceIcons: Record<string, string> = {
    github: '🐙',
    linear: '📐',
    manual: '✏️',
  };

  return (
    <div className={`queue-item ${item.status}`}>
      <div className="queue-position">#{item.queuePosition + 1}</div>
      
      <div className="queue-content">
        <div className="queue-header">
          <span className="queue-source">{sourceIcons[item.source]}</span>
          <span className="queue-title">{item.title}</span>
          <span 
            className="queue-priority" 
            style={{ color: priorityColors[item.priority] }}
          >
            {item.priority[0].toUpperCase()}
          </span>
        </div>
        
        <div className="queue-meta">
          <span className="queue-type">{item.type}</span>
          {item.labels.slice(0, 3).map(label => (
            <span key={label} className="queue-label">{label}</span>
          ))}
          <span className={`queue-status ${item.status}`}>{item.status}</span>
        </div>
      </div>
      
      <div className="queue-actions">
        <button 
          className="queue-btn" 
          onClick={onMoveUp} 
          disabled={isFirst || item.status !== 'queued'}
          title="Move up"
        >
          ↑
        </button>
        <button 
          className="queue-btn" 
          onClick={onMoveDown} 
          disabled={isLast || item.status !== 'queued'}
          title="Move down"
        >
          ↓
        </button>
        <button 
          className="queue-btn remove" 
          onClick={onRemove}
          disabled={item.status === 'assigned'}
          title="Remove"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Import Modal
function ImportModal({ 
  source, 
  onClose,
  onImport,
}: { 
  source: 'github' | 'linear';
  onClose: () => void;
  onImport: (issues: unknown[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<unknown[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  
  // GitHub state
  const [repo, setRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');
  
  // Linear state
  const [linearApiKey, setLinearApiKey] = useState('');
  const [teamId, setTeamId] = useState('');

  const fetchGitHubIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE}/api/integrations/github/issues?repo=${encodeURIComponent(repo)}&state=open`;
      const headers: HeadersInit = {};
      if (githubToken) {
        headers['X-GitHub-Token'] = githubToken;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch issues');
      }
      
      setIssues(data.issues);
      // Select all by default
      setSelectedIds(new Set(data.issues.map((i: { number: number }) => i.number)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinearIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE}/api/integrations/linear/issues${teamId ? `?teamId=${teamId}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Linear-API-Key': linearApiKey,
        },
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch issues');
      }
      
      setIssues(data.issues);
      setSelectedIds(new Set(data.issues.map((i: { id: string }) => i.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleImport = () => {
    const selectedIssues = issues.filter((issue: unknown) => {
      const id = source === 'github' 
        ? (issue as { number: number }).number 
        : (issue as { id: string }).id;
      return selectedIds.has(id);
    });
    onImport(selectedIssues);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{source === 'github' ? '🐙 Import from GitHub' : '📐 Import from Linear'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {source === 'github' ? (
            <div className="import-config">
              <div className="config-field">
                <label>Repository (owner/repo)</label>
                <input
                  type="text"
                  value={repo}
                  onChange={e => setRepo(e.target.value)}
                  placeholder="e.g., facebook/react"
                />
              </div>
              <div className="config-field">
                <label>GitHub Token (optional, for private repos)</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder="ghp_..."
                />
              </div>
              <button 
                className="fetch-btn" 
                onClick={fetchGitHubIssues}
                disabled={!repo || loading}
              >
                {loading ? 'Loading...' : 'Fetch Issues'}
              </button>
            </div>
          ) : (
            <div className="import-config">
              <div className="config-field">
                <label>Linear API Key</label>
                <input
                  type="password"
                  value={linearApiKey}
                  onChange={e => setLinearApiKey(e.target.value)}
                  placeholder="lin_api_..."
                />
              </div>
              <div className="config-field">
                <label>Team ID (optional)</label>
                <input
                  type="text"
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  placeholder="Team ID"
                />
              </div>
              <button 
                className="fetch-btn" 
                onClick={fetchLinearIssues}
                disabled={!linearApiKey || loading}
              >
                {loading ? 'Loading...' : 'Fetch Issues'}
              </button>
            </div>
          )}
          
          {error && <div className="import-error">⚠️ {error}</div>}
          
          {issues.length > 0 && (
            <div className="issues-list">
              <div className="issues-header">
                <span>{issues.length} issues found</span>
                <span>{selectedIds.size} selected</span>
              </div>
              {issues.map((issue: unknown) => {
                const ghIssue = issue as { number: number; title: string; labels: Array<{ name: string }> };
                const linIssue = issue as { id: string; identifier: string; title: string };
                const id = source === 'github' ? ghIssue.number : linIssue.id;
                const title = source === 'github' 
                  ? `#${ghIssue.number}: ${ghIssue.title}`
                  : `${linIssue.identifier}: ${linIssue.title}`;
                
                return (
                  <div 
                    key={id} 
                    className={`issue-item ${selectedIds.has(id) ? 'selected' : ''}`}
                    onClick={() => toggleSelect(id)}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(id)}
                      onChange={() => toggleSelect(id)}
                    />
                    <span className="issue-title">{title}</span>
                    {source === 'github' && ghIssue.labels?.slice(0, 3).map(l => (
                      <span key={l.name} className="issue-label">{l.name}</span>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="import-btn" 
            onClick={handleImport}
            disabled={selectedIds.size === 0}
          >
            Import {selectedIds.size} Issues
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskQueueScreen() {
  const {
    taskQueue,
    employees,
    setScreen,
    removeFromQueue,
    reorderQueue,
    processQueue,
    toggleAutoAssign,
    importFromGitHub,
    importFromLinear,
    clearQueue,
    addToQueue,
  } = useGameStore();
  
  const [showImportModal, setShowImportModal] = useState<'github' | 'linear' | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const queuedCount = taskQueue.items.filter(i => i.status === 'queued').length;
  const assignedCount = taskQueue.items.filter(i => i.status === 'assigned').length;
  const idleEmployees = employees.filter(e => e.status === 'idle').length;

  const handleAddManualTask = () => {
    if (!newTaskTitle.trim()) return;
    
    addToQueue({
      source: 'manual',
      title: newTaskTitle,
      description: '',
      type: 'feature',
      priority: 'medium',
      labels: [],
      autoAssign: true,
    });
    
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const handleImport = (source: 'github' | 'linear', issues: unknown[]) => {
    if (source === 'github') {
      importFromGitHub(issues as Array<{ number: number; title: string; body: string | null; labels: Array<{ name: string }> }>);
    } else {
      importFromLinear(issues as Array<{ id: string; identifier: string; title: string; description: string | null; priority: number; labels: Array<{ name: string }> }>);
    }
  };

  return (
    <Terminal title="TASK QUEUE - RTS COMMAND CENTER" showControls>
      <div className="queue-screen">
        <div className="queue-header-bar">
          <button className="back-btn" onClick={() => setScreen('command')}>
            ← Back to Command Center
          </button>
          
          <div className="queue-stats">
            <span className="stat">📋 {queuedCount} queued</span>
            <span className="stat">🔨 {assignedCount} assigned</span>
            <span className="stat">💤 {idleEmployees} idle</span>
          </div>
          
          <div className="queue-controls">
            <button 
              className={`auto-assign-btn ${taskQueue.autoAssignEnabled ? 'enabled' : ''}`}
              onClick={toggleAutoAssign}
            >
              {taskQueue.autoAssignEnabled ? '⏸️ Pause Auto' : '▶️ Auto Assign'}
            </button>
            <button className="process-btn" onClick={processQueue}>
              ⚡ Process Now
            </button>
          </div>
        </div>

        <div className="queue-main">
          <div className="queue-panel">
            <Box title="📥 IMPORT TASKS" className="import-section">
              <div className="import-buttons">
                <button 
                  className="import-source-btn github"
                  onClick={() => setShowImportModal('github')}
                >
                  🐙 Import from GitHub
                </button>
                <button 
                  className="import-source-btn linear"
                  onClick={() => setShowImportModal('linear')}
                >
                  📐 Import from Linear
                </button>
                <button 
                  className="import-source-btn manual"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  ✏️ Add Manual Task
                </button>
              </div>
              
              {showAddForm && (
                <div className="add-form">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    onKeyDown={e => e.key === 'Enter' && handleAddManualTask()}
                    autoFocus
                  />
                  <button onClick={handleAddManualTask}>Add</button>
                </div>
              )}
            </Box>

            <Box title="📋 TASK QUEUE" className="queue-list-section">
              <div className="queue-list-header">
                <span>Tasks execute in order when employees are idle</span>
                <button className="clear-btn" onClick={clearQueue}>
                  🗑️ Clear Queued
                </button>
              </div>
              
              <div className="queue-list">
                {taskQueue.items.length === 0 ? (
                  <div className="empty-queue">
                    <p>No tasks in queue</p>
                    <p className="hint">Import from GitHub/Linear or add manually</p>
                  </div>
                ) : (
                  taskQueue.items.map((item, index) => (
                    <QueueItem
                      key={item.id}
                      item={item}
                      onRemove={() => removeFromQueue(item.id)}
                      onMoveUp={() => reorderQueue(item.id, index - 1)}
                      onMoveDown={() => reorderQueue(item.id, index + 1)}
                      isFirst={index === 0}
                      isLast={index === taskQueue.items.length - 1}
                    />
                  ))
                )}
              </div>
            </Box>
          </div>

          <Box title="ℹ️ HOW IT WORKS" className="help-section">
            <div className="help-content">
              <h3>🎮 RTS-Style Task Execution</h3>
              <ol>
                <li><strong>Import tasks</strong> from GitHub Issues or Linear</li>
                <li><strong>Queue orders</strong> by priority - drag to reorder</li>
                <li><strong>Auto-assign</strong> executes when employees are idle</li>
                <li><strong>Watch progress</strong> in real-time on Command Center</li>
              </ol>
              
              <h3>🏷️ Auto-Detection</h3>
              <p>Labels are automatically detected:</p>
              <ul>
                <li><code>bug</code> → 🐛 Bug type</li>
                <li><code>design</code> → 🎨 Design type</li>
                <li><code>urgent</code>, <code>critical</code> → 🔴 Critical priority</li>
                <li><code>high</code>, <code>priority</code> → 🟠 High priority</li>
              </ul>
              
              <h3>⌨️ Shortcuts</h3>
              <ul>
                <li><kbd>Q</kbd> - Toggle this queue view</li>
                <li><kbd>Space</kbd> - Pause/Resume auto-assign</li>
              </ul>
            </div>
          </Box>
        </div>
      </div>
      
      {showImportModal && (
        <ImportModal
          source={showImportModal}
          onClose={() => setShowImportModal(null)}
          onImport={(issues) => handleImport(showImportModal, issues)}
        />
      )}
    </Terminal>
  );
}

export default TaskQueueScreen;
