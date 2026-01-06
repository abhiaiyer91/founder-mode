/**
 * Employee Memory - Shows an employee's experience and context
 */

import { useState } from 'react';
import type { Employee, AgentMemory } from '../types';
import './EmployeeMemory.css';

interface EmployeeMemoryProps {
  employee: Employee;
  compact?: boolean;
}

function MemoryEntry({ memory }: { memory: AgentMemory }) {
  const typeIcons: Record<string, string> = {
    task: '✅',
    learning: '📚',
    preference: '⭐',
    context: '🔍',
  };
  
  return (
    <div className={`memory-entry type-${memory.type}`}>
      <span className="memory-icon">{typeIcons[memory.type]}</span>
      <div className="memory-content">
        <p className="memory-text">{memory.content}</p>
        <div className="memory-meta">
          <span className="memory-tags">
            {memory.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </span>
          <span className="memory-importance" title="Importance">
            {'⬤'.repeat(Math.ceil(memory.importance * 3))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EmployeeMemory({ employee, compact = false }: EmployeeMemoryProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayMemories = showAll 
    ? employee.memory.slice().reverse()
    : employee.memory.slice(-5).reverse();
  
  if (compact) {
    return (
      <div className="employee-memory-compact">
        <div className="compact-stats">
          <span className="stat">
            <span className="stat-icon">✅</span>
            {employee.tasksCompleted}
          </span>
          <span className="stat">
            <span className="stat-icon">🧠</span>
            {employee.memory.length}
          </span>
        </div>
        {employee.specializations.length > 0 && (
          <div className="compact-specializations">
            {employee.specializations.slice(0, 3).map(s => (
              <span key={s} className="spec-tag">{s}</span>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="employee-memory">
      <div className="memory-header">
        <h3>
          <span className="header-icon">🧠</span>
          Experience & Memory
        </h3>
        <div className="memory-stats">
          <span className="stat">
            <span className="label">Tasks:</span>
            <span className="value">{employee.tasksCompleted}</span>
          </span>
          <span className="stat">
            <span className="label">Memories:</span>
            <span className="value">{employee.memory.length}</span>
          </span>
        </div>
      </div>
      
      {employee.specializations.length > 0 && (
        <div className="specializations">
          <h4>Specializations</h4>
          <div className="spec-list">
            {employee.specializations.map(spec => (
              <span key={spec} className="specialization">{spec}</span>
            ))}
          </div>
        </div>
      )}
      
      <div className="memory-list">
        <h4>
          Recent Activity
          {employee.memory.length > 5 && (
            <button 
              className="show-all-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All (${employee.memory.length})`}
            </button>
          )}
        </h4>
        
        {displayMemories.length === 0 ? (
          <div className="empty-memory">
            <span className="empty-icon">📭</span>
            <p>No experience yet. Assign tasks to build memory.</p>
          </div>
        ) : (
          displayMemories.map(memory => (
            <MemoryEntry key={memory.id} memory={memory} />
          ))
        )}
      </div>
    </div>
  );
}

export default EmployeeMemory;
