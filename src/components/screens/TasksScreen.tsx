import { useState } from 'react';
import { Terminal, Box, Input, Menu, ProgressBar } from '../tui';
import type { MenuItem } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types';
import './TasksScreen.css';

function TaskCard({ 
  task, 
  onAssign, 
  onUpdateStatus,
  onAIBoost,
  aiEnabled,
}: { 
  task: Task; 
  onAssign: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
  onAIBoost: () => void;
  aiEnabled: boolean;
}) {
  const assignee = useGameStore(state => 
    state.employees.find(e => e.id === task.assigneeId)
  );

  const priorityColors = {
    low: 'var(--text-muted)',
    medium: 'var(--color-accent)',
    high: 'var(--color-warning)',
    critical: 'var(--color-error)',
  };

  const typeIcons = {
    feature: '✨',
    bug: '🐛',
    design: '🎨',
    marketing: '📢',
    infrastructure: '🔧',
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <span className="task-type">{typeIcons[task.type]}</span>
        <span className="task-title">{task.title}</span>
        <span 
          className="task-priority"
          style={{ color: priorityColors[task.priority] }}
        >
          [{task.priority.toUpperCase()}]
        </span>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {task.status === 'in_progress' && (
          <ProgressBar
            value={task.progressTicks}
            max={task.estimatedTicks}
            width={10}
            showLabel
            variant="accent"
            animated
          />
        )}
        
        {assignee ? (
          <div className="task-assignee-row">
            <div className="task-assignee">
              {assignee.avatarEmoji} {assignee.name}
            </div>
            {aiEnabled && task.status === 'in_progress' && (
              <button className="ai-boost-button" onClick={onAIBoost}>
                🤖 AI Boost
              </button>
            )}
          </div>
        ) : task.status !== 'done' && (
          <button className="assign-button" onClick={onAssign}>
            Assign →
          </button>
        )}
      </div>

      {task.status === 'review' && (
        <div className="task-actions">
          <button 
            className="action-button approve"
            onClick={() => onUpdateStatus('done')}
          >
            ✓ Approve
          </button>
          <button 
            className="action-button reject"
            onClick={() => onUpdateStatus('in_progress')}
          >
            ✗ Request Changes
          </button>
        </div>
      )}
    </div>
  );
}

export function TasksScreen() {
  const { 
    tasks, 
    employees, 
    setScreen, 
    createTask, 
    assignTask,
    updateTaskStatus,
    aiSettings,
    aiWorkOnTask,
  } = useGameStore();

  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('feature');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  const handleAIBoost = async (taskId: string) => {
    await aiWorkOnTask(taskId);
  };

  const columns: { status: TaskStatus; title: string }[] = [
    { status: 'backlog', title: '📥 BACKLOG' },
    { status: 'todo', title: '📋 TODO' },
    { status: 'in_progress', title: '🔨 IN PROGRESS' },
    { status: 'review', title: '👀 REVIEW' },
    { status: 'done', title: '✅ DONE' },
  ];

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createTask({
        title: newTaskTitle.trim(),
        description: '',
        type: newTaskType,
        priority: newTaskPriority,
        status: 'backlog',
        assigneeId: null,
        estimatedTicks: 100, // Default estimate
      });
      setNewTaskTitle('');
      setShowNewTask(false);
    }
  };

  const handleAssign = (taskId: string, employeeId: string) => {
    assignTask(taskId, employeeId);
    setAssigningTaskId(null);
  };

  const availableEmployees = employees.filter(e => e.status === 'idle');

  const typeOptions: MenuItem[] = [
    { id: 'feature', label: '✨ Feature', shortcut: 'F' },
    { id: 'bug', label: '🐛 Bug Fix', shortcut: 'B' },
    { id: 'design', label: '🎨 Design', shortcut: 'D' },
    { id: 'infrastructure', label: '🔧 Infra', shortcut: 'I' },
  ];

  const priorityOptions: MenuItem[] = [
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
    { id: 'critical', label: 'Critical' },
  ];

  return (
    <div className="tasks-screen">
      <Terminal title="TASK BOARD">
        <div className="tasks-layout">
          <div className="tasks-header">
            <h2>Task Management</h2>
            <div className="header-actions">
              <button 
                className="new-task-button"
                onClick={() => setShowNewTask(true)}
              >
                + New Task
              </button>
              <button 
                className="back-button"
                onClick={() => setScreen('office')}
              >
                ← Office
              </button>
            </div>
          </div>

          {showNewTask && (
            <Box title="CREATE NEW TASK" variant="accent" className="new-task-form">
              <div className="form-row">
                <Input
                  value={newTaskTitle}
                  onChange={setNewTaskTitle}
                  onSubmit={handleCreateTask}
                  placeholder="Task title..."
                  prompt="Title:"
                />
              </div>
              <div className="form-row options">
                <div className="option-group">
                  <span className="option-label">Type:</span>
                  <Menu
                    items={typeOptions}
                    onSelect={(item) => setNewTaskType(item.id as TaskType)}
                    horizontal
                    showShortcuts={false}
                  />
                </div>
                <div className="option-group">
                  <span className="option-label">Priority:</span>
                  <Menu
                    items={priorityOptions}
                    onSelect={(item) => setNewTaskPriority(item.id as TaskPriority)}
                    horizontal
                    showShortcuts={false}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="create-button" onClick={handleCreateTask}>
                  Create Task
                </button>
                <button className="cancel-button" onClick={() => setShowNewTask(false)}>
                  Cancel
                </button>
              </div>
            </Box>
          )}

          {assigningTaskId && (
            <Box title="ASSIGN TASK" variant="accent" className="assign-modal">
              <p>Select a team member:</p>
              {availableEmployees.length === 0 ? (
                <p className="warning">No available team members! Hire more or wait for current tasks to complete.</p>
              ) : (
                <div className="assignee-list">
                  {availableEmployees.map(emp => (
                    <button
                      key={emp.id}
                      className="assignee-option"
                      onClick={() => handleAssign(assigningTaskId, emp.id)}
                    >
                      {emp.avatarEmoji} {emp.name} ({emp.skillLevel} {emp.role})
                    </button>
                  ))}
                </div>
              )}
              <button 
                className="cancel-button"
                onClick={() => setAssigningTaskId(null)}
              >
                Cancel
              </button>
            </Box>
          )}

          <div className="kanban-board">
            {columns.map(col => (
              <div key={col.status} className="kanban-column">
                <div className="column-header">
                  <span>{col.title}</span>
                  <span className="column-count">
                    {tasks.filter(t => t.status === col.status).length}
                  </span>
                </div>
                <div className="column-tasks">
                  {tasks
                    .filter(t => t.status === col.status)
                    .map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onAssign={() => setAssigningTaskId(task.id)}
                        onUpdateStatus={(status) => updateTaskStatus(task.id, status)}
                        onAIBoost={() => handleAIBoost(task.id)}
                        aiEnabled={aiSettings.enabled}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default TasksScreen;
