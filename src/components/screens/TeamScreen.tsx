/**
 * Team Screen - Clean team management view
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { calculateProductivity } from '../../types';
import type { Employee } from '../../types';
import './TeamScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

const roleIcons: Record<string, string> = {
  engineer: '◆',
  designer: '◇',
  pm: '◈',
  marketer: '◎',
};

function EmployeeCard({ 
  employee, 
  onSelect,
  onFire,
}: { 
  employee: Employee; 
  onSelect: () => void;
  onFire: () => void;
}) {
  const task = useGameStore(state => 
    state.tasks.find(t => t.id === employee.currentTaskId)
  );

  const progress = task 
    ? Math.round((task.progressTicks / task.estimatedTicks) * 100)
    : 0;

  return (
    <div className={`employee-card ${employee.status}`} onClick={onSelect}>
      <div className="card-header">
        <div className="employee-avatar">
          <span className="avatar-icon">{roleIcons[employee.role]}</span>
        </div>
        <div className="employee-info">
          <span className="employee-name">{employee.name}</span>
          <span className="employee-role">{employee.role}</span>
        </div>
        <div className={`employee-status status-${employee.status}`}>
          {employee.status}
        </div>
      </div>

      {task && (
        <div className="employee-task">
          <div className="task-info">
            <span className="task-title">{task.title}</span>
            <span className="task-progress-text">{progress}%</span>
          </div>
          <div className="task-progress">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="employee-stats">
        <div className="stat">
          <span className="stat-label">Tasks Completed</span>
          <span className="stat-value">{employee.tasksCompleted}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Productivity</span>
          <div className="stat-bar">
            <div 
              className="stat-fill" 
              style={{ width: `${calculateProductivity(employee)}%`, background: '#00ff88' }} 
            />
          </div>
          <span className="stat-value">{calculateProductivity(employee)}%</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="salary">{formatMoney(employee.salary)}/mo</span>
        <button 
          className="fire-btn" 
          onClick={(e) => { e.stopPropagation(); onFire(); }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function TeamScreen() {
  const navigate = useNavigate();
  const { employees, fireEmployee } = useGameStore();
  const [confirmFire, setConfirmFire] = useState<Employee | null>(null);

  const handleConfirmFire = () => {
    if (confirmFire) {
      fireEmployee(confirmFire.id);
      setConfirmFire(null);
    }
  };

  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
  const totalTasksCompleted = employees.reduce((sum, e) => sum + e.tasksCompleted, 0);
  const avgProductivity = employees.length > 0 
    ? Math.round(employees.reduce((sum, e) => sum + calculateProductivity(e), 0) / employees.length)
    : 0;

  return (
    <div className="team-screen">
      {/* Confirm Modal */}
      {confirmFire && (
        <div className="modal-overlay" onClick={() => setConfirmFire(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remove Team Member</h2>
              <button className="close-btn" onClick={() => setConfirmFire(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove <strong>{confirmFire.name}</strong> from your team?</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setConfirmFire(null)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleConfirmFire}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="team-container">
        {/* Header */}
        <header className="team-header">
          <h1>Team</h1>
          <button className="hire-btn" onClick={() => navigate('/play/hire')}>
            + Hire
          </button>
        </header>

        {/* Summary Stats */}
        <div className="team-summary">
          <div className="summary-stat">
            <span className="stat-value">{employees.length}</span>
            <span className="stat-label">Team Size</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{formatMoney(totalSalary)}</span>
            <span className="stat-label">Monthly Burn</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{totalTasksCompleted}</span>
            <span className="stat-label">Tasks Done</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{avgProductivity}%</span>
            <span className="stat-label">Avg Productivity</span>
          </div>
        </div>

        {/* Employee Grid */}
        {employees.length === 0 ? (
          <div className="empty-state">
            <p>No team members yet</p>
            <button onClick={() => navigate('/play/hire')}>
              Hire your first employee
            </button>
          </div>
        ) : (
          <div className="employee-grid">
            {employees.map(emp => (
              <EmployeeCard 
                key={emp.id} 
                employee={emp}
                onSelect={() => {}}
                onFire={() => setConfirmFire(emp)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamScreen;
