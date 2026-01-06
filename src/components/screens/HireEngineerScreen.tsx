/**
 * Hire Engineer Screen - Second gate after ideation
 * 
 * User must hire an Engineer to start building.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import { EMPLOYEE_TEMPLATES } from '../../types';
import type { AIProvider } from '../../types';
import { getApiKey, saveApiKey, type AIProviderKey } from '../../lib/storage/secureStorage';
import './HireEngineerScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Provider metadata
const PROVIDER_META: Record<string, { keyPlaceholder: string; keyUrl: string }> = {
  openai: {
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    keyPlaceholder: 'API key...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  groq: {
    keyPlaceholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
  },
};

interface ProviderConfig {
  id: string;
  name: string;
  models: string[];
}

const FALLBACK_PROVIDERS: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022'] },
  { id: 'google', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile'] },
];

async function fetchProviders(): Promise<ProviderConfig[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.providers || FALLBACK_PROVIDERS;
  } catch {
    return FALLBACK_PROVIDERS;
  }
}

function HireModal({ 
  onConfirm, 
  onCancel 
}: { 
  onConfirm: (provider: AIProvider, model: string) => void;
  onCancel: () => void;
}) {
  const [providers, setProviders] = useState<ProviderConfig[]>(FALLBACK_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderKey>('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  
  const engineerTemplate = EMPLOYEE_TEMPLATES.find(t => t.role === 'engineer')!;
  
  useEffect(() => {
    fetchProviders().then((data) => {
      setProviders(data);
      if (data.length > 0 && data[0].models.length > 0) {
        setSelectedProvider(data[0].id as AIProviderKey);
        setSelectedModel(data[0].models[0]);
      }
      setLoading(false);
    });
  }, []);
  
  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
  const hasKey = !!getApiKey(selectedProvider);
  const providerMeta = PROVIDER_META[selectedProvider] || { keyPlaceholder: 'API key...', keyUrl: '#' };
  
  const handleProviderChange = (providerId: AIProviderKey) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
    setApiKey('');
    setError('');
  };
  
  const handleConfirm = () => {
    if (!hasKey) {
      if (!apiKey.trim()) {
        setError('Please enter your API key');
        return;
      }
      saveApiKey(selectedProvider, apiKey.trim());
    }
    onConfirm(selectedProvider as AIProvider, selectedModel);
  };
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="hire-modal-overlay" onClick={handleOverlayClick}>
      <div className="hire-modal" onClick={e => e.stopPropagation()}>
        <div className="hire-modal-header">
          <div className="header-icon">&#9670;</div>
          <div className="header-text">
            <h2>Hire Your First Engineer</h2>
            <p>Choose the AI model that will power your engineer.</p>
          </div>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        
        <div className="hire-modal-body">
          {loading ? (
            <div className="loading-models">Loading available models...</div>
          ) : (
            <>
              <div className="field">
                <label>AI Provider</label>
                <div className="provider-options">
                  {providers.map(provider => {
                    const hasProviderKey = !!getApiKey(provider.id as AIProviderKey);
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        className={`provider-option ${selectedProvider === provider.id ? 'selected' : ''}`}
                        onClick={() => handleProviderChange(provider.id as AIProviderKey)}
                      >
                        <span className="provider-name">{provider.name}</span>
                        {hasProviderKey && <span className="provider-check">&#10003;</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="field">
                <label>Model</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {currentProvider?.models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              {!hasKey && (
                <div className="field">
                  <label>
                    API Key
                    <span className="required-badge">Required</span>
                  </label>
                  <div className="key-input-group">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={providerMeta.keyPlaceholder}
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="visibility-toggle"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <a 
                    href={providerMeta.keyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="get-key-link"
                  >
                    Get {currentProvider?.name} API key &rarr;
                  </a>
                </div>
              )}
              
              {hasKey && (
                <div className="key-configured">
                  <span className="check-icon">&#10003;</span>
                  <span>{currentProvider?.name} API key configured</span>
                </div>
              )}
              
              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>
        
        <div className="hire-modal-footer">
          <div className="salary-info">
            <span className="salary-label">Monthly Salary</span>
            <span className="salary-amount">{formatMoney(engineerTemplate.baseSalary)}</span>
          </div>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="btn-hire" onClick={handleConfirm} disabled={loading}>
              Hire Engineer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HireEngineerScreen() {
  const money = useGameStore(state => state.money);
  const tasks = useGameStore(state => state.tasks);
  const employees = useGameStore(state => state.employees);
  const hireEmployee = useGameStore(state => state.hireEmployee);
  const [showModal, setShowModal] = useState(false);
  
  const engineerTemplate = EMPLOYEE_TEMPLATES.find(t => t.role === 'engineer')!;
  const canAfford = money >= engineerTemplate.baseSalary;
  const pm = employees.find(e => e.role === 'pm');

  const handleConfirmHire = (provider: AIProvider, model: string) => {
    hireEmployee('engineer', provider, model);
    setShowModal(false);
  };

  return (
    <div className="hire-engineer-screen">
      <div className="hire-engineer-container">
        {/* Progress Indicator */}
        <div className="progress-steps">
          <div className="step completed">
            <span className="step-icon">&#10003;</span>
            <span className="step-label">Idea</span>
          </div>
          <div className="step-line completed"></div>
          <div className="step completed">
            <span className="step-icon">&#10003;</span>
            <span className="step-label">PM</span>
          </div>
          <div className="step-line completed"></div>
          <div className="step completed">
            <span className="step-icon">&#10003;</span>
            <span className="step-label">Tasks</span>
          </div>
          <div className="step-line"></div>
          <div className="step active">
            <span className="step-icon">4</span>
            <span className="step-label">Engineer</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="hire-engineer-content">
          <h1>Ready to start building!</h1>
          <p className="subtitle">
            Your PM has created {tasks.length} tasks. Now hire an engineer to start 
            executing them.
          </p>

          {/* Engineer Card */}
          <div className="engineer-card">
            <div className="engineer-icon">&#9670;</div>
            <div className="engineer-info">
              <h3>Engineer</h3>
              <p>{engineerTemplate.description}</p>
              <div className="engineer-details">
                <span className="engineer-salary">{formatMoney(engineerTemplate.baseSalary)}/mo</span>
                <span className="engineer-budget">Budget: {formatMoney(money)}</span>
              </div>
            </div>
            <button 
              className={`hire-engineer-btn ${canAfford ? '' : 'disabled'}`}
              onClick={() => canAfford && setShowModal(true)}
              disabled={!canAfford}
            >
              {canAfford ? 'Hire Engineer' : 'Not Enough Funds'}
            </button>
          </div>

          {/* Task Preview */}
          <div className="task-preview">
            <div className="preview-header">
              <span className="preview-label">Ready Tasks</span>
              <span className="preview-count">{tasks.length} tasks</span>
            </div>
            <div className="preview-tasks">
              {tasks.slice(0, 3).map(task => (
                <div key={task.id} className="preview-task">
                  <span className="task-dot"></span>
                  <span className="task-title">{task.title}</span>
                </div>
              ))}
              {tasks.length > 3 && (
                <div className="preview-more">+{tasks.length - 3} more tasks</div>
              )}
            </div>
          </div>

          {/* Team Status */}
          <div className="team-status">
            <div className="team-member">
              <span className="member-icon pm">&#9672;</span>
              <span className="member-name">{pm?.name || 'PM'}</span>
              <span className="member-status ready">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <HireModal
          onConfirm={handleConfirmHire}
          onCancel={() => setShowModal(false)}
        />,
        document.body
      )}
    </div>
  );
}

export default HireEngineerScreen;
