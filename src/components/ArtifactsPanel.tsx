/**
 * Artifacts Panel - View AI-generated content
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { TaskArtifact, Task } from '../types';
import './ArtifactsPanel.css';

const typeIcons: Record<string, string> = {
  code: '◆',
  design: '◇',
  copy: '○',
  document: '◈',
  analysis: '◎',
};

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{language || 'text'}</span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ArtifactCard({ artifact, task }: { artifact: TaskArtifact; task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const { employees } = useGameStore();
  
  const creator = employees.find(e => e.id === artifact.createdBy);
  
  return (
    <div className={`artifact-card ${expanded ? 'expanded' : ''}`}>
      <div className="artifact-header" onClick={() => setExpanded(!expanded)}>
        <div className="artifact-main">
          <span className="artifact-icon">{typeIcons[artifact.type] || '◆'}</span>
          <div className="artifact-info">
            <span className="artifact-title">{artifact.title}</span>
            <span className="artifact-task">{task.title}</span>
          </div>
        </div>
        <div className="artifact-meta">
          {artifact.filePath && (
            <span className="file-path">{artifact.filePath}</span>
          )}
          {creator && (
            <span className="creator">{creator.name.split(' ')[0]}</span>
          )}
          {artifact.modelUsed && (
            <span className="model-tag">{artifact.modelUsed}</span>
          )}
          <span className="expand-icon">{expanded ? '−' : '+'}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="artifact-content">
          {artifact.type === 'code' ? (
            <CodeBlock code={artifact.content} language={artifact.language} />
          ) : (
            <div className="text-content">{artifact.content}</div>
          )}
        </div>
      )}
    </div>
  );
}

function AIWorkStatus() {
  const navigate = useNavigate();
  const { aiWorkQueue, aiWorkInProgress, aiSettings, tasks } = useGameStore();
  
  if (!aiSettings.enabled) {
    return (
      <div className="ai-status disabled">
        <span className="status-icon">○</span>
        <span className="status-text">AI disabled</span>
        <button className="enable-btn" onClick={() => navigate('/play/settings')}>
          Enable
        </button>
      </div>
    );
  }
  
  const queuedCount = aiWorkQueue.filter(w => w.status === 'queued').length;
  const currentTask = aiWorkInProgress 
    ? tasks.find(t => t.id === aiWorkInProgress)
    : null;
  
  return (
    <div className="ai-status active">
      <span className="status-icon">◈</span>
      <div className="status-info">
        {currentTask ? (
          <span className="working-on">
            Working on: <strong>{currentTask.title}</strong>
          </span>
        ) : queuedCount > 0 ? (
          <span>{queuedCount} task{queuedCount > 1 ? 's' : ''} queued</span>
        ) : (
          <span>Ready</span>
        )}
      </div>
      <span className="model-name">{aiSettings.model}</span>
    </div>
  );
}

export function ArtifactsPanel() {
  const navigate = useNavigate();
  const { tasks } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'code' | 'design' | 'copy'>('all');
  
  // Gather all artifacts from tasks
  const allArtifacts: { artifact: TaskArtifact; task: Task }[] = tasks
    .flatMap(task => 
      task.artifacts.map(artifact => ({ artifact, task }))
    )
    .filter(({ artifact }) => 
      filter === 'all' || artifact.type === filter
    )
    .sort((a, b) => b.artifact.createdAt - a.artifact.createdAt);
  
  // Also show legacy codeGenerated content
  const legacyCode = tasks
    .filter(t => t.codeGenerated && (filter === 'all' || filter === 'code'))
    .map(task => ({
      artifact: {
        id: `legacy-${task.id}`,
        type: 'code' as const,
        title: `Generated code for ${task.title}`,
        content: task.codeGenerated!,
        language: 'typescript',
        createdAt: task.completedAt || task.createdAt,
        createdBy: task.assigneeId || '',
      },
      task,
    }));
  
  const allItems = [...allArtifacts, ...legacyCode];
  
  const stats = {
    total: allItems.length,
    code: allItems.filter(i => i.artifact.type === 'code').length,
    design: allItems.filter(i => i.artifact.type === 'design').length,
  };
  
  return (
    <div className="artifacts-panel">
      <div className="artifacts-container">
        {/* Header */}
        <header className="artifacts-header">
          <h1>Generated Code</h1>
          <div className="header-right">
            <AIWorkStatus />
            {stats.code > 0 && (
              <button 
                className="preview-btn"
                onClick={() => navigate('/play/preview')}
              >
                Preview
              </button>
            )}
          </div>
        </header>

        {/* Stats & Filters */}
        <div className="artifacts-toolbar">
          <div className="stats">
            <span className="stat">{stats.total} artifacts</span>
            <span className="stat">{stats.code} code</span>
            <span className="stat">{stats.design} design</span>
          </div>
          <div className="filters">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'code' ? 'active' : ''} 
              onClick={() => setFilter('code')}
            >
              Code
            </button>
            <button 
              className={filter === 'design' ? 'active' : ''} 
              onClick={() => setFilter('design')}
            >
              Design
            </button>
            <button 
              className={filter === 'copy' ? 'active' : ''} 
              onClick={() => setFilter('copy')}
            >
              Copy
            </button>
          </div>
        </div>
        
        {/* Artifacts List */}
        <div className="artifacts-list">
          {allItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">◇</span>
              <h3>No artifacts yet</h3>
              <p>Assign tasks to employees with AI enabled to generate code and content.</p>
            </div>
          ) : (
            allItems.map(({ artifact, task }) => (
              <ArtifactCard key={artifact.id} artifact={artifact} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ArtifactsPanel;
