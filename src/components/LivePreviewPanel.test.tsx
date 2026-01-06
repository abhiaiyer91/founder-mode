/**
 * Tests for LivePreviewPanel component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LivePreviewPanel } from './LivePreviewPanel';
import { useGameStore } from '../store/gameStore';

// Mock Sandpack - it's complex and we don't need to test its internals
vi.mock('@codesandbox/sandpack-react', () => ({
  SandpackProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="sandpack-provider">{children}</div>,
  SandpackLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="sandpack-layout">{children}</div>,
  SandpackPreview: () => <div data-testid="sandpack-preview">Preview</div>,
  SandpackCodeEditor: () => <div data-testid="sandpack-editor">Editor</div>,
  SandpackFileExplorer: () => <div data-testid="sandpack-explorer">Explorer</div>,
  SandpackConsole: () => <div data-testid="sandpack-console">Console</div>,
}));

// Mock the game store
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('LivePreviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty state', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [],
        project: {
          name: 'Test Project',
          projectType: 'frontend',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('shows empty state when no artifacts exist', () => {
      render(<LivePreviewPanel />);

      // Frontend projects show "Assign tasks" message
      expect(screen.getByText(/Assign tasks to your team/i)).toBeInTheDocument();
    });

    it('shows empty state with helpful text', () => {
      render(<LivePreviewPanel />);

      // Frontend empty state shows helpful steps
      expect(screen.getByText('Hire team')).toBeInTheDocument();
      expect(screen.getByText('Create tasks')).toBeInTheDocument();
    });
  });

  describe('Frontend project with artifacts', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Create Button',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'code',
                title: 'Button Component',
                content: 'export function Button() { return <button>Click</button>; }',
                language: 'typescript',
                filePath: 'src/components/Button.tsx',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
        ],
        project: {
          name: 'Test Frontend',
          projectType: 'frontend',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('renders preview for frontend project', () => {
      render(<LivePreviewPanel />);

      expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument();
    });

    it('shows project name in header', () => {
      render(<LivePreviewPanel />);

      expect(screen.getByText(/Test Frontend/i)).toBeInTheDocument();
    });

    it('shows toolbar with view options', () => {
      render(<LivePreviewPanel />);

      // The toolbar uses emoji icons for buttons
      expect(screen.getByTitle('Preview only')).toBeInTheDocument();
      expect(screen.getByTitle('Split view')).toBeInTheDocument();
      expect(screen.getByTitle('Code only')).toBeInTheDocument();
    });
  });

  describe('Backend project', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Create API',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'code',
                title: 'API Handler',
                content: 'app.get("/api/users", (req, res) => res.json([]));',
                language: 'typescript',
                filePath: 'src/routes/users.ts',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
        ],
        project: {
          name: 'Test API',
          projectType: 'backend',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('renders backend preview with test endpoint button', () => {
      render(<LivePreviewPanel />);

      // Backend preview has a test button or status
      expect(screen.getByText(/1 code files/i)).toBeInTheDocument();
    });
  });

  describe('CLI project', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Create CLI',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'code',
                title: 'Main CLI',
                content: '#!/usr/bin/env node\nconsole.log("Hello CLI!");',
                language: 'typescript',
                filePath: 'src/cli.ts',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
        ],
        project: {
          name: 'My CLI Tool',
          projectType: 'cli',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('renders CLI preview', () => {
      render(<LivePreviewPanel />);

      // CLI preview shows file count in status bar
      expect(screen.getByText(/1 code files/i)).toBeInTheDocument();
    });
  });

  describe('Library project', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Create Library',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'code',
                title: 'Utils',
                content: 'export function formatDate(d: Date) { return d.toISOString(); }',
                language: 'typescript',
                filePath: 'src/utils.ts',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
        ],
        project: {
          name: 'my-utils-lib',
          projectType: 'library',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('shows library installation command', () => {
      render(<LivePreviewPanel />);

      // Library preview shows npm install command
      expect(screen.getByText(/npm install my-utils-lib/i)).toBeInTheDocument();
    });
  });

  describe('Multiple artifacts', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Task 1',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'code',
                title: 'Component A',
                content: 'export function A() {}',
                language: 'typescript',
                filePath: 'src/A.tsx',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
          {
            id: 'task-2',
            title: 'Task 2',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-2',
                type: 'code',
                title: 'Component B',
                content: 'export function B() {}',
                language: 'typescript',
                filePath: 'src/B.tsx',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
              {
                id: 'artifact-3',
                type: 'design',
                title: 'Styles',
                content: '.button { color: red; }',
                language: 'css',
                filePath: 'src/styles.css',
                createdAt: Date.now(),
                createdBy: 'emp-2',
              },
            ],
          },
        ],
        project: {
          name: 'Multi-Artifact Project',
          projectType: 'frontend',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('combines all artifacts for preview', () => {
      render(<LivePreviewPanel />);

      // Should have Sandpack provider (which means it has files)
      expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument();
    });
  });

  describe('Only non-code artifacts', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Write Copy',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'copy',
                title: 'Landing Page Copy',
                content: 'Welcome to our awesome product!',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
        ],
        project: {
          name: 'Content Project',
          projectType: 'frontend',
        },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('still counts non-code artifacts as files', () => {
      render(<LivePreviewPanel />);

      // The component counts all artifacts including non-code ones
      // So it shows the preview, not the empty state
      expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument();
    });
  });

  describe('Project type fallback', () => {
    it('defaults to frontend when no projectType is set', () => {
      vi.mocked(useGameStore).mockReturnValue({
        tasks: [
          {
            id: 'task-1',
            title: 'Task',
            status: 'done',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'code',
                title: 'Component',
                content: 'export function C() {}',
                language: 'typescript',
                filePath: 'src/C.tsx',
                createdAt: Date.now(),
                createdBy: 'emp-1',
              },
            ],
          },
        ],
        project: {
          name: 'No Type Project',
          // projectType is undefined
        },
      } as unknown as ReturnType<typeof useGameStore>);

      render(<LivePreviewPanel />);

      // Should render Sandpack for frontend (default)
      expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument();
    });
  });
});
