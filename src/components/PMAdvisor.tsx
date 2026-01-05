/**
 * PM Advisor Panel - Human in the Loop
 * 
 * The PM agent makes suggestions, but YOU (the founder) decide.
 * Like advisors in Civilization - they suggest, you approve/reject.
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PMProposal, PMThought } from '../types';
import './PMAdvisor.css';

function ProposalCard({ 
  proposal, 
  onApprove, 
  onReject 
}: { 
  proposal: PMProposal;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const typeIcons: Record<string, string> = {
    mission: '🎯',
    hire: '👋',
    priority: '📊',
    tech: '🔬',
    pivot: '🔄',
  };

  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#60a5fa',
    low: '#6b7280',
  };

  return (
    <div className={`proposal-card priority-${proposal.priority}`}>
      <div className="proposal-header" onClick={() => setExpanded(!expanded)}>
        <div className="proposal-type">
          <span className="type-icon">{typeIcons[proposal.type]}</span>
          <span className="type-label">{proposal.type}</span>
        </div>
        <span 
          className="proposal-priority"
          style={{ color: priorityColors[proposal.priority] }}
        >
          {proposal.priority}
        </span>
      </div>
      
      <h4 className="proposal-title">{proposal.title}</h4>
      <p className="proposal-description">{proposal.description}</p>
      
      {expanded && (
        <div className="proposal-details">
          <div className="reasoning">
            <strong>💭 PM's Reasoning:</strong>
            <p>{proposal.reasoning}</p>
          </div>
          
          {proposal.payload.tasks && (
            <div className="tasks-preview">
              <strong>📋 Tasks ({proposal.payload.tasks.length}):</strong>
              <ul>
                {proposal.payload.tasks.slice(0, 5).map((task, i) => (
                  <li key={i}>{task.title}</li>
                ))}
                {proposal.payload.tasks.length > 5 && (
                  <li className="more">+{proposal.payload.tasks.length - 5} more...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="proposal-actions">
        <button className="reject-btn" onClick={onReject}>
          ❌ Reject
        </button>
        <button className="approve-btn" onClick={onApprove}>
          ✅ Approve
        </button>
      </div>
    </div>
  );
}

function ThoughtBubble({ thought }: { thought: PMThought }) {
  const typeEmojis: Record<string, string> = {
    observation: '👁️',
    priority: '⚠️',
    decision: '💡',
    action: '✅',
  };

  return (
    <div className={`thought-bubble type-${thought.type}`}>
      <span className="thought-icon">{typeEmojis[thought.type]}</span>
      <span className="thought-message">{thought.message}</span>
    </div>
  );
}

export function PMAdvisor() {
  const {
    pmBrain,
    approveProposal,
    rejectProposal,
    togglePMBrain,
  } = useGameStore();
  
  const pendingProposals = pmBrain.proposals.filter(p => p.status === 'pending');
  const recentThoughts = pmBrain.thoughts.slice(0, 5);
  
  if (!pmBrain.enabled) {
    return (
      <div className="pm-advisor disabled">
        <button onClick={togglePMBrain}>🧠 Enable PM Advisor</button>
      </div>
    );
  }

  return (
    <div className="pm-advisor">
      <div className="advisor-header">
        <h3>🧠 PM Advisor</h3>
        <span className="advisor-status">
          {pendingProposals.length > 0 && (
            <span className="pending-badge">{pendingProposals.length} pending</span>
          )}
        </span>
      </div>
      
      {/* Proposals awaiting decision */}
      {pendingProposals.length > 0 && (
        <div className="proposals-section">
          <h4>📬 Awaiting Your Decision</h4>
          <div className="proposals-list">
            {pendingProposals.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onApprove={() => approveProposal(proposal.id)}
                onReject={() => rejectProposal(proposal.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* PM Thoughts */}
      {recentThoughts.length > 0 && (
        <div className="thoughts-section">
          <h4>💭 PM is thinking...</h4>
          <div className="thoughts-list">
            {recentThoughts.map(thought => (
              <ThoughtBubble key={thought.id} thought={thought} />
            ))}
          </div>
        </div>
      )}
      
      {/* Product State Summary */}
      {pmBrain.productState && (
        <div className="product-state">
          <h4>📊 Product Analysis</h4>
          <div className="state-grid">
            <div className="state-item">
              <span className="state-label">Phase</span>
              <span className="state-value">{pmBrain.productState.phase.toUpperCase()}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Features</span>
              <span className="state-value">{pmBrain.productState.featureCount}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Bugs</span>
              <span className="state-value bug-count">{pmBrain.productState.bugCount}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Tech Debt</span>
              <span className="state-value">{pmBrain.productState.techDebtScore}/100</span>
            </div>
          </div>
          
          <div className="capabilities">
            {pmBrain.productState.hasAuth && <span className="cap">✅ Auth</span>}
            {pmBrain.productState.hasDatabase && <span className="cap">✅ Database</span>}
            {pmBrain.productState.hasAPI && <span className="cap">✅ API</span>}
            {pmBrain.productState.hasUI && <span className="cap">✅ UI</span>}
            {pmBrain.productState.hasLanding && <span className="cap">✅ Landing</span>}
            {pmBrain.productState.hasTesting && <span className="cap">✅ Tests</span>}
            {!pmBrain.productState.hasAuth && <span className="cap missing">❌ Auth</span>}
            {!pmBrain.productState.hasDatabase && <span className="cap missing">❌ Database</span>}
            {!pmBrain.productState.hasAPI && <span className="cap missing">❌ API</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for the top bar
export function PMAdvisorBadge() {
  const { pmBrain, setScreen } = useGameStore();
  const pendingCount = pmBrain.proposals.filter(p => p.status === 'pending').length;
  
  if (!pmBrain.enabled || pendingCount === 0) return null;
  
  return (
    <button 
      className="pm-advisor-badge"
      onClick={() => setScreen('dashboard')}
      title="PM has suggestions"
    >
      🧠 
      <span className="badge-count">{pendingCount}</span>
    </button>
  );
}

export default PMAdvisor;
