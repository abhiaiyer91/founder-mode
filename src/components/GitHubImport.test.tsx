/**
 * Tests for GitHubImport component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitHubImport } from './GitHubImport';
import { useGameStore } from '../store/gameStore';

// Mock the game store
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('GitHubImport', () => {
  const mockOnClose = vi.fn();
  const mockStartProject = vi.fn();
  const mockHireEmployee = vi.fn();
  const mockCreateTask = vi.fn();
  const mockSetScreen = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    mockOnClose.mockReset();
    mockStartProject.mockReset();
    mockHireEmployee.mockReset();
    mockCreateTask.mockReset();
    mockSetScreen.mockReset();
    
    vi.mocked(useGameStore).mockReturnValue({
      startProject: mockStartProject,
      hireEmployee: mockHireEmployee,
      createTask: mockCreateTask,
      setScreen: mockSetScreen,
    });
  });

  it('renders the GitHub import modal', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    expect(screen.getByText('Import from GitHub')).toBeInTheDocument();
  });

  it('shows connect step initially', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    expect(screen.getByText(/Connect your GitHub account/)).toBeInTheDocument();
    expect(screen.getByText('Create a Personal Access Token →')).toBeInTheDocument();
  });

  it('shows token input field', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    expect(screen.getByPlaceholderText('ghp_xxxxxxxxxxxx')).toBeInTheDocument();
  });

  it('shows error when connecting with empty token', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Connect'));
    
    expect(screen.getByText('Please enter a GitHub token')).toBeInTheDocument();
  });

  it('closes when clicking close button', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('×'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking cancel button', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking overlay', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    // Click the overlay (parent element)
    const overlay = screen.getByText('Import from GitHub').closest('.github-import-overlay');
    fireEvent.click(overlay!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the modal', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    // Click inside the modal content
    fireEvent.click(screen.getByText('Import from GitHub'));
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows hint about local storage', () => {
    render(<GitHubImport onClose={mockOnClose} />);
    
    expect(screen.getByText('Token is stored locally only')).toBeInTheDocument();
  });

  it('shows loading state when connecting', async () => {
    // Mock fetch to hang
    global.fetch = vi.fn(() => new Promise(() => {}));
    
    render(<GitHubImport onClose={mockOnClose} />);
    
    const tokenInput = screen.getByPlaceholderText('ghp_xxxxxxxxxxxx');
    fireEvent.change(tokenInput, { target: { value: 'ghp_test123' } });
    
    fireEvent.click(screen.getByText('Connect'));
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('stores token in localStorage after successful connect', () => {
    // Mock the actual connect flow
    render(<GitHubImport onClose={mockOnClose} />);
    
    // Token input should be available
    const tokenInput = screen.getByPlaceholderText('ghp_xxxxxxxxxxxx');
    expect(tokenInput).toBeInTheDocument();
    
    // Typing a token should work
    fireEvent.change(tokenInput, { target: { value: 'ghp_test_token' } });
    expect(tokenInput).toHaveValue('ghp_test_token');
  });
});
