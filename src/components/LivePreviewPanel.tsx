/**
 * LivePreviewPanel - Full-featured live preview of the generated app
 * 
 * Shows the complete application built from all artifacts,
 * with controls for viewing, editing, and exporting.
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
import type { TaskArtifact } from '../types';
import './LivePreviewPanel.css';

type ViewMode = 'preview' | 'split' | 'code';
type DeviceFrame = 'desktop' | 'tablet' | 'mobile';

// Convert artifacts to Sandpack file structure
function buildSandpackFiles(
  artifacts: TaskArtifact[],
  projectName: string,
  legacyCode: Array<{ code: string; task: string }>
): Record<string, string> {
  const files: Record<string, string> = {};
  
  // Process modern artifacts
  artifacts.forEach((artifact) => {
    if (artifact.type !== 'code' && artifact.type !== 'design') return;
    
    let path = artifact.filePath;
    
    if (!path) {
      // Generate path from artifact info
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
  
  // Process legacy codeGenerated strings
  legacyCode.forEach((item, index) => {
    const safeName = item.task.replace(/[^a-zA-Z0-9]/g, '');
    const path = `/src/legacy/${safeName || `Code${index}`}.tsx`;
    files[path] = item.code;
  });
  
  // Extract component names for imports
  const components: Array<{ name: string; path: string }> = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.css')) return;
    
    // Try to find exported component
    const exportMatch = content.match(
      /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/
    );
    if (exportMatch) {
      components.push({ name: exportMatch[1], path });
    }
  });
  
  // Collect CSS imports
  const cssFiles = Object.keys(files).filter(p => p.endsWith('.css'));
  
  // Generate main App.tsx
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
      
      <footer className="app-footer">
        <p>Generated ${components.length} component${components.length !== 1 ? 's' : ''}</p>
      </footer>
    </div>
  );
}
`;

  // Base styles
  files['/styles.css'] = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e4e4e7;
  min-height: 100vh;
}

.founder-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.badge {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.app-content {
  flex: 1;
  padding: 32px;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.no-components {
  text-align: center;
  padding: 60px 20px;
  color: #a1a1aa;
}

.no-components p:first-child {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.app-footer {
  padding: 16px 32px;
  text-align: center;
  color: #71717a;
  font-size: 13px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
`;

  return files;
}

export function LivePreviewPanel() {
  const { tasks, project } = useGameStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>('desktop');
  const [showExplorer, setShowExplorer] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  
  // Gather all artifacts and legacy code
  const { artifacts, legacyCode, totalFiles } = useMemo(() => {
    const artifacts: TaskArtifact[] = [];
    const legacyCode: Array<{ code: string; task: string }> = [];
    
    tasks.forEach(task => {
      // Modern artifacts
      if (task.artifacts) {
        artifacts.push(...task.artifacts);
      }
      // Legacy codeGenerated
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
  
  // Build Sandpack files
  const sandpackFiles = useMemo(() => {
    return buildSandpackFiles(
      artifacts,
      project?.name || 'My Startup',
      legacyCode
    );
  }, [artifacts, legacyCode, project?.name]);
  
  const fileCount = Object.keys(sandpackFiles).length;
  
  // Device frame dimensions
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '100%' },
    mobile: { width: '375px', height: '100%' },
  };
  
  return (
    <div className="live-preview-panel">
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="toolbar-left">
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
        </div>
        
        <div className="toolbar-center">
          <span className="project-name">🚀 {project?.name || 'My Startup'}</span>
        </div>
        
        <div className="toolbar-right">
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
              <span>🏗️</span>
            </div>
            <h2>Your App Awaits</h2>
            <p>Assign tasks to your team and watch your application come to life!</p>
            <div className="empty-steps">
              <div className="step">
                <span className="step-num">1</span>
                <span>Hire engineers</span>
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
                <span>See it live!</span>
              </div>
            </div>
          </div>
        ) : (
          <SandpackProvider
            template="react-ts"
            files={sandpackFiles}
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
        )}
      </div>
      
      {/* Status Bar */}
      <div className="preview-statusbar">
        <div className="status-left">
          <span className="status-item">
            📦 {artifacts.filter(a => a.type === 'code').length} components
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
            ⚡ Powered by Sandpack
          </span>
        </div>
      </div>
    </div>
  );
}

export default LivePreviewPanel;
