/**
 * Tasks Screen - Clean Kanban board
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Task, TaskStatus, TaskType, TaskPriority } from '../../types';
import './TasksScreen.css';

const typeIcons: Record<TaskType, string> = {
  feature: '◇',
  bug: '◈',
  design: '○',
  marketing: '◎',
  infrastructure: '◆',
};

const priorityColors: Record<TaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

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

  const progress = Math.round((task.progressTicks / task.estimatedTicks) * 100);

  return (
    <div className="task-item">
      <div className="task-header">
        <span className="task-type">{typeIcons[task.type]}</span>
        <span 
          className="task-priority-dot" 
          style={{ background: priorityColors[task.priority] }}
          title={task.priority}
        />
      </div>
      
      <h4 className="task-title">{task.title}</h4>
      
      {task.status === 'in_progress' && (
        <div className="task-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}

      <div className="task-footer">
        {assignee ? (
          <span className="task-assignee">{assignee.name.split(' ')[0]}</span>
        ) : task.status !== 'done' ? (
          <button className="assign-btn" onClick={onAssign}>
            Assign
          </button>
        ) : null}
        
        {aiEnabled && task.status === 'in_progress' && (
          <button className="boost-btn" onClick={onAIBoost}>
            Boost
          </button>
        )}
      </div>

      {task.status === 'review' && (
        <div className="task-actions">
          <button 
            className="approve-btn"
            onClick={() => onUpdateStatus('done')}
          >
            Approve
          </button>
          <button 
            className="reject-btn"
            onClick={() => onUpdateStatus('in_progress')}
          >
            Reject
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
    { status: 'backlog', title: 'Backlog' },
    { status: 'todo', title: 'To Do' },
    { status: 'in_progress', title: 'In Progress' },
    { status: 'review', title: 'Review' },
    { status: 'done', title: 'Done' },
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
        estimatedTicks: 100,
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

  return (
    <div className="tasks-screen">
      <div className="tasks-container">
        {/* Header */}
        <header className="tasks-header">
          <h1>Tasks</h1>
          <button className="new-task-btn" onClick={() => setShowNewTask(true)}>
            + New Task
          </button>
        </header>

        {/* New Task Modal */}
        {showNewTask && (
          <div className="modal-overlay" onClick={() => setShowNewTask(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>New Task</h2>
                <button className="close-btn" onClick={() => setShowNewTask(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Type</label>
                    <div className="option-buttons">
                      {(['feature', 'bug', 'design', 'infrastructure'] as TaskType[]).map(type => (
                        <button
                          key={type}
                          className={`option-btn ${newTaskType === type ? 'active' : ''}`}
                          onClick={() => setNewTaskType(type)}
                        >
                          {typeIcons[type]} {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Priority</label>
                    <div className="option-buttons">
                      {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(priority => (
                        <button
                          key={priority}
                          className={`option-btn ${newTaskPriority === priority ? 'active' : ''}`}
                          onClick={() => setNewTaskPriority(priority)}
                        >
                          <span className="priority-dot" style={{ background: priorityColors[priority] }} />
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowNewTask(false)}>
                  Cancel
                </button>
                <button className="create-btn" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {assigningTaskId && (
          <div className="modal-overlay" onClick={() => setAssigningTaskId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assign Task</h2>
                <button className="close-btn" onClick={() => setAssigningTaskId(null)}>×</button>
              </div>
              
              <div className="modal-body">
                {availableEmployees.length === 0 ? (
                  <p className="empty-text">No available team members. Wait for tasks to complete or hire more.</p>
                ) : (
                  <div className="assignee-list">
                    {availableEmployees.map(emp => (
                      <button
                        key={emp.id}
                        className="assignee-btn"
                        onClick={() => handleAssign(assigningTaskId, emp.id)}
                      >
                        <span className="assignee-name">{emp.name}</span>
                        <span className="assignee-role">{emp.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col.status} className="kanban-column">
              <div className="column-header">
                <span className="column-title">{col.title}</span>
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
                {tasks.filter(t => t.status === col.status).length === 0 && (
                  <div className="column-empty">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TasksScreen;
