/**
 * CodePreview - Live code preview using Sandpack
 * 
 * Renders generated code in an interactive sandbox
 */

import { useMemo, useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackConsole,
} from '@codesandbox/sandpack-react';
import { useGameStore } from '../store/gameStore';
import type { TaskArtifact } from '../types';
import './CodePreview.css';

interface CodePreviewProps {
  /** Show only specific artifacts */
  artifactIds?: string[];
  /** Show code editor alongside preview */
  showEditor?: boolean;
  /** Show console output */
  showConsole?: boolean;
  /** Custom height */
  height?: string;
  /** Compact mode (just the preview) */
  compact?: boolean;
}

// Convert our artifacts into Sandpack files
function artifactsToSandpackFiles(artifacts: TaskArtifact[]): Record<string, string> {
  const files: Record<string, string> = {};
  
  // Separate by type
  const codeArtifacts = artifacts.filter(a => a.type === 'code');
  const designArtifacts = artifacts.filter(a => a.type === 'design');
  
  // Process code artifacts
  codeArtifacts.forEach(artifact => {
    let filePath = artifact.filePath || `/src/${artifact.title.replace(/\s+/g, '')}`;
    
    // Ensure proper extension
    if (artifact.language === 'typescript' || artifact.language === 'tsx') {
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
        filePath += '.tsx';
      }
    } else if (artifact.language === 'javascript' || artifact.language === 'jsx') {
      if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        filePath += '.jsx';
      }
    } else if (artifact.language === 'css') {
      if (!filePath.endsWith('.css')) {
        filePath += '.css';
      }
    }
    
    // Ensure path starts with /
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    
    files[filePath] = artifact.content;
  });
  
  // Process design artifacts (CSS)
  designArtifacts.forEach(artifact => {
    let filePath = artifact.filePath || `/src/styles/${artifact.title.replace(/\s+/g, '')}.css`;
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    files[filePath] = artifact.content;
  });
  
  return files;
}

// Generate App.tsx that imports and uses the components
function generateAppFile(artifacts: TaskArtifact[], projectName?: string): string {
  const codeArtifacts = artifacts.filter(a => a.type === 'code' && a.language !== 'css');
  const cssArtifacts = artifacts.filter(a => a.type === 'code' && a.language === 'css' || a.type === 'design');
  
  // Import CSS files
  const cssImports = cssArtifacts.map(a => {
    const path = a.filePath || `/src/styles/${a.title.replace(/\s+/g, '')}.css`;
    return `import "${path.replace(/^\//, './')}";`;
  }).join('\n');
  
  // Try to identify component exports from code
  const componentImports: string[] = [];
  const componentUsages: string[] = [];
  
  codeArtifacts.forEach((artifact, index) => {
    // Try to extract component name from the code
    const exportMatch = artifact.content.match(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/);
    const componentName = exportMatch ? exportMatch[1] : `Component${index + 1}`;
    
    const filePath = artifact.filePath || `/src/${artifact.title.replace(/\s+/g, '')}`;
    const importPath = filePath.replace(/^\//, './').replace(/\.(tsx?|jsx?)$/, '');
    
    componentImports.push(`import { ${componentName} } from "${importPath}";`);
    componentUsages.push(`        <${componentName} />`);
  });
  
  return `import React from "react";
${cssImports}
${componentImports.length > 0 ? componentImports.join('\n') : ''}

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 ${projectName || 'My Startup'}</h1>
        <p>Built with Founder Mode</p>
      </header>
      <main className="app-main">
${componentUsages.length > 0 ? componentUsages.join('\n') : '        <p>No components generated yet. Assign tasks to your team!</p>'}
      </main>
    </div>
  );
}
`;
}

// Default app styles
const DEFAULT_STYLES = `
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.app-header {
  text-align: center;
  padding: 40px 20px;
}

.app-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
}

.app-header p {
  margin: 0;
  opacity: 0.8;
}

.app-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
`;

export function CodePreview({
  artifactIds,
  showEditor = false,
  showConsole = false,
  height = '500px',
  compact = false,
}: CodePreviewProps) {
  const { tasks, project } = useGameStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'console'>('preview');
  
  // Gather all artifacts
  const allArtifacts = useMemo(() => {
    const artifacts: TaskArtifact[] = [];
    
    tasks.forEach(task => {
      if (task.artifacts) {
        if (artifactIds) {
          artifacts.push(...task.artifacts.filter(a => artifactIds.includes(a.id)));
        } else {
          artifacts.push(...task.artifacts);
        }
      }
    });
    
    return artifacts;
  }, [tasks, artifactIds]);
  
  // Convert to Sandpack files
  const sandpackFiles = useMemo(() => {
    const files = artifactsToSandpackFiles(allArtifacts);
    
    // Always add App.tsx and styles
    files['/App.tsx'] = generateAppFile(allArtifacts, project?.name);
    files['/styles.css'] = DEFAULT_STYLES;
    
    return files;
  }, [allArtifacts, project?.name]);
  
  // If no artifacts, show placeholder
  if (allArtifacts.length === 0) {
    return (
      <div className="code-preview-empty" style={{ height }}>
        <div className="empty-content">
          <span className="empty-icon">🏗️</span>
          <h3>No Code Yet</h3>
          <p>Assign tasks to your team and watch your app come to life!</p>
        </div>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className="code-preview compact" style={{ height }}>
        <SandpackProvider
          template="react-ts"
          files={sandpackFiles}
          theme="dark"
          options={{
            externalResources: [],
          }}
        >
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={false}
          />
        </SandpackProvider>
      </div>
    );
  }
  
  return (
    <div className="code-preview" style={{ height }}>
      <div className="preview-header">
        <div className="preview-tabs">
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
          {showEditor && (
            <button
              className={`tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              📝 Code
            </button>
          )}
          {showConsole && (
            <button
              className={`tab ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => setActiveTab('console')}
            >
              🖥️ Console
            </button>
          )}
        </div>
        <div className="preview-info">
          <span className="artifact-count">{allArtifacts.length} files</span>
        </div>
      </div>
      
      <div className="preview-content">
        <SandpackProvider
          template="react-ts"
          files={sandpackFiles}
          theme="dark"
          options={{
            externalResources: [],
          }}
        >
          <SandpackLayout>
            {activeTab === 'preview' && (
              <SandpackPreview
                showNavigator
                showRefreshButton
              />
            )}
            {activeTab === 'code' && showEditor && (
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
              />
            )}
            {activeTab === 'console' && showConsole && (
              <SandpackConsole />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}

// Simple preview for a single artifact
export function SingleArtifactPreview({ artifact }: { artifact: TaskArtifact }) {
  if (artifact.type !== 'code' && artifact.type !== 'design') {
    return (
      <div className="single-preview-unsupported">
        <span>Preview not available for {artifact.type} artifacts</span>
      </div>
    );
  }
  
  // For CSS, show a styled div preview
  if (artifact.language === 'css' || artifact.type === 'design') {
    return (
      <div className="single-preview css-preview">
        <style>{artifact.content}</style>
        <div className="css-demo">
          <div className="demo-element">
            <h3>Style Preview</h3>
            <p>This is how your styles look!</p>
            <button>Sample Button</button>
          </div>
        </div>
      </div>
    );
  }
  
  // For React/TS code, use Sandpack
  const files: Record<string, string> = {
    '/App.tsx': artifact.content,
    '/styles.css': DEFAULT_STYLES,
  };
  
  return (
    <div className="single-preview">
      <SandpackProvider
        template="react-ts"
        files={files}
        theme="dark"
      >
        <SandpackPreview
          showNavigator={false}
          showRefreshButton
        />
      </SandpackProvider>
    </div>
  );
}

export default CodePreview;
