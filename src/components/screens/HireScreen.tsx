import { useState } from 'react';
import { Terminal, Menu } from '../tui';
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

function CandidateCard({ 
  template, 
  onHire, 
  canAfford 
}: { 
  template: EmployeeTemplate; 
  onHire: () => void;
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
        onClick={onHire}
        disabled={!canAfford}
      >
        {canAfford ? '[ HIRE ]' : '[ CANNOT AFFORD ]'}
      </button>
    </div>
  );
}

export function HireScreen() {
  const { money, setScreen, hireEmployee, employees } = useGameStore();
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const roleFilters: MenuItem[] = [
    { id: 'all', label: 'All Roles', icon: '👥' },
    { id: 'engineer', label: 'Engineers', icon: '👨‍💻' },
    { id: 'designer', label: 'Designers', icon: '🎨' },
    { id: 'pm', label: 'Product', icon: '📊' },
    { id: 'marketer', label: 'Marketing', icon: '📢' },
  ];

  const filteredTemplates = selectedRole === 'all' 
    ? EMPLOYEE_TEMPLATES 
    : EMPLOYEE_TEMPLATES.filter(t => t.role === selectedRole);

  const handleHire = (template: EmployeeTemplate) => {
    hireEmployee(template.role, template.skillLevel);
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
                onHire={() => handleHire(template)}
                canAfford={money >= template.baseSalary}
              />
            ))}
          </div>

          <div className="hire-footer">
            <button className="back-button" onClick={() => setScreen('office')}>
              ← Back to Office [ESC]
            </button>
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default HireScreen;
