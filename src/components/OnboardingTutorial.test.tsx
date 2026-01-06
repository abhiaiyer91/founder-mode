/**
 * Tests for OnboardingTutorial component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingTutorial, useResetTutorial } from './OnboardingTutorial';
import { useGameStore } from '../store/gameStore';

// Mock the game store
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('OnboardingTutorial', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useGameStore).mockReturnValue({
      employees: [],
      tasks: [],
      project: { id: '1', name: 'Test Project' },
      screen: 'rts',
    });
  });

  it('renders tutorial popup for new users with a project', () => {
    render(<OnboardingTutorial />);
    
    expect(screen.getByText('Welcome to Founder Mode! 🎮')).toBeInTheDocument();
    expect(screen.getByText(/This quick tutorial/)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<OnboardingTutorial />);
    
    expect(screen.getByText('1 / 7')).toBeInTheDocument();
  });

  it('does not render when no project exists', () => {
    vi.mocked(useGameStore).mockReturnValue({
      employees: [],
      tasks: [],
      project: null,
      screen: 'start',
    });

    render(<OnboardingTutorial />);
    
    expect(screen.queryByText('Welcome to Founder Mode!')).not.toBeInTheDocument();
  });

  it('does not render on landing screen', () => {
    vi.mocked(useGameStore).mockReturnValue({
      employees: [],
      tasks: [],
      project: { id: '1', name: 'Test Project' },
      screen: 'landing',
    });

    render(<OnboardingTutorial />);
    
    expect(screen.queryByText('Welcome to Founder Mode!')).not.toBeInTheDocument();
  });

  it('does not render on start screen', () => {
    vi.mocked(useGameStore).mockReturnValue({
      employees: [],
      tasks: [],
      project: { id: '1', name: 'Test Project' },
      screen: 'start',
    });

    render(<OnboardingTutorial />);
    
    expect(screen.queryByText('Welcome to Founder Mode!')).not.toBeInTheDocument();
  });

  it('advances to next step when clicking Next', () => {
    render(<OnboardingTutorial />);
    
    expect(screen.getByText('1 / 7')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Next →'));
    
    expect(screen.getByText('2 / 7')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Hire Your First Employee')).toBeInTheDocument();
  });

  it('shows Skip Tutorial button', () => {
    render(<OnboardingTutorial />);
    
    expect(screen.getByText('Skip Tutorial')).toBeInTheDocument();
  });

  it('hides tutorial when clicking Skip', () => {
    render(<OnboardingTutorial />);
    
    fireEvent.click(screen.getByText('Skip Tutorial'));
    
    // Tutorial should be hidden
    expect(screen.queryByText('Welcome to Founder Mode! 🎮')).not.toBeInTheDocument();
  });

  it('does not show for users who have completed tutorial', () => {
    localStorage.setItem('founder-mode-tutorial-complete', 'true');
    
    render(<OnboardingTutorial />);
    
    expect(screen.queryByText('Welcome to Founder Mode!')).not.toBeInTheDocument();
  });

  it('shows Get Started button on last step', () => {
    render(<OnboardingTutorial />);
    
    // Navigate to last step
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText('Next →'));
    }
    
    expect(screen.getByText('Get Started!')).toBeInTheDocument();
    expect(screen.getByText("You're Ready! 🚀")).toBeInTheDocument();
  });

  it('completes tutorial when clicking Get Started on last step', () => {
    render(<OnboardingTutorial />);
    
    // Navigate to last step
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText('Next →'));
    }
    
    fireEvent.click(screen.getByText('Get Started!'));
    
    // Tutorial should be hidden
    expect(screen.queryByText("You're Ready! 🚀")).not.toBeInTheDocument();
  });
});

describe('useResetTutorial', () => {
  it('returns a function', () => {
    const resetFn = useResetTutorial();
    expect(typeof resetFn).toBe('function');
  });
});
