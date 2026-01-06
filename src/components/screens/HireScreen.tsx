/**
 * Hire Screen - Simplified hiring interface with 3 core roles
 * Includes system prompt preview and customization
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import { EMPLOYEE_TEMPLATES } from '../../types';
import type { EmployeeTemplate, AIProvider } from '../../types';
import { getApiKey, saveApiKey, type AIProviderKey } from '../../lib/storage/secureStorage';
import './HireScreen.css';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const roleIcons: Record<string, string> = {
  pm: '\u25C8',
  designer: '\u25C7',
  engineer: '\u25C6',
};

// Provider metadata (key URLs and placeholders - fallback if API doesn't provide)
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
  apiKeyEnvVar?: string;
}

// Fallback providers in case API fails
const FALLBACK_PROVIDERS: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'] },
  { id: 'google', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
];

// Fetch available models from the server
async function fetchProviders(): Promise<ProviderConfig[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.providers || FALLBACK_PROVIDERS;
  } catch (error) {
    console.warn('Failed to fetch models from API, using fallback:', error);
    return FALLBACK_PROVIDERS;
  }
}

function RoleCard({ 
  template, 
  onHire, 
  canAfford,
  alreadyHired,
}: { 
  template: EmployeeTemplate; 
  onHire: () => void;
  canAfford: boolean;
  alreadyHired: number;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAfford) {
      onHire();
    }
  };

  return (
    <div className={`role-card ${!canAfford ? 'disabled' : ''}`}>
      <div className="role-icon">{roleIcons[template.role]}</div>
      <div className="role-info">
        <h3>{template.title}</h3>
        <p>{template.description}</p>
        <div className="role-meta">
          <span className="role-salary">{formatMoney(template.baseSalary)}/mo</span>
          {alreadyHired > 0 && (
            <span className="role-count">{alreadyHired} hired</span>
          )}
        </div>
      </div>
      <button 
        className="hire-button"
        onClick={handleClick}
        disabled={!canAfford}
      >
        {canAfford ? 'Hire' : 'Cannot Afford'}
      </button>
    </div>
  );
}

/** Modal for selecting AI model and customizing prompts when hiring */
function HireModal({ 
  template, 
  onConfirm, 
  onCancel 
}: { 
  template: EmployeeTemplate;
  onConfirm: (provider: AIProvider, model: string, customPrompt: string) => void;
  onCancel: () => void;
}) {
  const [providers, setProviders] = useState<ProviderConfig[]>(FALLBACK_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderKey>('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Fetch providers on mount
  useEffect(() => {
    fetchProviders().then((data) => {
      setProviders(data);
      // Update selected model to first model of first provider if available
      if (data.length > 0 && data[0].models.length > 0) {
        const firstProvider = data[0];
        setSelectedProvider(firstProvider.id as AIProviderKey);
        setSelectedModel(firstProvider.models[0]);
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
    // If we need an API key and don't have one saved
    if (!hasKey) {
      if (!apiKey.trim()) {
        setError('Please enter your API key');
        return;
      }
      // Save the API key
      saveApiKey(selectedProvider, apiKey.trim());
    }
    // Call the confirm callback with custom prompt
    onConfirm(selectedProvider as AIProvider, selectedModel, customPrompt.trim());
  };
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not its children
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="hire-modal-overlay" onClick={handleOverlayClick}>
      <div className="hire-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="hire-modal-header">
          <div className="header-icon">{roleIcons[template.role]}</div>
          <div className="header-text">
            <h2>Hire {template.title}</h2>
            <p>Choose the AI model and customize behavior.</p>
          </div>
          <button className="close-btn" onClick={onCancel}>x</button>
        </div>
        
        {/* Content */}
        <div className="hire-modal-body">
          {loading ? (
            <div className="loading-models">Loading available models...</div>
          ) : (
            <>
              {/* Provider Selection */}
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
                        {hasProviderKey && <span className="provider-check">OK</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Model Selection */}
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
              
              {/* API Key Input (only if not already saved) */}
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
                    Get {currentProvider?.name} API key
                  </a>
                </div>
              )}
              
              {hasKey && (
                <div className="key-configured">
                  <span className="check-icon">OK</span>
                  <span>{currentProvider?.name} API key configured</span>
                </div>
              )}

              {/* System Prompt Preview */}
              <div className="field">
                <div className="prompt-header">
                  <label>System Prompt (Archetype)</label>
                  <button 
                    type="button"
                    className="toggle-prompt-btn"
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                  >
                    {showSystemPrompt ? '[ Hide ]' : '[ Show ]'}
                  </button>
                </div>
                {showSystemPrompt && (
                  <div className="system-prompt-preview">
                    <pre>{template.systemPrompt}</pre>
                  </div>
                )}
                <p className="field-hint">
                  This defines how the AI will behave for this role.
                </p>
              </div>

              {/* Custom Instructions */}
              <div className="field">
                <label>Custom Instructions (Optional)</label>
                <textarea
                  className="custom-prompt-input"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific instructions for this employee...

Examples:
- Focus on accessibility best practices
- Write verbose comments in code
- Prefer functional components
- Always consider mobile-first design"
                  rows={4}
                />
                <p className="field-hint">
                  These will be appended to the system prompt to customize behavior.
                </p>
              </div>
              
              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="hire-modal-footer">
          <div className="salary-info">
            <span className="salary-label">Monthly Salary</span>
            <span className="salary-amount">{formatMoney(template.baseSalary)}</span>
          </div>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="btn-hire" onClick={handleConfirm} disabled={loading}>
              Hire {template.title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HireScreen() {
  // Only subscribe to the specific state we need
  const money = useGameStore(state => state.money);
  const employees = useGameStore(state => state.employees);
  const hireEmployee = useGameStore(state => state.hireEmployee);
  const updateEmployeePrompt = useGameStore(state => state.updateEmployeePrompt);
  
  const [pendingHire, setPendingHire] = useState<EmployeeTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleHireClick = (template: EmployeeTemplate) => {
    setPendingHire(template);
    setModalOpen(true);
  };
  
  const handleConfirmHire = (provider: AIProvider, model: string, customPrompt: string) => {
    if (pendingHire) {
      // Track employee count before hiring to verify success
      const employeeCountBefore = useGameStore.getState().employees.length;
      
      // Hire the employee
      hireEmployee(pendingHire.role, provider, model);
      
      // Verify hire succeeded by checking if a new employee was added
      const state = useGameStore.getState();
      const employeeCountAfter = state.employees.length;
      
      // Only apply custom prompt if hire actually succeeded
      if (customPrompt && employeeCountAfter > employeeCountBefore) {
        const newEmployee = state.employees[state.employees.length - 1];
        if (newEmployee) {
          updateEmployeePrompt(newEmployee.id, undefined, customPrompt);
        }
      }
      
      setModalOpen(false);
      setPendingHire(null);
    }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setPendingHire(null);
  };
  
  // Count employees by role
  const countByRole = (role: string) => employees.filter(e => e.role === role).length;

  return (
    <div className="hire-screen">
      <div className="hire-container">
        {/* Header */}
        <header className="hire-header">
          <div className="header-info">
            <h1>Build Your Team</h1>
            <p>Hire the roles you need to build your product. Each role has unique capabilities.</p>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-label">Budget</span>
              <span className="stat-value">{formatMoney(money)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Team Size</span>
              <span className="stat-value">{employees.length}</span>
            </div>
          </div>
        </header>

        {/* Role Cards */}
        <div className="role-grid">
          {EMPLOYEE_TEMPLATES.map(template => (
            <RoleCard
              key={template.role}
              template={template}
              onHire={() => handleHireClick(template)}
              canAfford={money >= template.baseSalary}
              alreadyHired={countByRole(template.role)}
            />
          ))}
        </div>
        
        {/* Team Tip */}
        <div className="hire-tip">
          <strong>Tip:</strong> Start with a PM to break down your idea into tasks, 
          then hire Engineers and Designers to build it.
        </div>
      </div>
      
      {/* Hire Modal - rendered via portal to avoid parent re-render issues */}
      {modalOpen && pendingHire && createPortal(
        <HireModal
          template={pendingHire}
          onConfirm={handleConfirmHire}
          onCancel={handleCloseModal}
        />,
        document.body
      )}
    </div>
  );
}

export default HireScreen;
