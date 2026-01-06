/**
 * LivePreviewPanel - Adaptive preview for different project types
 * 
 * Shows appropriate preview based on project type:
 * - Frontend: Live React preview with Sandpack
 * - Backend: API endpoint viewer with test requests
 * - CLI: Terminal simulation showing commands
 * - Library: Code documentation view
 * - Other: Smart code viewer
 */

import { useState, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackConsole,
} from '@codesandbox/sandpack-react';
import { useGameStore } from '../store/gameStore';
import type { TaskArtifact, ProjectType } from '../types';
import './LivePreviewPanel.css';

type ViewMode = 'preview' | 'split' | 'code';
type DeviceFrame = 'desktop' | 'tablet' | 'mobile';

// Frontend Preview (React with Sandpack)
function FrontendPreview({ 
  files, 
  viewMode, 
  deviceFrame,
  showExplorer,
  showConsole,
}: {
  files: Record<string, string>;
  viewMode: ViewMode;
  deviceFrame: DeviceFrame;
  showExplorer: boolean;
  showConsole: boolean;
}) {
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '100%' },
    mobile: { width: '375px', height: '100%' },
  };

  return (
    <SandpackProvider
      template="react-ts"
      files={files}
      theme="dark"
      options={{
        recompileMode: 'delayed',
        recompileDelay: 500,
      }}
    >
      <div className="sandpack-container">
        {showExplorer && (
          <div className="explorer-panel">
            <SandpackFileExplorer />
          </div>
        )}
        
        <SandpackLayout className="main-layout">
          {(viewMode === 'code' || viewMode === 'split') && (
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
            />
          )}
          
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div 
              className={`preview-frame device-${deviceFrame}`}
              style={deviceFrame !== 'desktop' ? {
                maxWidth: deviceDimensions[deviceFrame].width,
                margin: '0 auto',
              } : undefined}
            >
              <SandpackPreview
                showNavigator
                showRefreshButton
              />
            </div>
          )}
        </SandpackLayout>
        
        {showConsole && (
          <div className="console-panel">
            <SandpackConsole />
          </div>
        )}
      </div>
    </SandpackProvider>
  );
}

// Backend/API Preview
function BackendPreview({ artifacts }: { artifacts: TaskArtifact[] }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<number>(0);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Extract API endpoints from code
  const endpoints = useMemo(() => {
    const found: Array<{ method: string; path: string; description: string; code: string }> = [];
    
    artifacts.forEach(artifact => {
      if (artifact.type !== 'code') return;
      const content = artifact.content;
      
      // Find route definitions
      const routePatterns = [
        /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      ];
      
      routePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          found.push({
            method: match[1].toUpperCase(),
            path: match[2],
            description: artifact.title,
            code: content,
          });
        }
      });
    });
    
    // Add default if none found
    if (found.length === 0) {
      found.push({
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint',
        code: `app.get('/api/health', (req, res) => {\n  res.json({ status: 'ok' });\n});`,
      });
    }
    
    return found;
  }, [artifacts]);

  const simulateRequest = () => {
    const endpoint = endpoints[selectedEndpoint];
    setTestResponse(JSON.stringify({
      status: 200,
      endpoint: `${endpoint.method} ${endpoint.path}`,
      response: { success: true, message: 'Simulated response' },
      timestamp: new Date().toISOString(),
    }, null, 2));
  };

  return (
    <div className="backend-preview">
      <div className="api-sidebar">
        <h3>🔌 API Endpoints</h3>
        <div className="endpoint-list">
          {endpoints.map((ep, i) => (
            <button
              key={i}
              className={`endpoint-item ${selectedEndpoint === i ? 'active' : ''}`}
              onClick={() => setSelectedEndpoint(i)}
            >
              <span className={`method method-${ep.method.toLowerCase()}`}>{ep.method}</span>
              <span className="path">{ep.path}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="api-content">
        <div className="api-tester">
          <div className="request-bar">
            <span className={`method method-${endpoints[selectedEndpoint]?.method.toLowerCase()}`}>
              {endpoints[selectedEndpoint]?.method}
            </span>
            <input 
              type="text" 
              value={`http://localhost:3000${endpoints[selectedEndpoint]?.path}`}
              readOnly
            />
            <button className="send-btn" onClick={simulateRequest}>
              ▶ Send
            </button>
          </div>
          
          {testResponse && (
            <div className="response-panel">
              <h4>Response</h4>
              <pre><code>{testResponse}</code></pre>
            </div>
          )}
        </div>
        
        <div className="code-panel">
          <h4>📝 Implementation</h4>
          <pre><code>{endpoints[selectedEndpoint]?.code}</code></pre>
        </div>
      </div>
    </div>
  );
}

// CLI Preview
function CLIPreview({ artifacts }: { artifacts: TaskArtifact[] }) {
  const [commandHistory, setCommandHistory] = useState<string[]>([
    '$ npm install -g your-cli',
    '✓ Installed successfully',
    '',
    '$ your-cli --help',
  ]);

  // Extract CLI commands from code
  const commands = useMemo(() => {
    const found: Array<{ name: string; description: string; usage: string }> = [];
    
    artifacts.forEach(artifact => {
      if (artifact.type !== 'code') return;
      const content = artifact.content;
      
      // Find command definitions
      const cmdMatch = content.match(/\.command\s*\(\s*['"`]([^'"`]+)['"`]/g);
      if (cmdMatch) {
        cmdMatch.forEach(match => {
          const name = match.match(/['"`]([^'"`]+)['"`]/)?.[1] || 'command';
          found.push({
            name,
            description: `Execute ${name} command`,
            usage: `your-cli ${name} [options]`,
          });
        });
      }
    });
    
    if (found.length === 0) {
      found.push(
        { name: 'init', description: 'Initialize a new project', usage: 'your-cli init [name]' },
        { name: 'build', description: 'Build the project', usage: 'your-cli build' },
        { name: 'deploy', description: 'Deploy to production', usage: 'your-cli deploy' },
      );
    }
    
    return found;
  }, [artifacts]);

  const runCommand = (cmd: string) => {
    setCommandHistory(prev => [
      ...prev,
      `$ your-cli ${cmd}`,
      `✓ Executed: ${cmd}`,
      '',
    ]);
  };

  return (
    <div className="cli-preview">
      <div className="cli-sidebar">
        <h3>⚡ Commands</h3>
        <div className="command-list">
          {commands.map((cmd, i) => (
            <button
              key={i}
              className="command-item"
              onClick={() => runCommand(cmd.name)}
            >
              <span className="cmd-name">{cmd.name}</span>
              <span className="cmd-desc">{cmd.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="cli-terminal">
        <div className="terminal-header">
          <span className="terminal-dot red"></span>
          <span className="terminal-dot yellow"></span>
          <span className="terminal-dot green"></span>
          <span className="terminal-title">Terminal</span>
        </div>
        <div className="terminal-content">
          {commandHistory.map((line, i) => (
            <div key={i} className={`terminal-line ${line.startsWith('$') ? 'input' : line.startsWith('✓') ? 'success' : ''}`}>
              {line}
            </div>
          ))}
          <div className="terminal-cursor">$ <span className="cursor">▋</span></div>
        </div>
      </div>
    </div>
  );
}

// Library/Package Preview
function LibraryPreview({ artifacts, projectName }: { artifacts: TaskArtifact[]; projectName: string }) {
  return (
    <div className="library-preview">
      <div className="lib-header">
        <h2>📦 {projectName}</h2>
        <div className="lib-badges">
          <span className="badge">npm</span>
          <span className="badge">TypeScript</span>
          <span className="badge">MIT</span>
        </div>
      </div>
      
      <div className="lib-install">
        <h3>Installation</h3>
        <pre><code>npm install {projectName.toLowerCase().replace(/\s+/g, '-')}</code></pre>
      </div>
      
      <div className="lib-usage">
        <h3>Usage</h3>
        <pre><code>{`import { ... } from '${projectName.toLowerCase().replace(/\s+/g, '-')}';

// Your code here`}</code></pre>
      </div>
      
      <div className="lib-exports">
        <h3>Exports ({artifacts.filter(a => a.type === 'code').length})</h3>
        <div className="export-list">
          {artifacts.filter(a => a.type === 'code').map((artifact, i) => (
            <div key={i} className="export-item">
              <span className="export-name">{artifact.title}</span>
              <pre><code>{artifact.content.slice(0, 200)}...</code></pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic Code Preview (for other/unknown types)
function GenericCodePreview({ artifacts }: { artifacts: TaskArtifact[] }) {
  const [selectedFile, setSelectedFile] = useState(0);
  const codeArtifacts = artifacts.filter(a => a.type === 'code');

  if (codeArtifacts.length === 0) {
    return (
      <div className="generic-empty">
        <span>📄</span>
        <p>No code generated yet</p>
      </div>
    );
  }

  return (
    <div className="generic-preview">
      <div className="file-tabs">
        {codeArtifacts.map((artifact, i) => (
          <button
            key={i}
            className={`file-tab ${selectedFile === i ? 'active' : ''}`}
            onClick={() => setSelectedFile(i)}
          >
            {artifact.title}
          </button>
        ))}
      </div>
      <div className="code-viewer">
        <pre><code>{codeArtifacts[selectedFile]?.content}</code></pre>
      </div>
    </div>
  );
}

// Build Sandpack files for frontend projects
function buildSandpackFiles(
  artifacts: TaskArtifact[],
  projectName: string,
  legacyCode: Array<{ code: string; task: string }>
): Record<string, string> {
  const files: Record<string, string> = {};
  
  artifacts.forEach((artifact) => {
    if (artifact.type !== 'code' && artifact.type !== 'design') return;
    
    let path = artifact.filePath;
    
    if (!path) {
      const safeName = artifact.title.replace(/[^a-zA-Z0-9]/g, '');
      if (artifact.language === 'css' || artifact.type === 'design') {
        path = `/src/styles/${safeName}.css`;
      } else {
        path = `/src/components/${safeName}.tsx`;
      }
    }
    
    if (!path.startsWith('/')) path = '/' + path;
    files[path] = artifact.content;
  });
  
  legacyCode.forEach((item, index) => {
    const safeName = item.task.replace(/[^a-zA-Z0-9]/g, '');
    const path = `/src/legacy/${safeName || `Code${index}`}.tsx`;
    files[path] = item.code;
  });
  
  const components: Array<{ name: string; path: string }> = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.css')) return;
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/);
    if (exportMatch) {
      components.push({ name: exportMatch[1], path });
    }
  });
  
  const cssFiles = Object.keys(files).filter(p => p.endsWith('.css'));
  const cssImports = cssFiles.map(p => `import "${p}";`).join('\n');
  const componentImports = components
    .map(c => `import { ${c.name} } from "${c.path.replace(/\.tsx?$/, '')}";`)
    .join('\n');
  const componentUsage = components
    .map(c => `          <${c.name} />`)
    .join('\n');
  
  files['/App.tsx'] = `import React from "react";
import "./styles.css";
${cssImports}
${componentImports}

export default function App() {
  return (
    <div className="founder-app">
      <header className="app-header">
        <h1>🚀 ${projectName}</h1>
        <span className="badge">Built with Founder Mode</span>
      </header>
      
      <main className="app-content">
        ${components.length > 0 ? `<div className="components-grid">
${componentUsage}
        </div>` : `<div className="no-components">
          <p>✨ Your app is being built...</p>
          <p>Assign more tasks to see components appear here!</p>
        </div>`}
      </main>
    </div>
  );
}
`;

  files['/styles.css'] = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e4e4e7;
  min-height: 100vh;
}
.founder-app { min-height: 100vh; display: flex; flex-direction: column; }
.app-header {
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.app-header h1 { font-size: 1.5rem; }
.badge {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}
.app-content { flex: 1; padding: 32px; }
.components-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
.no-components { text-align: center; padding: 60px 20px; color: #a1a1aa; }
`;

  return files;
}

export function LivePreviewPanel() {
  const { tasks, project } = useGameStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>('desktop');
  const [showExplorer, setShowExplorer] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  
  const projectType = project?.projectType || 'frontend';
  
  // Gather all artifacts and legacy code
  const { artifacts, legacyCode, totalFiles } = useMemo(() => {
    const artifacts: TaskArtifact[] = [];
    const legacyCode: Array<{ code: string; task: string }> = [];
    
    tasks.forEach(task => {
      if (task.artifacts) {
        artifacts.push(...task.artifacts);
      }
      if (task.codeGenerated) {
        legacyCode.push({ code: task.codeGenerated, task: task.title });
      }
    });
    
    return {
      artifacts,
      legacyCode,
      totalFiles: artifacts.length + legacyCode.length,
    };
  }, [tasks]);
  
  // Build Sandpack files (only for frontend)
  const sandpackFiles = useMemo(() => {
    if (projectType !== 'frontend' && projectType !== 'fullstack') return {};
    return buildSandpackFiles(artifacts, project?.name || 'My Startup', legacyCode);
  }, [artifacts, legacyCode, project?.name, projectType]);
  
  const fileCount = Object.keys(sandpackFiles).length || artifacts.length;

  // Get project type label and icon
  const projectTypeInfo: Record<ProjectType, { icon: string; label: string }> = {
    frontend: { icon: '🖼️', label: 'Frontend App' },
    backend: { icon: '🔌', label: 'Backend API' },
    fullstack: { icon: '🌐', label: 'Full Stack' },
    cli: { icon: '⚡', label: 'CLI Tool' },
    library: { icon: '📦', label: 'Library' },
    mobile: { icon: '📱', label: 'Mobile App' },
    other: { icon: '📄', label: 'Project' },
  };
  
  const typeInfo = projectTypeInfo[projectType];
  
  return (
    <div className="live-preview-panel">
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="toolbar-left">
          {(projectType === 'frontend' || projectType === 'fullstack') && (
            <>
              <div className="view-switcher">
                <button
                  className={viewMode === 'preview' ? 'active' : ''}
                  onClick={() => setViewMode('preview')}
                  title="Preview only"
                >
                  👁️
                </button>
                <button
                  className={viewMode === 'split' ? 'active' : ''}
                  onClick={() => setViewMode('split')}
                  title="Split view"
                >
                  ⚡
                </button>
                <button
                  className={viewMode === 'code' ? 'active' : ''}
                  onClick={() => setViewMode('code')}
                  title="Code only"
                >
                  📝
                </button>
              </div>
              
              <div className="device-switcher">
                <button
                  className={deviceFrame === 'desktop' ? 'active' : ''}
                  onClick={() => setDeviceFrame('desktop')}
                  title="Desktop"
                >
                  🖥️
                </button>
                <button
                  className={deviceFrame === 'tablet' ? 'active' : ''}
                  onClick={() => setDeviceFrame('tablet')}
                  title="Tablet"
                >
                  📱
                </button>
                <button
                  className={deviceFrame === 'mobile' ? 'active' : ''}
                  onClick={() => setDeviceFrame('mobile')}
                  title="Mobile"
                >
                  📲
                </button>
              </div>
            </>
          )}
          
          <div className="project-type-badge">
            <span>{typeInfo.icon}</span>
            <span>{typeInfo.label}</span>
          </div>
        </div>
        
        <div className="toolbar-center">
          <span className="project-name">🚀 {project?.name || 'My Startup'}</span>
        </div>
        
        <div className="toolbar-right">
          {(projectType === 'frontend' || projectType === 'fullstack') && (
            <>
              <button
                className={`tool-btn ${showExplorer ? 'active' : ''}`}
                onClick={() => setShowExplorer(!showExplorer)}
                title="File explorer"
              >
                📁 Files
              </button>
              <button
                className={`tool-btn ${showConsole ? 'active' : ''}`}
                onClick={() => setShowConsole(!showConsole)}
                title="Console"
              >
                🖥️ Console
              </button>
            </>
          )}
          <div className="file-count">
            {fileCount} files
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="preview-main">
        {totalFiles === 0 ? (
          <div className="preview-empty">
            <div className="empty-illustration">
              <span>{typeInfo.icon}</span>
            </div>
            <h2>Your {typeInfo.label} Awaits</h2>
            <p>Assign tasks to your team and watch your project come to life!</p>
            <div className="empty-steps">
              <div className="step">
                <span className="step-num">1</span>
                <span>Hire team</span>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <span>Create tasks</span>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <span>Watch AI code</span>
              </div>
              <div className="step">
                <span className="step-num">4</span>
                <span>See results!</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {(projectType === 'frontend' || projectType === 'fullstack') && (
              <FrontendPreview
                files={sandpackFiles}
                viewMode={viewMode}
                deviceFrame={deviceFrame}
                showExplorer={showExplorer}
                showConsole={showConsole}
              />
            )}
            {projectType === 'backend' && (
              <BackendPreview artifacts={artifacts} />
            )}
            {projectType === 'cli' && (
              <CLIPreview artifacts={artifacts} />
            )}
            {projectType === 'library' && (
              <LibraryPreview artifacts={artifacts} projectName={project?.name || 'my-library'} />
            )}
            {(projectType === 'mobile' || projectType === 'other') && (
              <GenericCodePreview artifacts={artifacts} />
            )}
          </>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="preview-statusbar">
        <div className="status-left">
          <span className="status-item">
            📦 {artifacts.filter(a => a.type === 'code').length} code files
          </span>
          <span className="status-item">
            🎨 {artifacts.filter(a => a.type === 'design').length} styles
          </span>
          {legacyCode.length > 0 && (
            <span className="status-item">
              📜 {legacyCode.length} legacy
            </span>
          )}
        </div>
        <div className="status-right">
          <span className="status-item powered">
            {projectType === 'frontend' || projectType === 'fullstack' 
              ? '⚡ Powered by Sandpack' 
              : `⚡ ${typeInfo.label} Preview`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LivePreviewPanel;
