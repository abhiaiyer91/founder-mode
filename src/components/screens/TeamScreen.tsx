/**
 * Team Screen - Clean team management view with prompt editing
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { calculateProductivity, ROLE_BASE_PROMPTS } from '../../types';
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
  engineer: '\u25C6',
  designer: '\u25C7',
  pm: '\u25C8',
};

function PromptEditorModal({ 
  employee, 
  onClose 
}: { 
  employee: Employee; 
  onClose: () => void;
}) {
  const { updateEmployeePrompt } = useGameStore();
  // Fallback to ROLE_BASE_PROMPTS for legacy employees without systemPrompt
  const [systemPrompt, setSystemPrompt] = useState(
    employee.systemPrompt || ROLE_BASE_PROMPTS[employee.role]
  );
  const [customPrompt, setCustomPrompt] = useState(employee.customPrompt || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value);
    setHasChanges(true);
  };

  const handleCustomPromptChange = (value: string) => {
    setCustomPrompt(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateEmployeePrompt(employee.id, systemPrompt, customPrompt);
    setHasChanges(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal prompt-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configure {employee.name}'s AI</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>
        
        <div className="modal-body">
          <div className="prompt-section">
            <label>System Prompt (Archetype Behavior)</label>
            <p className="prompt-hint">
              This defines the base personality and behavior. Edit with caution.
            </p>
            <textarea
              className="system-prompt-textarea"
              value={systemPrompt}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              rows={10}
            />
          </div>

          <div className="prompt-section">
            <label>Custom Instructions</label>
            <p className="prompt-hint">
              Additional instructions appended to the system prompt.
            </p>
            <textarea
              className="custom-prompt-textarea"
              value={customPrompt}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              placeholder="Add custom instructions for this employee...

Examples:
- Always add detailed comments
- Prefer functional programming patterns
- Focus on mobile-first design
- Use specific naming conventions"
              rows={6}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="confirm-btn" 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeeCard({ 
  employee, 
  onSelect,
  onFire,
  onEditPrompt,
}: { 
  employee: Employee; 
  onSelect: () => void;
  onFire: () => void;
  onEditPrompt: () => void;
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

      {/* AI Configuration Preview */}
      <div className="ai-config-preview">
        <div className="ai-config-header">
          <span className="config-label">AI Config</span>
          <button 
            className="edit-prompt-btn" 
            onClick={(e) => { e.stopPropagation(); onEditPrompt(); }}
          >
            Edit Prompts
          </button>
        </div>
        {employee.customPrompt ? (
          <p className="custom-prompt-snippet">
            {employee.customPrompt.slice(0, 60)}{employee.customPrompt.length > 60 ? '...' : ''}
          </p>
        ) : (
          <p className="no-custom-prompt">Using default archetype</p>
        )}
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
  const [editingPrompt, setEditingPrompt] = useState<Employee | null>(null);

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
      {/* Confirm Fire Modal */}
      {confirmFire && (
        <div className="modal-overlay" onClick={() => setConfirmFire(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remove Team Member</h2>
              <button className="close-btn" onClick={() => setConfirmFire(null)}>x</button>
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

      {/* Prompt Editor Modal */}
      {editingPrompt && (
        <PromptEditorModal
          employee={editingPrompt}
          onClose={() => setEditingPrompt(null)}
        />
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
                onEditPrompt={() => setEditingPrompt(emp)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamScreen;
