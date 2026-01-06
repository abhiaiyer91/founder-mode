/**
 * RTS View - Clean, focused game view
 * 
 * Shows team members, their tasks, and progress
 */

import { useGameStore } from '../../store/gameStore';
import type { Employee, Task } from '../../types';
import './RTSView.css';

// Employee Card
function EmployeeCard({ 
  employee, 
  task,
  isSelected,
  onClick,
}: { 
  employee: Employee;
  task?: Task;
  isSelected: boolean;
  onClick: () => void;
}) {
  const roleIcons: Record<string, string> = {
    engineer: '◆',
    designer: '◇',
    marketer: '◎',
    pm: '◈',
  };

  const progress = task 
    ? Math.round((task.progressTicks / task.estimatedTicks) * 100) 
    : 0;

  return (
    <div 
      className={`employee-card ${isSelected ? 'selected' : ''} ${employee.status}`}
      onClick={onClick}
    >
      <div className="employee-header">
        <div className="employee-avatar">
          <span className="avatar-icon">{roleIcons[employee.role] || '○'}</span>
        </div>
        <div className="employee-info">
          <span className="employee-name">{employee.name}</span>
          <span className="employee-role">{employee.role}</span>
        </div>
        <div className={`employee-status status-${employee.status}`}>
          {employee.status === 'working' ? 'Working' : employee.status === 'idle' ? 'Idle' : 'Blocked'}
        </div>
      </div>

      {task && (
        <div className="employee-task">
          <div className="task-info">
            <span className="task-title">{task.title}</span>
            <span className="task-progress-text">{progress}%</span>
          </div>
          <div className="task-progress">
            <div className="task-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {!task && employee.status === 'idle' && (
        <div className="employee-idle">
          <span>No task assigned</span>
        </div>
      )}

      <div className="employee-stats">
        <div className="stat">
          <span className="stat-label">Tasks Done</span>
          <span className="stat-value">{employee.tasksCompleted}</span>
        </div>
      </div>
    </div>
  );
}

// Task Card
function TaskCard({ 
  task, 
  assignee,
  onClick,
}: { 
  task: Task; 
  assignee?: Employee;
  onClick: () => void;
}) {
  const progress = Math.round((task.progressTicks / task.estimatedTicks) * 100);
  
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  return (
    <div className={`task-card status-${task.status}`} onClick={onClick}>
      <div className="task-header">
        <span 
          className="task-priority" 
          style={{ background: priorityColors[task.priority] }}
        />
        <span className="task-title">{task.title}</span>
      </div>
      
      {task.status === 'in_progress' && (
        <div className="task-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="task-meta">
        {assignee ? (
          <span className="task-assignee">{assignee.name.split(' ')[0]}</span>
        ) : (
          <span className="task-unassigned">Unassigned</span>
        )}
        <span className="task-type">{task.type}</span>
      </div>
    </div>
  );
}

// Main RTS View
export function RTSView() {
  const { 
    employees, 
    tasks, 
    selectedEmployeeIds,
    selectEmployee,
    selectEmployees,
    setScreen,
  } = useGameStore();

  // Get tasks by status
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const doneTasks = tasks.filter(t => t.status === 'done').slice(0, 5);

  const handleEmployeeClick = (employee: Employee, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Multi-select
      const newSelection = selectedEmployeeIds.includes(employee.id)
        ? selectedEmployeeIds.filter(id => id !== employee.id)
        : [...selectedEmployeeIds, employee.id];
      selectEmployees(newSelection);
    } else {
      selectEmployee(employee.id);
    }
  };

  const getEmployeeTask = (employee: Employee): Task | undefined => {
    return tasks.find(t => t.assigneeId === employee.id && t.status === 'in_progress');
  };

  return (
    <div className="rts-view">
      {/* Team Section */}
      <section className="rts-section team-section">
        <div className="section-header">
          <h2>Team</h2>
          <button className="section-action" onClick={() => setScreen('hire')}>
            + Hire
          </button>
        </div>
        
        {employees.length === 0 ? (
          <div className="empty-state">
            <p>No team members yet</p>
            <button className="empty-action" onClick={() => setScreen('hire')}>
              Hire your first employee
            </button>
          </div>
        ) : (
          <div className="employee-grid">
            {employees.map(employee => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                task={getEmployeeTask(employee)}
                isSelected={selectedEmployeeIds.includes(employee.id)}
                onClick={(e: React.MouseEvent) => handleEmployeeClick(employee, e)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tasks Section */}
      <section className="rts-section tasks-section">
        <div className="section-header">
          <h2>Tasks</h2>
          <button className="section-action" onClick={() => setScreen('tasks')}>
            + New Task
          </button>
        </div>

        <div className="task-columns">
          {/* To Do */}
          <div className="task-column">
            <div className="column-header">
              <span className="column-title">To Do</span>
              <span className="column-count">{todoTasks.length}</span>
            </div>
            <div className="column-tasks">
              {todoTasks.slice(0, 5).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  assignee={employees.find(e => e.id === task.assigneeId)}
                  onClick={() => setScreen('tasks')}
                />
              ))}
              {todoTasks.length === 0 && (
                <div className="column-empty">No tasks</div>
              )}
            </div>
          </div>

          {/* In Progress */}
          <div className="task-column">
            <div className="column-header">
              <span className="column-title">In Progress</span>
              <span className="column-count">{inProgressTasks.length}</span>
            </div>
            <div className="column-tasks">
              {inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  assignee={employees.find(e => e.id === task.assigneeId)}
                  onClick={() => setScreen('tasks')}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="column-empty">No active tasks</div>
              )}
            </div>
          </div>

          {/* Review */}
          <div className="task-column">
            <div className="column-header">
              <span className="column-title">Review</span>
              <span className="column-count">{reviewTasks.length}</span>
            </div>
            <div className="column-tasks">
              {reviewTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  assignee={employees.find(e => e.id === task.assigneeId)}
                  onClick={() => setScreen('tasks')}
                />
              ))}
              {reviewTasks.length === 0 && (
                <div className="column-empty">No reviews</div>
              )}
            </div>
          </div>

          {/* Done */}
          <div className="task-column">
            <div className="column-header">
              <span className="column-title">Done</span>
              <span className="column-count">{tasks.filter(t => t.status === 'done').length}</span>
            </div>
            <div className="column-tasks">
              {doneTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  assignee={employees.find(e => e.id === task.assigneeId)}
                  onClick={() => setScreen('artifacts')}
                />
              ))}
              {doneTasks.length === 0 && (
                <div className="column-empty">No completed tasks</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RTSView;
