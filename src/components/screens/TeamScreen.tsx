import { useState } from 'react';
import { Terminal, Box, ProgressBar } from '../tui';
import { useGameStore } from '../../store/gameStore';
import { EmployeeMemory } from '../EmployeeMemory';
import type { Employee } from '../../types';
import './TeamScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function EmployeeDetail({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const { tasks, fireEmployee } = useGameStore();
  const currentTask = tasks.find(t => t.id === employee.currentTaskId);
  const completedTasks = tasks.filter(t => t.assigneeId === employee.id && t.status === 'done');

  const handleFire = () => {
    if (confirm(`Are you sure you want to let ${employee.name} go?`)) {
      fireEmployee(employee.id);
      onClose();
    }
  };

  return (
    <Box title="EMPLOYEE DETAILS" variant="accent" className="employee-detail">
      <div className="detail-header">
        <span className="detail-avatar">{employee.avatarEmoji}</span>
        <div className="detail-info">
          <h3>{employee.name}</h3>
          <span className="detail-role">{employee.skillLevel} {employee.role}</span>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-row">
          <span>Salary:</span>
          <span className="value">{formatMoney(employee.salary)}/mo</span>
        </div>
        <div className="stat-row">
          <span>Productivity:</span>
          <ProgressBar 
            value={employee.productivity} 
            width={10} 
            variant={employee.productivity > 70 ? 'success' : employee.productivity > 40 ? 'warning' : 'error'}
            showLabel
          />
        </div>
        <div className="stat-row">
          <span>Morale:</span>
          <ProgressBar 
            value={employee.morale} 
            width={10} 
            variant={employee.morale > 70 ? 'success' : employee.morale > 40 ? 'warning' : 'error'}
            showLabel
          />
        </div>
        <div className="stat-row">
          <span>Status:</span>
          <span className={`status ${employee.status}`}>{employee.status}</span>
        </div>
        <div className="stat-row">
          <span>Tasks Completed:</span>
          <span className="value">{completedTasks.length}</span>
        </div>
      </div>

      {currentTask && (
        <div className="current-work">
          <h4>Currently Working On:</h4>
          <div className="task-preview">
            <span>{currentTask.title}</span>
            <ProgressBar 
              value={currentTask.progressTicks} 
              max={currentTask.estimatedTicks}
              width={15}
              variant="accent"
              showLabel
              animated
            />
          </div>
        </div>
      )}

      <EmployeeMemory employee={employee} />

      <div className="detail-actions">
        <button className="action-btn close" onClick={onClose}>
          ← Back
        </button>
        <button className="action-btn fire" onClick={handleFire}>
          🚪 Let Go
        </button>
      </div>
    </Box>
  );
}

function EmployeeRow({ 
  employee, 
  onSelect 
}: { 
  employee: Employee; 
  onSelect: () => void;
}) {
  const task = useGameStore(state => 
    state.tasks.find(t => t.id === employee.currentTaskId)
  );

  return (
    <div className="employee-row" onClick={onSelect}>
      <div className="row-main">
        <span className="row-avatar">{employee.avatarEmoji}</span>
        <div className="row-info">
          <span className="row-name">{employee.name}</span>
          <span className="row-role">{employee.skillLevel} {employee.role}</span>
        </div>
      </div>
      <div className="row-stats">
        <div className="mini-stat">
          <span className="label">Prod</span>
          <ProgressBar value={employee.productivity} width={5} variant="accent" />
        </div>
        <div className="mini-stat">
          <span className="label">Mor</span>
          <ProgressBar value={employee.morale} width={5} variant="success" />
        </div>
      </div>
      <div className="row-status">
        {employee.status === 'working' && task ? (
          <span className="working">🔨 {task.title.slice(0, 15)}...</span>
        ) : (
          <span className={`status-badge ${employee.status}`}>{employee.status}</span>
        )}
      </div>
      <div className="row-salary">
        {formatMoney(employee.salary)}/mo
      </div>
    </div>
  );
}

export function TeamScreen() {
  const { employees, setScreen } = useGameStore();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
  const avgProductivity = employees.length > 0 
    ? Math.round(employees.reduce((sum, e) => sum + e.productivity, 0) / employees.length)
    : 0;
  const avgMorale = employees.length > 0
    ? Math.round(employees.reduce((sum, e) => sum + e.morale, 0) / employees.length)
    : 0;

  const roleGroups = {
    engineer: employees.filter(e => e.role === 'engineer'),
    designer: employees.filter(e => e.role === 'designer'),
    pm: employees.filter(e => e.role === 'pm'),
    marketer: employees.filter(e => e.role === 'marketer'),
  };

  return (
    <div className="team-screen">
      <Terminal title="TEAM MANAGEMENT">
        <div className="team-layout">
          <div className="team-header">
            <h2>👥 Your Team</h2>
            <div className="team-summary">
              <div className="summary-stat">
                <span className="label">Team Size</span>
                <span className="value">{employees.length}</span>
              </div>
              <div className="summary-stat">
                <span className="label">Monthly Burn</span>
                <span className="value warning">{formatMoney(totalSalary)}</span>
              </div>
              <div className="summary-stat">
                <span className="label">Avg Productivity</span>
                <span className="value">{avgProductivity}%</span>
              </div>
              <div className="summary-stat">
                <span className="label">Avg Morale</span>
                <span className="value">{avgMorale}%</span>
              </div>
            </div>
          </div>

          {selectedEmployee ? (
            <EmployeeDetail 
              employee={selectedEmployee} 
              onClose={() => setSelectedEmployee(null)} 
            />
          ) : (
            <div className="team-content">
              {employees.length === 0 ? (
                <div className="empty-state">
                  <p>Your team is empty!</p>
                  <button onClick={() => setScreen('hire')}>
                    + Hire Your First Team Member
                  </button>
                </div>
              ) : (
                <div className="employee-table">
                  <div className="table-header">
                    <span className="col-main">Employee</span>
                    <span className="col-stats">Performance</span>
                    <span className="col-status">Status</span>
                    <span className="col-salary">Salary</span>
                  </div>
                  {employees.map(emp => (
                    <EmployeeRow 
                      key={emp.id} 
                      employee={emp}
                      onSelect={() => setSelectedEmployee(emp)}
                    />
                  ))}
                </div>
              )}

              <div className="role-breakdown">
                <h4>Team Composition</h4>
                <div className="role-bars">
                  <div className="role-bar">
                    <span>👨‍💻 Engineers</span>
                    <span>{roleGroups.engineer.length}</span>
                  </div>
                  <div className="role-bar">
                    <span>🎨 Designers</span>
                    <span>{roleGroups.designer.length}</span>
                  </div>
                  <div className="role-bar">
                    <span>📊 PMs</span>
                    <span>{roleGroups.pm.length}</span>
                  </div>
                  <div className="role-bar">
                    <span>📢 Marketing</span>
                    <span>{roleGroups.marketer.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="team-footer">
            <button className="back-btn" onClick={() => setScreen('office')}>
              ← Back to Office [ESC]
            </button>
            <button className="hire-btn" onClick={() => setScreen('hire')}>
              + Hire More
            </button>
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default TeamScreen;
