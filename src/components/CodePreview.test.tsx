/**
 * Tests for CodePreview component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodePreview } from './CodePreview';
import { useGameStore } from '../store/gameStore';

// Mock the game store
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

// Mock Sandpack to avoid complexity in tests
vi.mock('@codesandbox/sandpack-react', () => ({
  SandpackProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="sandpack-provider">{children}</div>,
  SandpackLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="sandpack-layout">{children}</div>,
  SandpackPreview: () => <div data-testid="sandpack-preview">Preview</div>,
  SandpackCodeEditor: () => <div data-testid="sandpack-editor">Editor</div>,
  SandpackConsole: () => <div data-testid="sandpack-console">Console</div>,
}));

describe('CodePreview', () => {
  beforeEach(() => {
    vi.mocked(useGameStore).mockReturnValue({
      tasks: [],
      project: { id: '1', name: 'Test Project' },
    });
  });

  it('renders empty state when no artifacts', () => {
    render(<CodePreview />);
    
    expect(screen.getByText('No Code Yet')).toBeInTheDocument();
    expect(screen.getByText(/Assign tasks to your team/)).toBeInTheDocument();
  });

  it('shows building icon in empty state', () => {
    render(<CodePreview />);
    
    expect(screen.getByText('🏗️')).toBeInTheDocument();
  });

  it('renders Sandpack when there are artifacts', () => {
    vi.mocked(useGameStore).mockReturnValue({
      tasks: [{
        id: 't1',
        title: 'Test Task',
        artifacts: [{
          id: 'a1',
          type: 'code',
          title: 'LoginForm',
          content: 'export function LoginForm() { return <div>Login</div>; }',
          language: 'tsx',
          createdAt: Date.now(),
          createdBy: 'e1',
        }],
      }],
      project: { id: '1', name: 'Test Project' },
    });

    render(<CodePreview />);
    
    expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument();
  });

  it('shows file count when there are artifacts', () => {
    vi.mocked(useGameStore).mockReturnValue({
      tasks: [{
        id: 't1',
        title: 'Test Task',
        artifacts: [{
          id: 'a1',
          type: 'code',
          title: 'Component1',
          content: 'export function C1() {}',
          language: 'tsx',
          createdAt: Date.now(),
          createdBy: 'e1',
        }, {
          id: 'a2',
          type: 'code',
          title: 'Component2',
          content: 'export function C2() {}',
          language: 'tsx',
          createdAt: Date.now(),
          createdBy: 'e1',
        }],
      }],
      project: { id: '1', name: 'Test Project' },
    });

    render(<CodePreview />);
    
    expect(screen.getByText('2 files')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    vi.mocked(useGameStore).mockReturnValue({
      tasks: [{
        id: 't1',
        title: 'Test Task',
        artifacts: [{
          id: 'a1',
          type: 'code',
          title: 'Test',
          content: 'export function Test() {}',
          language: 'tsx',
          createdAt: Date.now(),
          createdBy: 'e1',
        }],
      }],
      project: { id: '1', name: 'Test Project' },
    });

    render(<CodePreview compact />);
    
    expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument();
    // Compact mode should not show tabs
    expect(screen.queryByText('👁️ Preview')).not.toBeInTheDocument();
  });

  it('shows preview tab by default', () => {
    vi.mocked(useGameStore).mockReturnValue({
      tasks: [{
        id: 't1',
        title: 'Test Task',
        artifacts: [{
          id: 'a1',
          type: 'code',
          title: 'Test',
          content: 'export function Test() {}',
          language: 'tsx',
          createdAt: Date.now(),
          createdBy: 'e1',
        }],
      }],
      project: { id: '1', name: 'Test Project' },
    });

    render(<CodePreview showEditor showConsole />);
    
    expect(screen.getByText('👁️ Preview')).toBeInTheDocument();
    expect(screen.getByText('📝 Code')).toBeInTheDocument();
    expect(screen.getByText('🖥️ Console')).toBeInTheDocument();
  });

  it('uses custom height when provided', () => {
    render(<CodePreview height="600px" />);
    
    const container = screen.getByText('No Code Yet').closest('.code-preview-empty');
    expect(container).toHaveStyle({ height: '600px' });
  });
});
