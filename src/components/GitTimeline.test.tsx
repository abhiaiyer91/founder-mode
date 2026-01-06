/**
 * Tests for GitTimeline component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitTimeline } from './GitTimeline';
import { useGameStore } from '../store/gameStore';

// Mock the game store
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('GitTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty state', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: null,
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: null,
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('shows empty state when no repo exists', () => {
      render(<GitTimeline />);

      expect(screen.getByText(/Start a project to see git history/i)).toBeInTheDocument();
    });

    it('shows git icon in empty state', () => {
      render(<GitTimeline />);

      expect(screen.getByText('🐙')).toBeInTheDocument();
    });
  });

  describe('With repository but no commits', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [{ name: 'main', isDefault: true, createdAt: Date.now() }],
          commits: [],
          files: new Map(),
          stats: {
            totalCommits: 0,
            totalFiles: 0,
            totalLines: 0,
          },
        },
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test Project' },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('shows no commits message', () => {
      render(<GitTimeline />);

      expect(screen.getByText(/No commits yet/i)).toBeInTheDocument();
    });

    it('shows branch info', () => {
      render(<GitTimeline />);

      expect(screen.getByText('main')).toBeInTheDocument();
    });
  });

  describe('With commits', () => {
    const mockCommits = [
      {
        id: 'commit-1',
        hash: 'abc1234',
        message: 'Add new feature\n\nThis adds a cool feature',
        author: 'Alice Developer',
        authorAvatar: '👩‍💻',
        timestamp: Date.now() - 60000, // 1 minute ago
        branch: 'main',
        files: [
          { path: 'src/feature.ts', action: 'added', additions: 50, deletions: 0 },
        ],
      },
      {
        id: 'commit-2',
        hash: 'def5678',
        message: 'Fix bug',
        author: 'Bob Engineer',
        authorAvatar: '👨‍💻',
        timestamp: Date.now() - 3600000, // 1 hour ago
        branch: 'main',
        files: [
          { path: 'src/fix.ts', action: 'modified', additions: 10, deletions: 5 },
        ],
      },
    ];

    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [{ name: 'main', isDefault: true, createdAt: Date.now() }],
          commits: mockCommits,
          files: new Map(),
          stats: {
            totalCommits: 2,
            totalFiles: 5,
            totalLines: 100,
          },
        },
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test Project' },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('shows commit messages', () => {
      render(<GitTimeline />);

      expect(screen.getByText('Add new feature')).toBeInTheDocument();
      expect(screen.getByText('Fix bug')).toBeInTheDocument();
    });

    it('shows commit hashes', () => {
      render(<GitTimeline />);

      expect(screen.getByText('abc1234')).toBeInTheDocument();
      expect(screen.getByText('def5678')).toBeInTheDocument();
    });

    it('shows author names', () => {
      render(<GitTimeline />);

      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
      expect(screen.getByText('Bob Engineer')).toBeInTheDocument();
    });

    it('shows author avatars', () => {
      render(<GitTimeline />);

      expect(screen.getByText('👩‍💻')).toBeInTheDocument();
      expect(screen.getByText('👨‍💻')).toBeInTheDocument();
    });

    it('shows stats in header', () => {
      render(<GitTimeline />);

      expect(screen.getByText('2')).toBeInTheDocument(); // commits
      expect(screen.getByText('5')).toBeInTheDocument(); // files
      expect(screen.getByText('100')).toBeInTheDocument(); // lines
    });

    it('expands commit details on click', () => {
      render(<GitTimeline />);

      const commitHeader = screen.getByText('Add new feature');
      fireEvent.click(commitHeader);

      // Should show file changes after expansion
      expect(screen.getByText('src/feature.ts')).toBeInTheDocument();
    });

    it('shows additions/deletions', () => {
      render(<GitTimeline />);

      expect(screen.getByText('+50')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('shows relative time', () => {
      render(<GitTimeline />);

      expect(screen.getByText('1m ago')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
    });
  });

  describe('Compact mode', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [{ name: 'main', isDefault: true, createdAt: Date.now() }],
          commits: [
            {
              id: 'commit-1',
              hash: 'abc1234',
              message: 'First commit',
              author: 'Dev',
              authorAvatar: '💻',
              timestamp: Date.now(),
              branch: 'main',
              files: [],
            },
          ],
          files: new Map(),
          stats: { totalCommits: 5, totalFiles: 10, totalLines: 200 },
        },
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test' },
      } as unknown as ReturnType<typeof useGameStore>);
    });

    it('renders in compact mode', () => {
      render(<GitTimeline compact maxCommits={3} />);

      expect(screen.getByText('5 commits')).toBeInTheDocument();
    });

    it('shows branch name in compact mode', () => {
      render(<GitTimeline compact />);

      expect(screen.getByText('main')).toBeInTheDocument();
    });
  });

  describe('GitHub connection', () => {
    it('shows connect button when not connected', () => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [],
          commits: [],
          files: new Map(),
          stats: { totalCommits: 0, totalFiles: 0, totalLines: 0 },
        },
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test' },
      } as unknown as ReturnType<typeof useGameStore>);

      render(<GitTimeline />);

      expect(screen.getByText(/Connect GitHub/i)).toBeInTheDocument();
    });

    it('shows push button when connected', () => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [],
          commits: [],
          files: new Map(),
          stats: { totalCommits: 0, totalFiles: 0, totalLines: 0 },
        },
        gitHubConnection: {
          connected: true,
          username: 'testuser',
          repoName: 'test-repo',
          repoUrl: 'https://github.com/testuser/test-repo',
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test' },
      } as unknown as ReturnType<typeof useGameStore>);

      render(<GitTimeline />);

      expect(screen.getByText(/Push to GitHub/i)).toBeInTheDocument();
    });

    it('shows GitHub status when connected', () => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [],
          commits: [],
          files: new Map(),
          stats: { totalCommits: 0, totalFiles: 0, totalLines: 0 },
        },
        gitHubConnection: {
          connected: true,
          username: 'testuser',
          repoName: 'test-repo',
          repoUrl: 'https://github.com/testuser/test-repo',
          lastPush: Date.now() - 60000,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test' },
      } as unknown as ReturnType<typeof useGameStore>);

      render(<GitTimeline />);

      expect(screen.getByText('testuser/test-repo')).toBeInTheDocument();
      expect(screen.getByText(/Last pushed/i)).toBeInTheDocument();
    });

    it('opens connect modal when connect button clicked', () => {
      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [],
          commits: [],
          files: new Map(),
          stats: { totalCommits: 0, totalFiles: 0, totalLines: 0 },
        },
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test' },
      } as unknown as ReturnType<typeof useGameStore>);

      render(<GitTimeline />);

      const connectBtn = screen.getByText(/Connect GitHub/i);
      fireEvent.click(connectBtn);

      // Modal should appear
      expect(screen.getByText('Connect to GitHub')).toBeInTheDocument();
    });
  });

  describe('maxCommits prop', () => {
    it('limits displayed commits', () => {
      const manyCommits = Array.from({ length: 20 }, (_, i) => ({
        id: `commit-${i}`,
        hash: `hash${i}`,
        message: `Commit ${i}`,
        author: 'Dev',
        authorAvatar: '💻',
        timestamp: Date.now() - i * 1000,
        branch: 'main',
        files: [],
      }));

      vi.mocked(useGameStore).mockReturnValue({
        gitRepo: {
          name: 'test-repo',
          defaultBranch: 'main',
          currentBranch: 'main',
          branches: [],
          commits: manyCommits,
          files: new Map(),
          stats: { totalCommits: 20, totalFiles: 0, totalLines: 0 },
        },
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        pushToGitHub: vi.fn(),
        project: { name: 'Test' },
      } as unknown as ReturnType<typeof useGameStore>);

      render(<GitTimeline maxCommits={5} />);

      // Should show "more commits" message
      expect(screen.getByText(/\+ 15 more commits/i)).toBeInTheDocument();
    });
  });
});
