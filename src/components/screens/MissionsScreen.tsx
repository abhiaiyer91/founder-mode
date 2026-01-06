/**
 * Missions Screen - PM-created feature branches
 * 
 * View and manage missions (git worktrees), create PRs, and merge
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { missionsApi } from '../../lib/api';
import { useGitHub } from '../../lib/github/useGitHub';
import { DiffViewer, SimpleDiff } from '../DiffViewer';
import { MISSION_TEMPLATES } from '../../types/missions';
import type { Mission, MissionPriority, MissionCommit } from '../../types';
import './MissionsScreen.css';

// Mission card component
function MissionCard({ 
  mission, 
  isActive,
  onSelect,
  onAction,
  isLoading = false,
}: { 
  mission: Mission;
  isActive: boolean;
  onSelect: () => void;
  onAction: (action: string) => void;
  isLoading?: boolean;
}) {
  const { tasks } = useGameStore();
  const missionTasks = tasks.filter(t => mission.taskIds.includes(t.id));
  const completedTasks = missionTasks.filter(t => t.status === 'done').length;
  const progress = missionTasks.length > 0 
    ? Math.round((completedTasks / missionTasks.length) * 100) 
    : 0;

  const statusColors: Record<string, string> = {
    planning: '#60a5fa',
    active: '#4ade80',
    review: '#fbbf24',
    merging: '#a78bfa',
    completed: '#22c55e',
    abandoned: '#6b7280',
  };

  const statusEmoji: Record<string, string> = {
    planning: '📋',
    active: '🚀',
    review: '👀',
    merging: '🔀',
    completed: '✅',
    abandoned: '🚫',
  };

  return (
    <div 
      className={`mission-card ${isActive ? 'active' : ''} status-${mission.status}`}
      onClick={onSelect}
    >
      <div className="mission-header">
        <div className="mission-status" style={{ background: statusColors[mission.status] }}>
          {statusEmoji[mission.status]} {mission.status}
        </div>
        <div className="mission-priority" data-priority={mission.priority}>
          {mission.priority}
        </div>
      </div>
      
      <h3 className="mission-name">{mission.name}</h3>
      <p className="mission-description">{mission.description}</p>
      
      <div className="mission-branch">
        <span className="branch-icon">🌿</span>
        <code>{mission.branchName}</code>
      </div>
      
      <div className="mission-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">
          {completedTasks}/{missionTasks.length} tasks ({progress}%)
        </span>
      </div>
      
      <div className="mission-stats">
        <span title="Commits">📝 {mission.commits.length}</span>
        {mission.pullRequestUrl && (
          <a 
            href={mission.pullRequestUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="View PR"
          >
            🔗 PR #{mission.pullRequestNumber}
          </a>
        )}
      </div>
      
      <div className="mission-actions">
        {mission.status === 'planning' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAction('start'); }}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '🚀'} Start
          </button>
        )}
        {mission.status === 'active' && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('push'); }}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '⬆️'} Push
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction('pr'); }}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔀'} Create PR
            </button>
          </>
        )}
        {mission.status === 'review' && mission.pullRequestNumber && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAction('merge'); }}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : '✅'} Merge
          </button>
        )}
        {mission.status !== 'completed' && mission.status !== 'abandoned' && (
          <button 
            className="danger" 
            onClick={(e) => { e.stopPropagation(); onAction('abandon'); }}
            disabled={isLoading}
          >
            🚫
          </button>
        )}
      </div>
    </div>
  );
}

// Create mission modal
function CreateMissionModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void;
  onCreate: (name: string, description: string, priority: MissionPriority) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MissionPriority>('medium');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), priority);
    onClose();
  };

  const applyTemplate = (template: typeof MISSION_TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setShowTemplates(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Create New Mission</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <button 
            className="template-toggle"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            {showTemplates ? '📝 Custom' : '📋 Use Template'}
          </button>
          
          {showTemplates ? (
            <div className="template-list">
              {MISSION_TEMPLATES.map((template, i) => (
                <div 
                  key={i} 
                  className="template-item"
                  onClick={() => applyTemplate(template)}
                >
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <span className="task-count">{template.taskPatterns.length} tasks</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Mission Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., User Authentication"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this mission accomplish?"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <div className="priority-options">
                  {(['low', 'medium', 'high', 'critical'] as MissionPriority[]).map(p => (
                    <button
                      key={p}
                      className={`priority-btn ${priority === p ? 'active' : ''}`}
                      data-priority={p}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="create-btn" 
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            🚀 Create Mission
          </button>
        </div>
      </div>
    </div>
  );
}

// Mission detail panel with commits and diffs
function MissionDetail({ 
  mission, 
  onClose 
}: { 
  mission: Mission; 
  onClose: () => void;
}) {
  const { tasks } = useGameStore();
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'commits' | 'files'>('commits');
  
  const missionTasks = tasks.filter(t => mission.taskIds.includes(t.id));
  
  return (
    <div className="mission-detail-panel">
      <div className="detail-header">
        <div className="detail-title">
          <h2>{mission.name}</h2>
          <span className={`status-badge status-${mission.status}`}>
            {mission.status}
          </span>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="detail-meta">
        <div className="meta-item">
          <span className="meta-label">Branch:</span>
          <code>{mission.branchName}</code>
        </div>
        <div className="meta-item">
          <span className="meta-label">Base:</span>
          <code>{mission.baseBranch}</code>
        </div>
        {mission.pullRequestUrl && (
          <div className="meta-item">
            <span className="meta-label">PR:</span>
            <a href={mission.pullRequestUrl} target="_blank" rel="noopener noreferrer">
              #{mission.pullRequestNumber}
            </a>
          </div>
        )}
      </div>
      
      <div className="detail-tabs">
        <button 
          className={activeTab === 'commits' ? 'active' : ''}
          onClick={() => setActiveTab('commits')}
        >
          📝 Commits ({mission.commits.length})
        </button>
        <button 
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          ✅ Tasks ({missionTasks.length})
        </button>
        <button 
          className={activeTab === 'files' ? 'active' : ''}
          onClick={() => setActiveTab('files')}
        >
          📁 Files
        </button>
      </div>
      
      <div className="detail-content">
        {activeTab === 'commits' && (
          <div className="commits-list">
            {mission.commits.length === 0 ? (
              <div className="empty-commits">
                <span>📭</span>
                <p>No commits yet</p>
                <small>Commits will appear here as your team works</small>
              </div>
            ) : (
              mission.commits.map((commit: MissionCommit) => (
                <div key={commit.sha} className="commit-item">
                  <div 
                    className="commit-header"
                    onClick={() => setExpandedCommit(
                      expandedCommit === commit.sha ? null : commit.sha
                    )}
                  >
                    <div className="commit-info">
                      <span className="commit-sha">{commit.sha.slice(0, 7)}</span>
                      <span className="commit-message">{commit.message}</span>
                    </div>
                    <div className="commit-meta">
                      <span className="commit-files">
                        {commit.filesChanged.length} files
                      </span>
                      <span className="commit-time">
                        {new Date(commit.timestamp).toLocaleDateString()}
                      </span>
                      <span className="expand-icon">
                        {expandedCommit === commit.sha ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedCommit === commit.sha && (
                    <div className="commit-diff-panel">
                      {commit.diffs && commit.diffs.length > 0 ? (
                        commit.diffs.map((diff, i) => (
                          <DiffViewer
                            key={i}
                            oldCode={diff.oldContent}
                            newCode={diff.newContent}
                            fileName={diff.path}
                            oldTitle="Before"
                            newTitle="After"
                          />
                        ))
                      ) : (
                        <div className="files-changed">
                          <h4>Files Changed:</h4>
                          {commit.filesChanged.map((file, i) => (
                            <SimpleDiff
                              key={i}
                              fileName={file}
                              additions={['// New code added']}
                              deletions={[]}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="tasks-list">
            {missionTasks.map(task => (
              <div key={task.id} className={`task-item status-${task.status}`}>
                <span className="task-status">
                  {task.status === 'done' ? '✅' : 
                   task.status === 'in_progress' ? '🔨' : 
                   task.status === 'review' ? '👀' : '📋'}
                </span>
                <span className="task-title">{task.title}</span>
                <span className={`task-priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'files' && (
          <div className="files-overview">
            <p className="files-summary">
              All files changed across {mission.commits.length} commits
            </p>
            {mission.commits.flatMap(c => c.filesChanged).filter((f, i, arr) => 
              arr.indexOf(f) === i // Unique files
            ).map((file, i) => (
              <div key={i} className="file-item">
                <span className="file-icon">📄</span>
                <span className="file-path">{file}</span>
              </div>
            ))}
            {mission.commits.length === 0 && (
              <div className="empty-files">
                <p>No files changed yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main missions screen
export function MissionsScreen() {
  const { 
    missions, 
    activeMissionId,
    createMission,
    startMission,
    setActiveMission,
    setMissionPR,
    abandonMission,
    completeMission,
    addNotification,
  } = useGameStore();
  
  const { user, isAuthenticated } = useGitHub();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Configure missions API with GitHub credentials
  if (user && isAuthenticated) {
    // Get repo from localStorage or user's first repo
    const savedRepo = localStorage.getItem('founder_mode_repo');
    if (savedRepo) {
      missionsApi.configure({
        token: user.token,
        repo: savedRepo,
      });
    }
  }

  const handleCreate = (name: string, description: string, priority: MissionPriority) => {
    createMission(name, description, priority);
  };

  const handleAction = async (mission: Mission, action: string) => {
    setActionLoading(`${mission.id}-${action}`);
    
    try {
      switch (action) {
        case 'start': {
          // Create worktree
          const result = await missionsApi.createWorktree(
            mission.id,
            mission.branchName,
            mission.baseBranch
          );
          
          if (result.success) {
            startMission(mission.id);
            addNotification(`🚀 Mission "${mission.name}" started!`, 'success');
          } else {
            // Start anyway if worktree creation fails (might be local dev)
            startMission(mission.id);
            addNotification(`Mission started (worktree: ${result.error || 'skipped'})`, 'info');
          }
          break;
        }
        
        case 'push': {
          const result = await missionsApi.push(mission.id, mission.branchName);
          if (result.success) {
            addNotification(`⬆️ Branch pushed to ${result.repo}`, 'success');
          } else {
            addNotification(`Failed to push: ${result.error}`, 'error');
          }
          break;
        }
        
        case 'pr': {
          const missionTasks = useGameStore.getState().tasks.filter(
            t => mission.taskIds.includes(t.id)
          );
          const taskList = missionTasks.map(t => `- ${t.title}`).join('\n');
          
          const result = await missionsApi.createPR(
            mission.id,
            `🎯 ${mission.name}`,
            `## Mission: ${mission.name}\n\n${mission.description}\n\n### Tasks Completed\n${taskList}`,
            mission.branchName
          );
          
          if (result.success && result.pullRequestUrl && result.pullRequestNumber) {
            setMissionPR(mission.id, result.pullRequestUrl, result.pullRequestNumber);
            addNotification(`🔗 PR created: ${result.pullRequestUrl}`, 'success');
          } else {
            addNotification(`Failed to create PR: ${result.error}`, 'error');
          }
          break;
        }
        
        case 'merge': {
          if (!mission.pullRequestNumber) break;
          
          const result = await missionsApi.merge(mission.id, mission.pullRequestNumber);
          if (result.success) {
            completeMission(mission.id);
          } else {
            addNotification(`Failed to merge: ${result.error}`, 'error');
          }
          break;
        }
        
        case 'abandon': {
          abandonMission(mission.id);
          // Optionally remove worktree
          await missionsApi.removeWorktree(mission.id, true);
          break;
        }
      }
    } catch (error) {
      addNotification(`Action failed: ${String(error)}`, 'error');
    }
    
    setActionLoading(null);
  };

  // Filter missions
  const filteredMissions = missions.filter(m => {
    if (filter === 'active') return ['planning', 'active', 'review', 'merging'].includes(m.status);
    if (filter === 'completed') return ['completed', 'abandoned'].includes(m.status);
    return true;
  });

  // Stats
  const stats = {
    total: missions.length,
    active: missions.filter(m => m.status === 'active').length,
    review: missions.filter(m => m.status === 'review').length,
    completed: missions.filter(m => m.status === 'completed').length,
  };

  return (
    <div className="missions-screen">
      <div className="missions-header">
        <div className="header-left">
          <h1>🎯 Missions</h1>
          <p>PM-created feature branches as git worktrees</p>
        </div>
        
        <div className="header-right">
          <div className="mission-stats">
            <span className="stat">📋 {stats.total} total</span>
            <span className="stat active">🚀 {stats.active} active</span>
            <span className="stat review">👀 {stats.review} review</span>
            <span className="stat completed">✅ {stats.completed} done</span>
          </div>
          
          <button 
            className="create-mission-btn"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ New Mission
          </button>
        </div>
      </div>
      
      {!isAuthenticated && (
        <div className="github-warning">
          ⚠️ Connect GitHub (via Save button) to push branches and create PRs
        </div>
      )}
      
      <div className="missions-filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''} 
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>
      
      <div className={`missions-layout ${activeMissionId ? 'with-detail' : ''}`}>
        <div className="missions-grid">
          {filteredMissions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎯</span>
              <h3>No missions yet</h3>
              <p>Create a mission to start working on a feature branch</p>
              <button onClick={() => setShowCreateModal(true)}>
                ➕ Create First Mission
              </button>
            </div>
          ) : (
            filteredMissions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                isActive={mission.id === activeMissionId}
                onSelect={() => {
                  setActiveMission(mission.id === activeMissionId ? null : mission.id);
                }}
                onAction={(action) => handleAction(mission, action)}
                isLoading={actionLoading?.startsWith(mission.id)}
              />
            ))
          )}
        </div>
        
        {activeMissionId && (() => {
          const selectedMission = missions.find(m => m.id === activeMissionId);
          if (!selectedMission) return null;
          return (
            <MissionDetail 
              mission={selectedMission}
              onClose={() => setActiveMission(null)}
            />
          );
        })()}
      </div>
      
      {showCreateModal && (
        <CreateMissionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export default MissionsScreen;
