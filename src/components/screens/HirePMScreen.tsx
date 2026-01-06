/**
 * Hire PM Screen - First gate after project creation
 * 
 * User must hire a PM to start the ideation process.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import { EMPLOYEE_TEMPLATES } from '../../types';
import type { AIProvider } from '../../types';
import { getApiKey, saveApiKey, type AIProviderKey } from '../../lib/storage/secureStorage';
import './HirePMScreen.css';

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
  
  const pmTemplate = EMPLOYEE_TEMPLATES.find(t => t.role === 'pm')!;
  
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
          <div className="header-icon">&#9672;</div>
          <div className="header-text">
            <h2>Hire Your First PM</h2>
            <p>Choose the AI model that will power your product manager.</p>
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
            <span className="salary-amount">{formatMoney(pmTemplate.baseSalary)}</span>
          </div>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="btn-hire" onClick={handleConfirm} disabled={loading}>
              Hire PM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HirePMScreen() {
  const project = useGameStore(state => state.project);
  const money = useGameStore(state => state.money);
  const hireEmployee = useGameStore(state => state.hireEmployee);
  const [showModal, setShowModal] = useState(false);
  
  const pmTemplate = EMPLOYEE_TEMPLATES.find(t => t.role === 'pm')!;
  const canAfford = money >= pmTemplate.baseSalary;

  const handleConfirmHire = (provider: AIProvider, model: string) => {
    hireEmployee('pm', provider, model);
    setShowModal(false);
  };

  return (
    <div className="hire-pm-screen">
      <div className="hire-pm-container">
        {/* Project Badge */}
        <div className="project-badge">
          <span className="badge-icon">&#9767;</span>
          <span>{project?.name || 'Your Project'}</span>
        </div>

        {/* Main Content */}
        <div className="hire-pm-content">
          <h1>To start playing, you need a PM</h1>
          <p className="subtitle">
            Your Product Manager will break down your vision into actionable tasks 
            that your team can execute.
          </p>

          {/* PM Card */}
          <div className="pm-card">
            <div className="pm-icon">&#9672;</div>
            <div className="pm-info">
              <h3>Product Manager</h3>
              <p>{pmTemplate.description}</p>
              <div className="pm-details">
                <span className="pm-salary">{formatMoney(pmTemplate.baseSalary)}/mo</span>
                <span className="pm-budget">Budget: {formatMoney(money)}</span>
              </div>
            </div>
            <button 
              className={`hire-pm-btn ${canAfford ? '' : 'disabled'}`}
              onClick={() => canAfford && setShowModal(true)}
              disabled={!canAfford}
            >
              {canAfford ? 'Hire PM' : 'Not Enough Funds'}
            </button>
          </div>

          {/* Idea Preview */}
          <div className="idea-preview">
            <div className="idea-label">Your Vision</div>
            <div className="idea-text">{project?.idea}</div>
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

export default HirePMScreen;
