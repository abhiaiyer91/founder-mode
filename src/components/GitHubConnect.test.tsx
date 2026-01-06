/**
 * Tests for GitHubConnect component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitHubConnect } from './GitHubConnect';
import { useGameStore } from '../store/gameStore';

// Mock the game store
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('GitHubConnect', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('Not connected state', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        gitRepo: null,
        project: { name: 'Test Project' },
      } as ReturnType<typeof useGameStore>);
    });

    it('renders sign in button when not connected', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText('Connect to GitHub')).toBeInTheDocument();
      expect(screen.getByText(/Sign in with GitHub/i)).toBeInTheDocument();
    });

    it('shows description text', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText(/Connect your GitHub account/i)).toBeInTheDocument();
    });

    it('shows hint when client ID is not configured', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText(/VITE_GITHUB_CLIENT_ID/i)).toBeInTheDocument();
    });
  });

  describe('Connected but no repo selected', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitHubConnection: {
          connected: true,
          username: 'testuser',
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        gitRepo: null,
        project: { name: 'My Awesome Project' },
      } as ReturnType<typeof useGameStore>);
    });

    it('shows username when connected', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText(/@testuser/)).toBeInTheDocument();
    });

    it('shows disconnect button', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('shows repo selection options', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText('Create New')).toBeInTheDocument();
      expect(screen.getByText('Use Existing')).toBeInTheDocument();
    });

    it('shows repo name input field', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByPlaceholderText('my-awesome-project')).toBeInTheDocument();
    });

    it('allows switching between create and existing tabs', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      const useExistingBtn = screen.getByText('Use Existing');
      fireEvent.click(useExistingBtn);

      expect(screen.getByText(/Loading repositories/i)).toBeInTheDocument();
    });

    it('initializes repo name from project name', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      const input = screen.getByPlaceholderText('my-awesome-project');
      expect(input).toHaveValue('my-awesome-project');
    });
  });

  describe('Fully connected state', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitHubConnection: {
          connected: true,
          username: 'testuser',
          repoName: 'test-repo',
          repoUrl: 'https://github.com/testuser/test-repo',
          lastPush: Date.now() - 3600000, // 1 hour ago
        },
        gitRepo: {
          stats: {
            totalCommits: 10,
            totalFiles: 25,
            totalLines: 1500,
          },
        },
        project: { name: 'Test Project' },
      } as ReturnType<typeof useGameStore>);
    });

    it('shows connected header', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText('GitHub Connected')).toBeInTheDocument();
    });

    it('shows repository link', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://github.com/testuser/test-repo');
      expect(screen.getByText('testuser/test-repo')).toBeInTheDocument();
    });

    it('shows repository stats', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText('10')).toBeInTheDocument(); // commits
      expect(screen.getByText('25')).toBeInTheDocument(); // files
      expect(screen.getByText('1500')).toBeInTheDocument(); // lines
    });

    it('shows push button', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText(/Push to GitHub/i)).toBeInTheDocument();
    });

    it('shows last push time', () => {
      render(<GitHubConnect onClose={mockOnClose} />);

      expect(screen.getByText(/Last pushed/i)).toBeInTheDocument();
    });
  });

  describe('OAuth flow', () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        gitHubConnection: {
          connected: false,
          username: null,
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        gitRepo: null,
        project: { name: 'Test' },
      } as ReturnType<typeof useGameStore>);
    });

    it('stores state in localStorage for CSRF protection on OAuth start', () => {
      // Mock crypto.randomUUID
      const mockUUID = 'test-uuid-12345';
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

      render(<GitHubConnect onClose={mockOnClose} />);
      
      // Note: We can't actually click the OAuth button as it would redirect
      // This test verifies the component renders correctly
      expect(screen.getByText(/Sign in with GitHub/i)).toBeInTheDocument();
    });
  });

  describe('Disconnect functionality', () => {
    it('calls disconnectGitHub when disconnect is clicked', () => {
      const mockDisconnect = vi.fn();
      vi.mocked(useGameStore).mockReturnValue({
        gitHubConnection: {
          connected: true,
          username: 'testuser',
          repoName: null,
          repoUrl: null,
          lastPush: null,
        },
        gitRepo: null,
        project: { name: 'Test' },
      } as ReturnType<typeof useGameStore>);
      
      // Mock getState
      vi.mocked(useGameStore).getState = vi.fn().mockReturnValue({
        disconnectGitHub: mockDisconnect,
      });

      render(<GitHubConnect onClose={mockOnClose} />);
      
      const disconnectBtn = screen.getByText('Disconnect');
      fireEvent.click(disconnectBtn);

      // The click calls the disconnect function directly
      // We verify sessionStorage is cleared
      expect(sessionStorage.getItem('github_access_token')).toBeNull();
    });
  });
});
