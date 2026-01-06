/**
 * Artifacts Panel Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArtifactsPanel } from './ArtifactsPanel';
import { useGameStore } from '../store/gameStore';

// Reset store before each test
function resetStore() {
  useGameStore.setState({
    tasks: [],
    employees: [],
    aiSettings: {
      enabled: false,
      apiKey: null,
      provider: 'openai',
      model: 'gpt-4o-mini',
      providerKeys: {},
    },
    aiWorkQueue: [],
    aiWorkInProgress: null,
  });
}

describe('ArtifactsPanel', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should render empty state when no artifacts', () => {
    render(<ArtifactsPanel />);
    
    expect(screen.getByText('No artifacts yet')).toBeInTheDocument();
    expect(screen.getByText(/Assign tasks to employees/)).toBeInTheDocument();
  });

  it('should show AI disabled message when AI is off', () => {
    render(<ArtifactsPanel />);
    
    expect(screen.getByText(/AI is disabled/)).toBeInTheDocument();
  });

  it('should show AI ready message when enabled but queue empty', () => {
    useGameStore.setState({
      aiSettings: {
        enabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        model: 'gpt-4o-mini',
        providerKeys: {},
      },
    });
    
    render(<ArtifactsPanel />);
    
    expect(screen.getByText(/AI ready/)).toBeInTheDocument();
  });

  it('should show queued work count', () => {
    useGameStore.setState({
      aiSettings: {
        enabled: true,
        apiKey: 'test-key',
        provider: 'openai',
        model: 'gpt-4o-mini',
        providerKeys: {},
      },
      aiWorkQueue: [
        { id: '1', taskId: 't1', employeeId: 'e1', priority: 1, addedAt: Date.now(), status: 'queued', retries: 0 },
        { id: '2', taskId: 't2', employeeId: 'e2', priority: 2, addedAt: Date.now(), status: 'queued', retries: 0 },
      ],
    });
    
    render(<ArtifactsPanel />);
    
    expect(screen.getByText(/2 tasks in AI queue/)).toBeInTheDocument();
  });

  it('should display artifacts from tasks', () => {
    useGameStore.setState({
      tasks: [
        {
          id: 'task-1',
          title: 'Build feature',
          description: 'A feature',
          type: 'feature',
          status: 'done',
          priority: 'high',
          assigneeId: null,
          estimatedTicks: 10,
          progressTicks: 10,
          createdAt: 0,
          completedAt: 10,
          codeGenerated: null,
          filesCreated: [],
          artifacts: [
            {
              id: 'artifact-1',
              type: 'code',
              title: 'Button.tsx',
              content: 'export const Button = () => <button>Click</button>;',
              language: 'typescript',
              filePath: 'src/components/Button.tsx',
              createdAt: 5,
              createdBy: 'emp-1',
            },
          ],
          aiWorkStarted: true,
          aiWorkCompleted: true,
        },
      ],
      aiSettings: {
        enabled: true,
        apiKey: 'test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        providerKeys: {},
      },
    });
    
    render(<ArtifactsPanel />);
    
    expect(screen.getByText('Button.tsx')).toBeInTheDocument();
    expect(screen.getByText('from: Build feature')).toBeInTheDocument();
  });

  it('should filter artifacts by type', () => {
    useGameStore.setState({
      tasks: [
        {
          id: 'task-1',
          title: 'Build feature',
          description: 'A feature',
          type: 'feature',
          status: 'done',
          priority: 'high',
          assigneeId: null,
          estimatedTicks: 10,
          progressTicks: 10,
          createdAt: 0,
          completedAt: 10,
          codeGenerated: null,
          filesCreated: [],
          artifacts: [
            {
              id: 'artifact-1',
              type: 'code',
              title: 'Component.tsx',
              content: 'code here',
              createdAt: 5,
              createdBy: 'emp-1',
            },
            {
              id: 'artifact-2',
              type: 'design',
              title: 'Design Spec',
              content: 'design here',
              createdAt: 6,
              createdBy: 'emp-2',
            },
          ],
          aiWorkStarted: true,
          aiWorkCompleted: true,
        },
      ],
      aiSettings: {
        enabled: true,
        apiKey: 'test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        providerKeys: {},
      },
    });
    
    render(<ArtifactsPanel />);
    
    // Both should be visible initially
    expect(screen.getByText('Component.tsx')).toBeInTheDocument();
    expect(screen.getByText('Design Spec')).toBeInTheDocument();
    
    // Filter to code only
    fireEvent.click(screen.getByText('💻 Code'));
    
    expect(screen.getByText('Component.tsx')).toBeInTheDocument();
    expect(screen.queryByText('Design Spec')).not.toBeInTheDocument();
    
    // Filter to design only
    fireEvent.click(screen.getByText('🎨 Design'));
    
    expect(screen.queryByText('Component.tsx')).not.toBeInTheDocument();
    expect(screen.getByText('Design Spec')).toBeInTheDocument();
  });

  it('should show stats count', () => {
    useGameStore.setState({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          description: '',
          type: 'feature',
          status: 'done',
          priority: 'high',
          assigneeId: null,
          estimatedTicks: 10,
          progressTicks: 10,
          createdAt: 0,
          completedAt: 10,
          codeGenerated: null,
          filesCreated: [],
          artifacts: [
            { id: 'a1', type: 'code', title: 'Code 1', content: '', createdAt: 1, createdBy: '' },
            { id: 'a2', type: 'code', title: 'Code 2', content: '', createdAt: 2, createdBy: '' },
            { id: 'a3', type: 'design', title: 'Design 1', content: '', createdAt: 3, createdBy: '' },
          ],
          aiWorkStarted: true,
          aiWorkCompleted: true,
        },
      ],
      aiSettings: {
        enabled: true,
        apiKey: 'test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        providerKeys: {},
      },
    });
    
    render(<ArtifactsPanel />);
    
    expect(screen.getByText('3 total')).toBeInTheDocument();
    expect(screen.getByText('💻 2')).toBeInTheDocument();
    expect(screen.getByText('🎨 1')).toBeInTheDocument();
  });

  it('should expand artifact to show content', () => {
    useGameStore.setState({
      tasks: [
        {
          id: 'task-1',
          title: 'Task',
          description: '',
          type: 'feature',
          status: 'done',
          priority: 'high',
          assigneeId: null,
          estimatedTicks: 10,
          progressTicks: 10,
          createdAt: 0,
          completedAt: 10,
          codeGenerated: null,
          filesCreated: [],
          artifacts: [
            {
              id: 'a1',
              type: 'code',
              title: 'Test.tsx',
              content: 'const test = "hello world";',
              language: 'typescript',
              createdAt: 1,
              createdBy: '',
            },
          ],
          aiWorkStarted: true,
          aiWorkCompleted: true,
        },
      ],
      employees: [],
      aiSettings: {
        enabled: true,
        apiKey: 'test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        providerKeys: {},
      },
    });
    
    render(<ArtifactsPanel />);
    
    // Content should not be visible initially
    expect(screen.queryByText('const test = "hello world";')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText('Test.tsx'));
    
    // Content should now be visible
    expect(screen.getByText('const test = "hello world";')).toBeInTheDocument();
  });
});
