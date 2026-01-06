/**
 * Model Selector Component
 * 
 * Dropdown to select AI models for global or per-employee configuration.
 */

import { useState } from 'react';
import { AI_MODELS } from '../types';
import type { AIProvider, AIModel } from '../types';
import './ModelSelector.css';

interface ModelSelectorProps {
  value: string | null;
  onChange: (modelId: string | null, provider?: AIProvider) => void;
  showDefault?: boolean;
  label?: string;
  filterByCapability?: AIModel['capabilities'][number];
  compact?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  showDefault = false,
  label,
  filterByCapability,
  compact = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter models
  const filteredModels = AI_MODELS.filter(model => {
    if (filterByCapability && !model.capabilities.includes(filterByCapability)) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<AIProvider, AIModel[]>);

  const selectedModel = value ? AI_MODELS.find(m => m.id === value) : null;

  const providerIcons: Record<AIProvider, string> = {
    openai: '🤖',
    anthropic: '🧠',
    google: '🔮',
    groq: '⚡',
    ollama: '🏠',
  };

  const providerColors: Record<AIProvider, string> = {
    openai: '#10a37f',
    anthropic: '#d4a574',
    google: '#4285f4',
    groq: '#f97316',
    ollama: '#9ca3af',
  };

  return (
    <div className={`model-selector ${compact ? 'compact' : ''}`}>
      {label && <label className="selector-label">{label}</label>}
      
      <button 
        className="selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedModel ? (
          <div className="selected-model">
            <span className="provider-icon">{providerIcons[selectedModel.provider]}</span>
            <span className="model-name">{selectedModel.name}</span>
            {!compact && (
              <span 
                className="provider-tag" 
                style={{ background: providerColors[selectedModel.provider] }}
              >
                {selectedModel.provider}
              </span>
            )}
          </div>
        ) : (
          <span className="placeholder">
            {showDefault ? '🌐 Use Global Default' : 'Select a model...'}
          </span>
        )}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="selector-dropdown">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {showDefault && (
            <button 
              className={`model-option default-option ${!value ? 'selected' : ''}`}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              <span className="model-icon">🌐</span>
              <div className="model-info">
                <span className="model-name">Use Global Default</span>
                <span className="model-desc">Inherit from settings</span>
              </div>
            </button>
          )}

          <div className="model-groups">
            {(Object.keys(groupedModels) as AIProvider[]).map(provider => (
              <div key={provider} className="model-group">
                <div 
                  className="group-header"
                  style={{ borderLeftColor: providerColors[provider] }}
                >
                  <span className="group-icon">{providerIcons[provider]}</span>
                  <span className="group-name">{provider.toUpperCase()}</span>
                </div>
                
                {groupedModels[provider].map(model => (
                  <button
                    key={model.id}
                    className={`model-option ${value === model.id ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(model.id, model.provider);
                      setIsOpen(false);
                    }}
                  >
                    <span className="model-icon">{providerIcons[model.provider]}</span>
                    <div className="model-info">
                      <div className="model-header">
                        <span className="model-name">{model.name}</span>
                        {model.costPer1kTokens === 0 && (
                          <span className="free-tag">FREE</span>
                        )}
                      </div>
                      <span className="model-desc">{model.description}</span>
                      <div className="model-meta">
                        <span className="context">{(model.contextWindow / 1000).toFixed(0)}K ctx</span>
                        {model.costPer1kTokens > 0 && (
                          <span className="cost">${model.costPer1kTokens}/1K</span>
                        )}
                        <div className="capabilities">
                          {model.capabilities.map(cap => (
                            <span key={cap} className={`cap cap-${cap}`}>
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {value === model.id && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="no-results">No models found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
