import { Terminal, Box, Menu, ProgressBar } from '../tui';
import type { MenuItem } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { Employee, GameScreen } from '../../types';
import './OfficeScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const task = useGameStore(state => 
    state.tasks.find(t => t.id === employee.currentTaskId)
  );

  const statusColor = {
    idle: 'var(--text-muted)',
    working: 'var(--color-success)',
    blocked: 'var(--color-error)',
    on_break: 'var(--color-warning)',
  }[employee.status];

  return (
    <div className="employee-card">
      <div className="employee-header">
        <span className="employee-avatar">{employee.avatarEmoji}</span>
        <div className="employee-info">
          <span className="employee-name">{employee.name}</span>
          <span className="employee-role">{employee.skillLevel} {employee.role}</span>
        </div>
      </div>
      <div className="employee-status" style={{ color: statusColor }}>
        {employee.status === 'working' && task ? (
          <>
            Working: {task.title.slice(0, 20)}...
            <ProgressBar 
              value={task.progressTicks} 
              max={task.estimatedTicks} 
              width={8}
              variant="accent"
              animated
            />
          </>
        ) : (
          <span className="status-idle">● {employee.status}</span>
        )}
      </div>
    </div>
  );
}

export function OfficeScreen() {
  const { 
    project, 
    employees, 
    tasks, 
    money, 
    setScreen,
    notifications 
  } = useGameStore();

  const idleEmployees = employees.filter(e => e.status === 'idle').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const menuItems: MenuItem[] = [
    { id: 'hire', label: 'Hire Team', shortcut: 'H', icon: '👥' },
    { id: 'tasks', label: 'Task Board', shortcut: 'T', icon: '📋' },
    { id: 'team', label: 'Team View', shortcut: 'E', icon: '🏢' },
    { id: 'code', label: 'View Code', shortcut: 'C', icon: '💻', disabled: completedTasks === 0 },
    { id: 'settings', label: 'Settings', shortcut: 'S', icon: '⚙️' },
  ];

  const handleMenuSelect = (item: MenuItem) => {
    setScreen(item.id as GameScreen);
  };

  return (
    <div className="office-screen">
      <Terminal title={`FOUNDER MODE - ${project?.name || 'New Startup'}`}>
        <div className="office-layout">
          {/* Header Stats */}
          <div className="office-header">
            <div className="stat-item">
              <span className="stat-label">💰 Funds</span>
              <span className="stat-value money">{formatMoney(money)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">👥 Team</span>
              <span className="stat-value">{employees.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">📋 Active</span>
              <span className="stat-value">{activeTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">✅ Done</span>
              <span className="stat-value success">{completedTasks}</span>
            </div>
          </div>

          <div className="office-main">
            {/* Left Panel - Team */}
            <Box title="YOUR TEAM" className="team-panel">
              {employees.length === 0 ? (
                <div className="empty-state">
                  <p>No team members yet!</p>
                  <p className="hint">Press [H] to hire your first employee</p>
                </div>
              ) : (
                <div className="employee-list">
                  {employees.map(emp => (
                    <EmployeeCard key={emp.id} employee={emp} />
                  ))}
                </div>
              )}
              {idleEmployees > 0 && (
                <div className="idle-warning">
                  ⚠️ {idleEmployees} team member{idleEmployees > 1 ? 's' : ''} idle
                </div>
              )}
            </Box>

            {/* Right Panel - Activity & Actions */}
            <div className="right-panels">
              <Box title="NOTIFICATIONS" className="notifications-panel">
                {notifications.length === 0 ? (
                  <div className="empty-state small">No notifications</div>
                ) : (
                  <div className="notification-list">
                    {notifications.slice(0, 5).map(notif => (
                      <div key={notif.id} className={`notification ${notif.type}`}>
                        {notif.message}
                      </div>
                    ))}
                  </div>
                )}
              </Box>

              <Box title="QUICK STATS" className="stats-panel">
                <div className="quick-stats">
                  <div className="quick-stat">
                    <span>Backlog:</span>
                    <span className="value">{todoTasks} tasks</span>
                  </div>
                  <div className="quick-stat">
                    <span>In Progress:</span>
                    <span className="value">{activeTasks} tasks</span>
                  </div>
                  <div className="quick-stat">
                    <span>Monthly Burn:</span>
                    <span className="value warning">
                      {formatMoney(employees.reduce((s, e) => s + e.salary, 0))}
                    </span>
                  </div>
                </div>
              </Box>
            </div>
          </div>

          {/* Footer Menu */}
          <div className="office-footer">
            <Menu
              items={menuItems}
              onSelect={handleMenuSelect}
              horizontal
              showShortcuts
            />
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default OfficeScreen;
