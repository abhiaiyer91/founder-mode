import { useEffect } from 'react';
import { Terminal } from '../tui';
import { useGameStore } from '../../store/gameStore';
import { PMAdvisor } from '../PMAdvisor';
import './DashboardScreen.css';

// Format game time
function formatGameTime(ticks: number): string {
  const days = Math.floor(ticks / 480);
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (weeks > 0) {
    return `Week ${weeks + 1}, Day ${remainingDays + 1}`;
  }
  return `Day ${days + 1}`;
}

// Pipeline Node Component
function PipelineNode({ 
  label, 
  count, 
  icon,
  isActive,
  onClick,
}: { 
  label: string; 
  count: number; 
  icon: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`pipeline-node ${isActive ? 'active' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <span className="node-icon">{icon}</span>
      <span className="node-count">{count}</span>
      <span className="node-label">{label}</span>
    </div>
  );
}

// Employee Row Component
function EmployeeRow({ 
  employee,
  task,
  isSelected,
  onSelect,
}: { 
  employee: {
    id: string;
    name: string;
    role: string;
    avatarEmoji: string;
    skillLevel: string;
    status: string;
    morale: number;
  };
  task?: {
    title: string;
    progressTicks: number;
    estimatedTicks: number;
  };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const progress = task ? Math.round((task.progressTicks / task.estimatedTicks) * 100) : 0;
  const roleLabels: Record<string, string> = {
    engineer: 'Engineer',
    designer: 'Designer',
    pm: 'PM',
    marketer: 'Marketer',
  };
  const skillLabels: Record<string, string> = {
    junior: 'Jr',
    mid: 'Mid',
    senior: 'Sr',
    lead: 'Lead',
  };

  return (
    <div 
      className={`employee-row ${isSelected ? 'selected' : ''} ${employee.status}`}
      onClick={onSelect}
    >
      <div className="emp-avatar">{employee.avatarEmoji}</div>
      <div className="emp-info">
        <div className="emp-name">{employee.name}</div>
        <div className="emp-role">{skillLabels[employee.skillLevel]} {roleLabels[employee.role]}</div>
      </div>
      <div className="emp-status">
        {employee.status === 'working' && task ? (
          <>
            <div className="emp-task" title={task.title}>
              🔨 {task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}
            </div>
            <div className="emp-progress">
              <div className="progress-bar-mini">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-pct">{progress}%</span>
            </div>
          </>
        ) : (
          <div className="emp-idle">💤 Idle</div>
        )}
      </div>
      <div className="emp-morale" title={`Morale: ${employee.morale}%`}>
        {employee.morale >= 80 ? '😊' : employee.morale >= 50 ? '😐' : '😟'}
      </div>
    </div>
  );
}

// Activity Item
function ActivityItem({ entry }: { entry: { message: string; type: string; timestamp: number } }) {
  const typeIcons: Record<string, string> = {
    work: '🔨',
    hire: '👋',
    task: '📋',
    event: '⚡',
    money: '💰',
    complete: '✅',
    system: '🔔',
  };
  
  const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
  const timeStr = timeAgo < 60 ? `${timeAgo}s` : `${Math.round(timeAgo / 60)}m`;

  return (
    <div className="activity-item">
      <span className="activity-icon">{typeIcons[entry.type] || '▸'}</span>
      <span className="activity-message">{entry.message}</span>
      <span className="activity-time">{timeStr}</span>
    </div>
  );
}

export function DashboardScreen() {
  const {
    tick,
    money,
    project,
    employees,
    tasks,
    taskQueue,
    activityLog,
    gameSpeed,
    selectedEmployeeIds,
    setScreen,
    setGameSpeed,
    togglePause,
    selectEmployee,
    selectEmployees,
  } = useGameStore();

  // Calculate pipeline stats
  const queueCount = taskQueue.items.filter(i => i.status === 'queued').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const todoCount = tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
  
  // Project progress
  const totalTasks = tasks.length;
  const projectProgress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'q' || e.key === 'Q') {
        setScreen('queue');
      } else if (e.key === 'h' || e.key === 'H') {
        setScreen('hire');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, setScreen]);

  return (
    <Terminal title="FOUNDER MODE" showControls>
      <div className="dashboard">
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <span className="brand">🚀 FOUNDER MODE</span>
          </div>
          <div className="topbar-center">
            <span className="stat">💰 ${money.toLocaleString()}</span>
            <span className="stat">📅 {formatGameTime(tick)}</span>
          </div>
          <div className="topbar-right">
            <div className="speed-controls">
              <button 
                className={`speed-btn ${gameSpeed === 'paused' ? 'active' : ''}`}
                onClick={togglePause}
              >⏸</button>
              <button 
                className={`speed-btn ${gameSpeed === 'normal' ? 'active' : ''}`}
                onClick={() => setGameSpeed('normal')}
              >▶</button>
              <button 
                className={`speed-btn ${gameSpeed === 'fast' ? 'active' : ''}`}
                onClick={() => setGameSpeed('fast')}
              >▶▶</button>
              <button 
                className={`speed-btn ${gameSpeed === 'turbo' ? 'active' : ''}`}
                onClick={() => setGameSpeed('turbo')}
              >▶▶▶</button>
            </div>
            <button className="queue-btn" onClick={() => setScreen('queue')}>
              📥 Queue {queueCount > 0 && <span className="badge">{queueCount}</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Left Column - Pipeline */}
          <div className="dashboard-left">
            <div className="panel pipeline-panel">
              <h3 className="panel-title">📊 PIPELINE</h3>
              
              <div className="pipeline-flow">
                <div className="pipeline-sources">
                  <div className="source-node" onClick={() => setScreen('queue')}>
                    <span>🐙 GitHub</span>
                  </div>
                  <div className="source-connector">┬</div>
                  <div className="source-node" onClick={() => setScreen('queue')}>
                    <span>📐 Linear</span>
                  </div>
                </div>
                
                <div className="pipeline-arrow">──→</div>
                
                <PipelineNode 
                  label="Queue" 
                  count={queueCount} 
                  icon="📥"
                  isActive={queueCount > 0}
                  onClick={() => setScreen('queue')}
                />
                
                <div className="pipeline-arrow">│</div>
                <div className="pipeline-arrow">▼</div>
                
                <PipelineNode 
                  label="Todo" 
                  count={todoCount} 
                  icon="📋"
                  onClick={() => setScreen('tasks')}
                />
                
                <div className="pipeline-arrow">│</div>
                <div className="pipeline-arrow">▼</div>
                
                <PipelineNode 
                  label="In Progress" 
                  count={inProgressCount} 
                  icon="🔨"
                  isActive={inProgressCount > 0}
                />
                
                <div className="pipeline-arrow">│</div>
                <div className="pipeline-arrow">▼</div>
                
                <PipelineNode 
                  label="Review" 
                  count={reviewCount} 
                  icon="👀"
                  isActive={reviewCount > 0}
                  onClick={() => setScreen('tasks')}
                />
                
                <div className="pipeline-arrow">│</div>
                <div className="pipeline-arrow">▼</div>
                
                <PipelineNode 
                  label="Done" 
                  count={doneCount} 
                  icon="✅"
                />
                
                <div className="pipeline-arrow">│</div>
                <div className="pipeline-arrow">▼</div>
                
                <div className="pipeline-output">
                  <span>📦 Git</span>
                  <span className="output-count">{doneCount} commits</span>
                </div>
              </div>
            </div>

            {/* Project Progress */}
            <div className="panel project-panel">
              <h3 className="panel-title">🎯 PROJECT</h3>
              <div className="project-name">{project?.name || 'No Project'}</div>
              <div className="project-progress-bar">
                <div 
                  className="project-progress-fill" 
                  style={{ width: `${projectProgress}%` }}
                />
              </div>
              <div className="project-stats">
                <span>{projectProgress}% complete</span>
                <span>{doneCount}/{totalTasks} tasks</span>
              </div>
            </div>
          </div>

          {/* Right Column - Team & Activity */}
          <div className="dashboard-right">
            <div className="panel team-panel">
              <div className="panel-header">
                <h3 className="panel-title">👥 TEAM</h3>
                <button className="hire-btn" onClick={() => setScreen('hire')}>
                  + Hire
                </button>
              </div>
              
              <div className="team-list">
                {employees.length === 0 ? (
                  <div className="empty-team">
                    <p>No team members yet</p>
                    <button onClick={() => setScreen('hire')}>Hire your first employee</button>
                  </div>
                ) : (
                  employees.map(emp => {
                    const currentTask = tasks.find(t => t.id === emp.currentTaskId);
                    return (
                      <EmployeeRow
                        key={emp.id}
                        employee={emp}
                        task={currentTask}
                        isSelected={selectedEmployeeIds.includes(emp.id)}
                        onSelect={() => {
                          if (window.event && ((window.event as KeyboardEvent).ctrlKey || (window.event as KeyboardEvent).metaKey)) {
                            // Multi-select toggle
                            if (selectedEmployeeIds.includes(emp.id)) {
                              selectEmployees(selectedEmployeeIds.filter(id => id !== emp.id));
                            } else {
                              selectEmployees([...selectedEmployeeIds, emp.id]);
                            }
                          } else {
                            selectEmployee(emp.id);
                          }
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="panel activity-panel">
              <h3 className="panel-title">📜 ACTIVITY</h3>
              <div className="activity-list">
                {activityLog.slice(0, 10).map(entry => (
                  <ActivityItem key={entry.id} entry={entry} />
                ))}
                {activityLog.length === 0 && (
                  <div className="empty-activity">No activity yet</div>
                )}
              </div>
            </div>
            
            {/* PM Advisor - Human in the Loop */}
            <div className="panel advisor-panel">
              <PMAdvisor />
            </div>
          </div>
        </div>

        {/* Bottom Bar - Quick Actions */}
        <div className="dashboard-bottombar">
          <div className="quick-actions">
            <button onClick={() => setScreen('queue')}>📥 Import Tasks</button>
            <button onClick={() => setScreen('hire')}>👋 Hire</button>
            <button onClick={() => setScreen('tasks')}>📋 Tasks</button>
            <button onClick={() => setScreen('code')}>💻 Code</button>
            <button onClick={() => setScreen('settings')}>⚙️ Settings</button>
          </div>
          <div className="keyboard-hints">
            <span><kbd>Space</kbd> Pause</span>
            <span><kbd>Q</kbd> Queue</span>
            <span><kbd>H</kbd> Hire</span>
          </div>
        </div>
      </div>
    </Terminal>
  );
}

export default DashboardScreen;
