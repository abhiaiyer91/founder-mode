import { useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ProgressBar } from '../tui';
import type { Employee, Task } from '../../types';
import './CommandCenter.css';

// Format game time
function formatGameTime(ticks: number): string {
  const hours = Math.floor(ticks / 60) % 24;
  const days = Math.floor(ticks / (60 * 24));
  const weeks = Math.floor(days / 7);
  
  if (weeks > 0) {
    return `Week ${weeks + 1}, Day ${(days % 7) + 1}`;
  }
  return `Day ${days + 1}, ${hours.toString().padStart(2, '0')}:00`;
}

// Employee Unit Card (RTS-style)
function EmployeeUnit({ 
  employee, 
  isSelected, 
  onClick, 
  onDoubleClick,
  task 
}: { 
  employee: Employee; 
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  task: Task | null;
}) {
  const progress = task ? (task.progressTicks / task.estimatedTicks) * 100 : 0;
  
  return (
    <div 
      className={`employee-unit ${isSelected ? 'selected' : ''} ${employee.status}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="unit-avatar">{employee.avatarEmoji}</div>
      <div className="unit-info">
        <div className="unit-name">{employee.name.split(' ')[0]}</div>
        <div className="unit-role">{employee.role}</div>
      </div>
      <div className="unit-status">
        {employee.status === 'working' && task ? (
          <div className="unit-progress">
            <div className="progress-mini" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <span className={`status-dot ${employee.status}`} />
        )}
      </div>
      <div className="unit-stats">
        <span className="stat" title="Productivity">⚡{employee.productivity}</span>
        <span className="stat" title="Morale">😊{employee.morale}</span>
      </div>
    </div>
  );
}

// Task Card (RTS-style)
function TaskCard({ 
  task, 
  isSelected,
  onClick,
  onAssign,
  onApprove,
  assignee
}: { 
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  onAssign: () => void;
  onApprove?: () => void;
  assignee: Employee | null;
}) {
  const progress = (task.progressTicks / task.estimatedTicks) * 100;
  const priorityColors: Record<string, string> = {
    critical: 'var(--color-error)',
    high: 'var(--color-warning)',
    medium: 'var(--color-accent)',
    low: 'var(--text-muted)',
  };
  const typeEmoji: Record<string, string> = {
    feature: '✨',
    bug: '🐛',
    design: '🎨',
    marketing: '📢',
    infrastructure: '🔧',
  };

  return (
    <div 
      className={`task-card ${isSelected ? 'selected' : ''} ${task.status}`}
      onClick={onClick}
      style={{ borderLeftColor: priorityColors[task.priority] }}
    >
      <div className="task-header">
        <span className="task-type">{typeEmoji[task.type]}</span>
        <span className="task-title">{task.title}</span>
        <span className={`task-priority ${task.priority}`}>{task.priority[0].toUpperCase()}</span>
      </div>
      
      {task.status === 'in_progress' && (
        <div className="task-progress-bar">
          <ProgressBar value={progress} max={100} width={8} showLabel={false} />
          <span className="progress-percent">{Math.round(progress)}%</span>
        </div>
      )}
      
      <div className="task-footer">
        {task.status === 'review' && onApprove ? (
          <button className="approve-btn" onClick={(e) => { e.stopPropagation(); onApprove(); }}>
            ✓ Approve
          </button>
        ) : assignee ? (
          <span className="task-assignee">{assignee.avatarEmoji} {assignee.name.split(' ')[0]}</span>
        ) : (
          <button className="assign-btn" onClick={(e) => { e.stopPropagation(); onAssign(); }}>
            + Assign
          </button>
        )}
        <span className="task-status-label">{task.status.replace('_', ' ')}</span>
      </div>
    </div>
  );
}

// Activity Feed
function ActivityFeed() {
  const activityLog = useGameStore(s => s.activityLog);
  
  return (
    <div className="activity-feed">
      <div className="feed-header">📜 Activity</div>
      <div className="feed-content">
        {activityLog.slice(0, 20).map(entry => (
          <div key={entry.id} className={`feed-entry ${entry.type}`}>
            <span className="feed-time">{formatGameTime(entry.tick)}</span>
            <span className="feed-message">{entry.message}</span>
          </div>
        ))}
        {activityLog.length === 0 && (
          <div className="feed-empty">No activity yet...</div>
        )}
      </div>
    </div>
  );
}

// Minimap / Project Overview
function ProjectMinimap() {
  const tasks = useGameStore(s => s.tasks);
  const project = useGameStore(s => s.project);
  
  const tasksByStatus = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
  };
  
  const total = tasks.length || 1;
  const completion = (tasksByStatus.done / total) * 100;
  
  return (
    <div className="project-minimap">
      <div className="minimap-header">
        <span>🎯 {project?.name || 'Project'}</span>
        <span className="completion">{Math.round(completion)}%</span>
      </div>
      <div className="minimap-bars">
        <div className="minimap-bar backlog" style={{ width: `${(tasksByStatus.backlog / total) * 100}%` }} title={`Backlog: ${tasksByStatus.backlog}`} />
        <div className="minimap-bar todo" style={{ width: `${(tasksByStatus.todo / total) * 100}%` }} title={`Todo: ${tasksByStatus.todo}`} />
        <div className="minimap-bar in-progress" style={{ width: `${(tasksByStatus.in_progress / total) * 100}%` }} title={`In Progress: ${tasksByStatus.in_progress}`} />
        <div className="minimap-bar review" style={{ width: `${(tasksByStatus.review / total) * 100}%` }} title={`Review: ${tasksByStatus.review}`} />
        <div className="minimap-bar done" style={{ width: `${(tasksByStatus.done / total) * 100}%` }} title={`Done: ${tasksByStatus.done}`} />
      </div>
      <div className="minimap-legend">
        <span className="legend-item"><span className="dot backlog" />Backlog</span>
        <span className="legend-item"><span className="dot todo" />Todo</span>
        <span className="legend-item"><span className="dot in-progress" />Active</span>
        <span className="legend-item"><span className="dot review" />Review</span>
        <span className="legend-item"><span className="dot done" />Done</span>
      </div>
    </div>
  );
}

// Command Bar (bottom)
function CommandBar() {
  const { 
    selectedEmployeeIds, 
    gameSpeed, 
    money, 
    tick,
    employees,
    tasks,
    togglePause,
    setGameSpeed,
    selectAllIdle,
    boostMorale,
    pmGenerateTask,
    setScreen,
  } = useGameStore();
  
  const idleCount = employees.filter(e => e.status === 'idle').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
  
  return (
    <div className="command-bar">
      <div className="command-section resources">
        <span className="resource money">💰 ${money.toLocaleString()}</span>
        <span className="resource time">⏱️ {formatGameTime(tick)}</span>
      </div>
      
      <div className="command-section status">
        <span className="status-item">👥 {employees.length} team</span>
        <span className="status-item idle">💤 {idleCount} idle</span>
        <span className="status-item active">🔨 {activeTasks} active</span>
        <span className="status-item pending">📋 {todoTasks} pending</span>
      </div>
      
      <div className="command-section actions">
        {selectedEmployeeIds.length > 0 && (
          <span className="selection-info">
            {selectedEmployeeIds.length} selected
          </span>
        )}
        <button className="cmd-btn" onClick={selectAllIdle} title="Select all idle [I]">
          Select Idle
        </button>
        <button className="cmd-btn" onClick={boostMorale} title="Pizza party! $1000">
          🍕 Boost
        </button>
        <button className="cmd-btn" onClick={pmGenerateTask} title="PM generates tasks">
          📊 Ideas
        </button>
        <button className="cmd-btn" onClick={() => setScreen('hire')} title="Hire new employees [H]">
          👋 Hire
        </button>
      </div>
      
      <div className="command-section speed">
        <button 
          className={`speed-btn ${gameSpeed === 'paused' ? 'active' : ''}`}
          onClick={togglePause}
          title="Pause [Space]"
        >
          ⏸
        </button>
        <button 
          className={`speed-btn ${gameSpeed === 'normal' ? 'active' : ''}`}
          onClick={() => setGameSpeed('normal')}
          title="Normal speed [1]"
        >
          ▶
        </button>
        <button 
          className={`speed-btn ${gameSpeed === 'fast' ? 'active' : ''}`}
          onClick={() => setGameSpeed('fast')}
          title="Fast [2]"
        >
          ▶▶
        </button>
        <button 
          className={`speed-btn ${gameSpeed === 'turbo' ? 'active' : ''}`}
          onClick={() => setGameSpeed('turbo')}
          title="Turbo [3]"
        >
          ▶▶▶
        </button>
      </div>
    </div>
  );
}

// Main Command Center
export function CommandCenter() {
  const { 
    employees, 
    tasks, 
    selectedEmployeeIds, 
    selectedTaskId,
    gameSpeed,
    selectEmployee,
    addToSelection,
    selectTask,
    quickAssignToTask,
    updateTaskStatus,
    setScreen,
    togglePause,
    setGameSpeed,
    selectAllIdle,
  } = useGameStore();
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        togglePause();
        break;
      case '1':
        setGameSpeed('normal');
        break;
      case '2':
        setGameSpeed('fast');
        break;
      case '3':
        setGameSpeed('turbo');
        break;
      case 'i':
        selectAllIdle();
        break;
      case 'h':
        setScreen('hire');
        break;
      case 't':
        setScreen('tasks');
        break;
      case 'escape':
        selectEmployee(null);
        selectTask(null);
        break;
    }
  }, [togglePause, setGameSpeed, selectAllIdle, setScreen, selectEmployee, selectTask]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Get tasks by status for the board
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  
  const handleEmployeeClick = (employee: Employee, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      addToSelection(employee.id);
    } else {
      selectEmployee(employee.id);
    }
  };
  
  const handleEmployeeDoubleClick = (employee: Employee) => {
    // Double-click to see employee details
    selectEmployee(employee.id);
    setScreen('team');
  };
  
  const handleTaskAssign = (taskId: string) => {
    if (selectedEmployeeIds.length > 0) {
      quickAssignToTask(taskId);
    } else {
      selectTask(taskId);
    }
  };

  return (
    <div className={`command-center ${gameSpeed === 'paused' ? 'paused' : ''}`}>
      {/* Top Bar */}
      <div className="cc-topbar">
        <div className="cc-title">
          <span className="title-icon">🏢</span>
          <span className="title-text">Command Center</span>
          {gameSpeed === 'paused' && <span className="paused-badge">PAUSED</span>}
        </div>
        <div className="cc-nav">
          <button className="nav-btn active">🎮 Command</button>
          <button className="nav-btn" onClick={() => setScreen('tasks')}>📋 Tasks</button>
          <button className="nav-btn" onClick={() => setScreen('team')}>👥 Team</button>
          <button className="nav-btn" onClick={() => setScreen('code')}>💻 Code</button>
          <button className="nav-btn" onClick={() => setScreen('settings')}>⚙️ Settings</button>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="cc-main">
        {/* Left: Employee Units */}
        <div className="cc-panel employees-panel">
          <div className="panel-header">
            <span>👥 Team ({employees.length})</span>
            <button className="panel-btn" onClick={() => setScreen('hire')}>+ Hire</button>
          </div>
          <div className="employees-grid">
            {employees.map(emp => (
              <EmployeeUnit
                key={emp.id}
                employee={emp}
                isSelected={selectedEmployeeIds.includes(emp.id)}
                onClick={(e) => handleEmployeeClick(emp, e)}
                onDoubleClick={() => handleEmployeeDoubleClick(emp)}
                task={tasks.find(t => t.id === emp.currentTaskId) || null}
              />
            ))}
            {employees.length === 0 && (
              <div className="empty-state">
                <p>No employees yet!</p>
                <button className="hire-btn" onClick={() => setScreen('hire')}>
                  👋 Hire Your First Employee
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Center: Task Board */}
        <div className="cc-panel tasks-panel">
          <div className="panel-header">
            <span>📋 Tasks</span>
            <span className="task-count">{tasks.length} total</span>
          </div>
          <div className="task-columns">
            <div className="task-column">
              <div className="column-header">📥 Todo ({todoTasks.length})</div>
              <div className="column-tasks">
                {todoTasks.slice(0, 5).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onClick={() => selectTask(task.id)}
                    onAssign={() => handleTaskAssign(task.id)}
                    assignee={null}
                  />
                ))}
                {todoTasks.length > 5 && (
                  <div className="more-tasks">+{todoTasks.length - 5} more</div>
                )}
              </div>
            </div>
            <div className="task-column">
              <div className="column-header">🔨 In Progress ({inProgressTasks.length})</div>
              <div className="column-tasks">
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onClick={() => selectTask(task.id)}
                    onAssign={() => handleTaskAssign(task.id)}
                    assignee={employees.find(e => e.id === task.assigneeId) || null}
                  />
                ))}
              </div>
            </div>
            <div className="task-column">
              <div className="column-header">👀 Review ({reviewTasks.length})</div>
              <div className="column-tasks">
                {reviewTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onClick={() => selectTask(task.id)}
                    onAssign={() => {}}
                    onApprove={() => updateTaskStatus(task.id, 'done')}
                    assignee={employees.find(e => e.id === task.assigneeId) || null}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Activity & Minimap */}
        <div className="cc-panel sidebar-panel">
          <ProjectMinimap />
          <ActivityFeed />
        </div>
      </div>
      
      {/* Bottom: Command Bar */}
      <CommandBar />
      
      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint">
        <span>[Space] Pause</span>
        <span>[1-3] Speed</span>
        <span>[I] Select Idle</span>
        <span>[H] Hire</span>
        <span>[Esc] Deselect</span>
      </div>
    </div>
  );
}

export default CommandCenter;
