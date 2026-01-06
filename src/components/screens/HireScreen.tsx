import { useState } from 'react';
import { Terminal, Menu, Box } from '../tui';
import type { MenuItem } from '../tui';
import { useGameStore } from '../../store/gameStore';
import { EMPLOYEE_TEMPLATES } from '../../types';
import type { EmployeeTemplate } from '../../types';
import './HireScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface HireModalProps {
  template: EmployeeTemplate;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function HireModal({ template, customPrompt, onCustomPromptChange, onConfirm, onCancel }: HireModalProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  
  return (
    <div className="hire-modal-overlay" onClick={onCancel}>
      <div className="hire-modal" onClick={e => e.stopPropagation()}>
        <Box title={`CONFIGURE ${template.title.toUpperCase()}`} variant="accent">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-avatar">{template.emoji}</span>
              <div className="modal-info">
                <h3>{template.title}</h3>
                <span className="modal-salary">{formatMoney(template.baseSalary)}/month</span>
              </div>
            </div>

            <div className="prompt-section">
              <div className="prompt-header">
                <label>System Prompt (Archetype)</label>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                >
                  {showFullPrompt ? '[ Hide ]' : '[ Show ]'}
                </button>
              </div>
              {showFullPrompt && (
                <div className="system-prompt-preview">
                  <pre>{template.systemPrompt}</pre>
                </div>
              )}
              <p className="prompt-hint">
                This is the base personality and instructions for this role. It defines how the AI will behave.
              </p>
            </div>

            <div className="prompt-section">
              <label>Custom Instructions (Optional)</label>
              <textarea
                className="custom-prompt-input"
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                placeholder="Add specific instructions for this employee...&#10;&#10;Examples:&#10;- Focus on accessibility best practices&#10;- Write verbose comments in code&#10;- Prefer functional components over class components&#10;- Always consider mobile-first design"
                rows={6}
              />
              <p className="prompt-hint">
                These instructions will be appended to the system prompt. Use this to customize how this specific employee works.
              </p>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={onConfirm}>
                Hire {template.title}
              </button>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}

function CandidateCard({ 
  template, 
  onSelect, 
  canAfford 
}: { 
  template: EmployeeTemplate; 
  onSelect: () => void;
  canAfford: boolean;
}) {
  const skillDescription = {
    junior: 'Learning the ropes. Lower productivity but affordable.',
    mid: 'Solid performer. Good balance of cost and output.',
    senior: 'Expert level. High productivity and mentoring ability.',
    lead: 'Strategic thinker. Can manage others and architect solutions.',
  }[template.skillLevel];

  return (
    <div className={`candidate-card ${!canAfford ? 'unaffordable' : ''}`}>
      <div className="candidate-header">
        <span className="candidate-avatar">{template.emoji}</span>
        <div className="candidate-info">
          <span className="candidate-title">{template.title}</span>
          <span className="candidate-level">{template.skillLevel}</span>
        </div>
        <div className="candidate-salary">
          <span className="salary-amount">{formatMoney(template.baseSalary)}</span>
          <span className="salary-period">/month</span>
        </div>
      </div>
      <p className="candidate-description">{skillDescription}</p>
      <button 
        className="hire-button"
        onClick={onSelect}
        disabled={!canAfford}
      >
        {canAfford ? '[ CONFIGURE & HIRE ]' : '[ CANNOT AFFORD ]'}
      </button>
    </div>
  );
}

export function HireScreen() {
  const { money, setScreen, hireEmployee, employees, updateEmployeePrompt } = useGameStore();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmployeeTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const roleFilters: MenuItem[] = [
    { id: 'all', label: 'All Roles', icon: '' },
    { id: 'engineer', label: 'Engineers', icon: '' },
    { id: 'designer', label: 'Designers', icon: '' },
    { id: 'pm', label: 'Product', icon: '' },
    { id: 'marketer', label: 'Marketing', icon: '' },
  ];

  const filteredTemplates = selectedRole === 'all' 
    ? EMPLOYEE_TEMPLATES 
    : EMPLOYEE_TEMPLATES.filter(t => t.role === selectedRole);

  const handleSelectTemplate = (template: EmployeeTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompt('');
  };

  const handleConfirmHire = () => {
    if (!selectedTemplate) return;
    
    // First hire the employee
    hireEmployee(selectedTemplate.role, selectedTemplate.skillLevel);
    
    // If there's a custom prompt, update the newly hired employee
    // The new employee will be the last one added
    if (customPrompt.trim()) {
      const state = useGameStore.getState();
      const newEmployee = state.employees[state.employees.length - 1];
      if (newEmployee) {
        updateEmployeePrompt(newEmployee.id, undefined, customPrompt.trim());
      }
    }
    
    setSelectedTemplate(null);
    setCustomPrompt('');
  };

  const handleCancelHire = () => {
    setSelectedTemplate(null);
    setCustomPrompt('');
  };

  return (
    <div className="hire-screen">
      <Terminal title="TALENT ACQUISITION">
        <div className="hire-layout">
          <div className="hire-header">
            <div className="header-info">
              <h2>Hire Team Members</h2>
              <p>Build your dream team. Each hire costs one month's salary upfront.</p>
            </div>
            <div className="header-stats">
              <div className="budget">
                <span className="label">Available Budget:</span>
                <span className="amount">{formatMoney(money)}</span>
              </div>
              <div className="team-size">
                <span className="label">Team Size:</span>
                <span className="count">{employees.length}</span>
              </div>
            </div>
          </div>

          <div className="role-filters">
            <Menu
              items={roleFilters}
              onSelect={(item) => setSelectedRole(item.id)}
              horizontal
              showShortcuts={false}
            />
          </div>

          <div className="candidates-grid">
            {filteredTemplates.map((template, index) => (
              <CandidateCard
                key={`${template.role}-${template.skillLevel}-${index}`}
                template={template}
                onSelect={() => handleSelectTemplate(template)}
                canAfford={money >= template.baseSalary}
              />
            ))}
          </div>

          <div className="hire-footer">
            <button className="back-button" onClick={() => setScreen('office')}>
              Back to Office [ESC]
            </button>
          </div>
        </div>
      </Terminal>

      {selectedTemplate && (
        <HireModal
          template={selectedTemplate}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          onConfirm={handleConfirmHire}
          onCancel={handleCancelHire}
        />
      )}
    </div>
  );
}

export default HireScreen;
