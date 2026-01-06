import { useState } from 'react';
import { Terminal, Box } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { Task } from '../../types';
import './CodeScreen.css';

// Simulated code snippets based on task type
const CODE_TEMPLATES: Record<string, string[]> = {
  feature: [
    `// Feature: {{title}}
import { useState, useEffect } from 'react';

export function {{component}}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="{{className}}">
      <h2>{{title}}</h2>
      {data && <DataDisplay data={data} />}
    </div>
  );
}`,
    `// API Route: {{title}}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const data = await db.query('SELECT * FROM {{table}}');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await db.insert('{{table}}', body);
  return NextResponse.json({ success: true, id: result.id });
}`,
  ],
  bug: [
    `// Bug Fix: {{title}}
// Issue: Component was not re-rendering on state change
// Solution: Added proper dependency array to useEffect

- useEffect(() => {
-   updateData();
- }, []);
+ useEffect(() => {
+   updateData();
+ }, [userId, filters]);

// Also fixed memory leak by cleaning up subscription
useEffect(() => {
  const subscription = subscribe(handleUpdate);
  return () => subscription.unsubscribe();
}, []);`,
    `// Bug Fix: {{title}}
// Issue: Race condition in async operation
// Solution: Implemented proper cancellation

function useAsyncData(url: string) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setData(data);
      });
    
    return () => { cancelled = true; };
  }, [url]);
  
  return data;
}`,
  ],
  design: [
    `/* Design Update: {{title}} */
.component {
  /* Modern glassmorphism effect */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  
  /* Smooth animations */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.component:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .component {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
  }
}`,
  ],
  infrastructure: [
    `# Infrastructure: {{title}}
# docker-compose.yml

version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_PASSWORD: \${DB_PASSWORD}

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:`,
  ],
  marketing: [
    `<!-- Marketing: {{title}} -->
<!-- Landing Page Section -->

<section class="hero">
  <div class="hero-content">
    <h1 class="hero-title">
      Build Something <span class="gradient">Amazing</span>
    </h1>
    <p class="hero-subtitle">
      The fastest way to turn your ideas into reality.
      Join 10,000+ founders who ship faster.
    </p>
    <div class="hero-cta">
      <button class="btn btn-primary">Get Started Free</button>
      <button class="btn btn-secondary">Watch Demo</button>
    </div>
  </div>
  <div class="hero-visual">
    <img src="/hero-illustration.svg" alt="Product Preview" />
  </div>
</section>`,
  ],
};

function generateCode(task: Task): string {
  const templates = CODE_TEMPLATES[task.type] || CODE_TEMPLATES.feature;
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const componentName = task.title
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z]/g, '');
  
  return template
    .replace(/\{\{title\}\}/g, task.title)
    .replace(/\{\{component\}\}/g, componentName || 'Component')
    .replace(/\{\{className\}\}/g, componentName.toLowerCase() || 'component')
    .replace(/\{\{table\}\}/g, componentName.toLowerCase() || 'items');
}

function FileTree({ files }: { files: string[] }) {
  return (
    <div className="file-tree">
      {files.map((file, i) => (
        <div key={i} className="file-item">
          <span className="file-icon">📄</span>
          <span className="file-name">{file}</span>
        </div>
      ))}
    </div>
  );
}

function CodePreview({ task }: { task: Task }) {
  const code = task.codeGenerated || generateCode(task);
  
  const fileExtensions: Record<string, string[]> = {
    feature: ['Component.tsx', 'styles.css', 'types.ts'],
    bug: ['fix.patch', 'Component.tsx'],
    design: ['styles.css', 'theme.ts'],
    infrastructure: ['docker-compose.yml', 'Dockerfile', '.env.example'],
    marketing: ['landing.html', 'styles.css'],
  };
  
  const files = (fileExtensions[task.type] || ['index.ts']).map(
    ext => `src/${task.title.toLowerCase().replace(/\s+/g, '-')}/${ext}`
  );

  return (
    <div className="code-preview">
      <div className="preview-header">
        <span className="task-badge">{task.type.toUpperCase()}</span>
        <h3>{task.title}</h3>
      </div>
      
      <div className="preview-content">
        <div className="files-section">
          <h4>Files Modified</h4>
          <FileTree files={files} />
        </div>
        
        <div className="code-section">
          <div className="code-header">
            <span>Generated Code</span>
            <button className="copy-btn">📋 Copy</button>
          </div>
          <pre className="code-block">
            <code>{code}</code>
          </pre>
        </div>
      </div>
      
      <div className="preview-footer">
        <span className="commit-info">
          🔗 Commit: <code>{Math.random().toString(36).substring(2, 9)}</code>
        </span>
        <span className="lines-info">
          +{Math.floor(Math.random() * 100) + 20} lines
        </span>
      </div>
    </div>
  );
}

export function CodeScreen() {
  const { tasks, setScreen, stats } = useGameStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'review');
  
  return (
    <div className="code-screen">
      <Terminal title="CODE REPOSITORY">
        <div className="code-layout">
          <div className="code-header">
            <h2>💻 Generated Code</h2>
            <div className="code-stats">
              <div className="stat">
                <span className="label">Commits</span>
                <span className="value">{completedTasks.length}</span>
              </div>
              <div className="stat">
                <span className="label">Lines Written</span>
                <span className="value">{stats.linesOfCodeGenerated || completedTasks.length * 47}</span>
              </div>
            </div>
          </div>

          <div className="code-content">
            {completedTasks.length === 0 ? (
              <div className="empty-state">
                <p>No code generated yet!</p>
                <p className="hint">Complete tasks to see generated code here.</p>
              </div>
            ) : selectedTask ? (
              <div className="detail-view">
                <button className="back-link" onClick={() => setSelectedTask(null)}>
                  ← Back to list
                </button>
                <CodePreview task={selectedTask} />
              </div>
            ) : (
              <div className="commits-list">
                <Box title="COMMIT HISTORY" className="commits-box">
                  {completedTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="commit-item"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="commit-icon">
                        {task.type === 'feature' && '✨'}
                        {task.type === 'bug' && '🐛'}
                        {task.type === 'design' && '🎨'}
                        {task.type === 'infrastructure' && '🔧'}
                        {task.type === 'marketing' && '📢'}
                      </div>
                      <div className="commit-info">
                        <span className="commit-title">{task.title}</span>
                        <span className="commit-meta">
                          {task.type} • {task.status === 'done' ? 'merged' : 'pending review'}
                        </span>
                      </div>
                      <div className="commit-hash">
                        {task.id.substring(0, 7)}
                      </div>
                    </div>
                  ))}
                </Box>
              </div>
            )}
          </div>

          <div className="code-footer">
            <button className="back-btn" onClick={() => setScreen('office')}>
              ← Back to Office [ESC]
            </button>
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default CodeScreen;
