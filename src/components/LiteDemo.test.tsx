/**
 * Tests for LiteDemo component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LiteDemo } from './LiteDemo';

describe('LiteDemo', () => {
  const mockOnStartGame = vi.fn();

  beforeEach(() => {
    mockOnStartGame.mockReset();
  });

  it('renders the demo with tutorial banner', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText(/Try the game right here/)).toBeInTheDocument();
  });

  it('shows hire button in team panel', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText('+ Hire')).toBeInTheDocument();
  });

  it('shows empty team state initially', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText(/Click "Hire" to add employees/)).toBeInTheDocument();
  });

  it('shows initial tasks', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText('Build login page')).toBeInTheDocument();
    expect(screen.getByText('Design dashboard')).toBeInTheDocument();
    expect(screen.getByText('Fix auth bug')).toBeInTheDocument();
  });

  it('opens hire menu when clicking hire button', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    const hireBtn = screen.getByText('+ Hire');
    fireEvent.click(hireBtn);
    
    expect(screen.getByText('Alex Chen')).toBeInTheDocument();
    expect(screen.getByText('Sam Rivera')).toBeInTheDocument();
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  });

  it('hires an employee when clicking on them', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    // Open hire menu
    fireEvent.click(screen.getByText('+ Hire'));
    
    // Hire Alex Chen
    fireEvent.click(screen.getByText('Alex Chen'));
    
    // Should see notification and employee in team
    expect(screen.getByText(/Alex Chen joined/)).toBeInTheDocument();
    expect(screen.queryByText(/Click "Hire" to add employees/)).not.toBeInTheDocument();
  });

  it('shows Start Full Game button', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText('Start Full Game →')).toBeInTheDocument();
  });

  it('calls onStartGame when clicking Start Full Game', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    fireEvent.click(screen.getByText('Start Full Game →'));
    
    expect(mockOnStartGame).toHaveBeenCalledTimes(1);
  });

  it('shows reset button', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText('↺ Reset Demo')).toBeInTheDocument();
  });

  it('resets demo when clicking reset', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    // First hire someone
    fireEvent.click(screen.getByText('+ Hire'));
    fireEvent.click(screen.getByText('Alex Chen'));
    
    // Now reset
    fireEvent.click(screen.getByText('↺ Reset Demo'));
    
    // Should be back to empty team
    expect(screen.getByText(/Click "Hire" to add employees/)).toBeInTheDocument();
  });

  it('shows money and task counts', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText('💰 $50,000')).toBeInTheDocument();
    expect(screen.getByText('✅ 0/3')).toBeInTheDocument();
  });

  it('decreases money when hiring', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    // Hire Alex Chen (costs $8000)
    fireEvent.click(screen.getByText('+ Hire'));
    fireEvent.click(screen.getByText('Alex Chen'));
    
    expect(screen.getByText('💰 $42,000')).toBeInTheDocument();
  });

  it('advances tutorial step when hiring first employee', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    // Initially on step 1
    expect(screen.getByText('1/5')).toBeInTheDocument();
    
    // Hire employee
    fireEvent.click(screen.getByText('+ Hire'));
    fireEvent.click(screen.getByText('Alex Chen'));
    
    // Should advance to step 2
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('shows empty code state initially', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    expect(screen.getByText(/Assign tasks to see AI-generated code/)).toBeInTheDocument();
  });

  it('allows selecting an idle employee', () => {
    render(<LiteDemo onStartGame={mockOnStartGame} />);
    
    // Hire employee
    fireEvent.click(screen.getByText('+ Hire'));
    fireEvent.click(screen.getByText('Alex Chen'));
    
    // Click on the employee to select
    const employeeCard = screen.getByText('Alex Chen').closest('.employee-card');
    fireEvent.click(employeeCard!);
    
    // Should show assign hints on all todo tasks (multiple)
    const assignHints = screen.getAllByText('Click to assign');
    expect(assignHints.length).toBe(3); // All 3 tasks should show the hint
  });
});
