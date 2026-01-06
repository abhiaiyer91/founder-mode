/**
 * Employee Memory Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeMemory } from './EmployeeMemory';
import type { Employee } from '../types';

const createMockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  name: 'Test Engineer',
  role: 'engineer',
  skillLevel: 'mid',
  status: 'idle',
  avatarEmoji: '👨‍💻',
  salary: 8000,
  productivity: 80,
  morale: 75,
  currentTaskId: null,
  hiredAt: 0,
  aiModel: null,
  aiProvider: null,
  memory: [],
  tasksCompleted: 0,
  specializations: [],
  ...overrides,
});

describe('EmployeeMemory', () => {
  it('should render empty state when no memories', () => {
    const employee = createMockEmployee();
    
    render(<EmployeeMemory employee={employee} />);
    
    // Text is in a paragraph element
    expect(screen.getByText(/No experience yet/)).toBeInTheDocument();
  });

  it('should display memories', () => {
    const employee = createMockEmployee({
      memory: [
        {
          id: 'mem-1',
          type: 'task',
          content: 'Completed user authentication feature',
          importance: 0.8,
          createdAt: 100,
          tags: ['auth', 'security'],
        },
      ],
      tasksCompleted: 5,
    });
    
    render(<EmployeeMemory employee={employee} />);
    
    expect(screen.getByText('Completed user authentication feature')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
  });

  it('should display specializations', () => {
    const employee = createMockEmployee({
      specializations: ['auth', 'security', 'backend'],
      tasksCompleted: 10,
    });
    
    render(<EmployeeMemory employee={employee} />);
    
    expect(screen.getByText('Specializations')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
  });

  it('should display tasks completed count', () => {
    const employee = createMockEmployee({
      tasksCompleted: 15,
    });
    
    render(<EmployeeMemory employee={employee} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should show compact version', () => {
    const employee = createMockEmployee({
      tasksCompleted: 8,
      memory: [
        { id: 'm1', type: 'task', content: 'Did something', importance: 0.5, createdAt: 1, tags: [] },
      ],
      specializations: ['frontend'],
    });
    
    render(<EmployeeMemory employee={employee} compact />);
    
    // Compact version shows stats and specializations
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    // But not the full memory list header
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
  });

  it('should show "Show All" button when more than 5 memories', () => {
    const memories = Array.from({ length: 10 }, (_, i) => ({
      id: `mem-${i}`,
      type: 'task' as const,
      content: `Memory ${i}`,
      importance: 0.5,
      createdAt: i,
      tags: [],
    }));
    
    const employee = createMockEmployee({ memory: memories });
    
    render(<EmployeeMemory employee={employee} />);
    
    expect(screen.getByText('Show All (10)')).toBeInTheDocument();
    
    // Should only show 5 memories initially
    expect(screen.getByText('Memory 9')).toBeInTheDocument();
    expect(screen.getByText('Memory 5')).toBeInTheDocument();
    expect(screen.queryByText('Memory 0')).not.toBeInTheDocument();
  });

  it('should toggle showing all memories', () => {
    const memories = Array.from({ length: 10 }, (_, i) => ({
      id: `mem-${i}`,
      type: 'task' as const,
      content: `Memory ${i}`,
      importance: 0.5,
      createdAt: i,
      tags: [],
    }));
    
    const employee = createMockEmployee({ memory: memories });
    
    render(<EmployeeMemory employee={employee} />);
    
    // Click to show all
    fireEvent.click(screen.getByText('Show All (10)'));
    
    // Now all memories should be visible
    expect(screen.getByText('Memory 0')).toBeInTheDocument();
    expect(screen.getByText('Memory 9')).toBeInTheDocument();
    expect(screen.getByText('Show Less')).toBeInTheDocument();
    
    // Click to show less
    fireEvent.click(screen.getByText('Show Less'));
    
    // Back to 5
    expect(screen.queryByText('Memory 0')).not.toBeInTheDocument();
    expect(screen.getByText('Show All (10)')).toBeInTheDocument();
  });

  it('should display different memory types with correct icons', () => {
    const employee = createMockEmployee({
      memory: [
        { id: 'm1', type: 'task', content: 'Task memory', importance: 0.5, createdAt: 1, tags: [] },
        { id: 'm2', type: 'learning', content: 'Learning memory', importance: 0.5, createdAt: 2, tags: [] },
        { id: 'm3', type: 'preference', content: 'Preference memory', importance: 0.5, createdAt: 3, tags: [] },
        { id: 'm4', type: 'context', content: 'Context memory', importance: 0.5, createdAt: 4, tags: [] },
      ],
    });
    
    render(<EmployeeMemory employee={employee} />);
    
    // All memory types should be visible
    expect(screen.getByText('Task memory')).toBeInTheDocument();
    expect(screen.getByText('Learning memory')).toBeInTheDocument();
    expect(screen.getByText('Preference memory')).toBeInTheDocument();
    expect(screen.getByText('Context memory')).toBeInTheDocument();
  });

  it('should show importance indicator', () => {
    const employee = createMockEmployee({
      memory: [
        { id: 'm1', type: 'task', content: 'High importance', importance: 0.9, createdAt: 1, tags: [] },
      ],
    });
    
    render(<EmployeeMemory employee={employee} />);
    
    // Check that importance is rendered (3 dots for 0.9 importance)
    const importanceElement = document.querySelector('.memory-importance');
    expect(importanceElement).toBeInTheDocument();
  });
});
