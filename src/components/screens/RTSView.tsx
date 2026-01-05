/**
 * RTS View - Isometric game view like Civ/Warcraft
 * 
 * Features:
 * - Isometric grid representing the office
 * - Animated unit sprites (employees)
 * - Buildings (departments)
 * - Selection box for multi-select
 * - Mini-map
 * - Resource bar
 * - Command panel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Employee, Task } from '../../types';
import './RTSView.css';

// Isometric constants
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const GRID_SIZE = 12;

// Building definitions with unlock requirements
const BUILDINGS: Record<string, { 
  x: number; 
  y: number; 
  w: number; 
  h: number; 
  emoji: string; 
  label: string;
  role?: string;
  unlockReq?: { money?: number; employees?: number; tasks?: number };
}> = {
  engineering: { x: 2, y: 2, w: 3, h: 2, emoji: '🏗️', label: 'Engineering', role: 'engineer' },
  design: { x: 7, y: 2, w: 2, h: 2, emoji: '🎨', label: 'Design Studio', role: 'designer', unlockReq: { employees: 1 } },
  marketing: { x: 2, y: 6, w: 2, h: 2, emoji: '📢', label: 'Marketing', role: 'marketer', unlockReq: { money: 20000 } },
  pm: { x: 6, y: 6, w: 2, h: 2, emoji: '📋', label: 'Product', role: 'pm', unlockReq: { employees: 2 } },
  lounge: { x: 9, y: 5, w: 2, h: 2, emoji: '☕', label: 'Break Room', unlockReq: { employees: 3 } },
  server: { x: 10, y: 1, w: 1, h: 1, emoji: '🖥️', label: 'Servers', unlockReq: { tasks: 5 } },
};

// Check if building is unlocked
function isBuildingUnlocked(
  _buildingId: string, 
  building: typeof BUILDINGS[string],
  stats: { money: number; employeeCount: number; taskCount: number; roleEmployees: Record<string, number> }
): boolean {
  // Always unlocked if has employees of that role
  if (building.role && stats.roleEmployees[building.role] > 0) return true;
  
  // Check unlock requirements
  if (!building.unlockReq) return true;
  
  const { money, employees, tasks } = building.unlockReq;
  if (money && stats.money < money) return false;
  if (employees && stats.employeeCount < employees) return false;
  if (tasks && stats.taskCount < tasks) return false;
  
  return true;
}

// Convert grid to screen position (isometric)
function gridToScreen(x: number, y: number): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_WIDTH / 2) + 400,
    y: (x + y) * (TILE_HEIGHT / 2) + 100,
  };
}

// Unit sprite component
function UnitSprite({ 
  employee, 
  position, 
  isSelected, 
  onClick,
  task,
}: { 
  employee: Employee;
  position: { x: number; y: number };
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  task?: Task;
}) {
  const roleEmoji: Record<string, string> = {
    engineer: '👩‍💻',
    designer: '🎨',
    marketer: '📣',
    pm: '📊',
  };

  const statusColor = employee.status === 'working' 
    ? '#4ade80' 
    : employee.status === 'blocked' 
      ? '#f87171' 
      : '#888';

  return (
    <div 
      className={`rts-unit ${isSelected ? 'selected' : ''} ${employee.status}`}
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: Math.floor(position.y),
      }}
      onClick={onClick}
    >
      {/* Selection ring */}
      {isSelected && <div className="selection-ring" />}
      
      {/* Health/morale bar */}
      <div className="unit-bar">
        <div 
          className="unit-bar-fill" 
          style={{ 
            width: `${employee.morale}%`,
            background: employee.morale > 60 ? '#4ade80' : employee.morale > 30 ? '#fbbf24' : '#f87171'
          }} 
        />
      </div>
      
      {/* Unit sprite */}
      <div className="unit-sprite">
        <span className="unit-emoji">{roleEmoji[employee.role] || '👤'}</span>
        {employee.status === 'working' && (
          <div className="working-indicator">
            <span className="work-dot">.</span>
            <span className="work-dot">.</span>
            <span className="work-dot">.</span>
          </div>
        )}
      </div>
      
      {/* Unit name */}
      <div className="unit-name" style={{ color: statusColor }}>
        {employee.name.split(' ')[0]}
      </div>
      
      {/* Task indicator */}
      {task && (
        <div className="unit-task">
          <div className="task-progress-mini">
            <div 
              className="task-progress-fill" 
              style={{ width: `${Math.round((task.progressTicks / task.estimatedTicks) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Building component
function Building({ 
  building, 
  employeeCount,
  isActive,
  isUnlocked,
  unlockHint,
  onClick,
}: { 
  building: typeof BUILDINGS[string];
  employeeCount: number;
  isActive: boolean;
  isUnlocked: boolean;
  unlockHint?: string;
  onClick: () => void;
}) {
  const pos = gridToScreen(building.x + building.w / 2, building.y + building.h / 2);
  
  return (
    <div 
      className={`rts-building ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
      style={{ 
        left: pos.x - (building.w * TILE_WIDTH) / 4,
        top: pos.y - building.h * TILE_HEIGHT,
        width: building.w * TILE_WIDTH / 2,
        zIndex: Math.floor(pos.y) - 10,
      }}
      onClick={isUnlocked ? onClick : undefined}
    >
      {/* Fog of war overlay */}
      {!isUnlocked && (
        <div className="fog-overlay">
          <span className="fog-icon">🔒</span>
          {unlockHint && <span className="fog-hint">{unlockHint}</span>}
        </div>
      )}
      
      <div className="building-sprite">
        <span className="building-emoji">{building.emoji}</span>
        {employeeCount > 0 && (
          <span className="building-count">{employeeCount}</span>
        )}
      </div>
      <div className="building-label">{building.label}</div>
      {isActive && <div className="building-glow" />}
    </div>
  );
}

// Minimap component
function Minimap({ 
  employees, 
  selectedIds,
  onSelectUnit,
}: { 
  employees: Employee[];
  selectedIds: string[];
  onSelectUnit: (id: string) => void;
}) {
  return (
    <div className="rts-minimap">
      <div className="minimap-title">MINIMAP</div>
      <div className="minimap-grid">
        {/* Buildings on minimap */}
        {Object.entries(BUILDINGS).map(([id, building]) => (
          <div
            key={id}
            className="minimap-building"
            style={{
              left: `${(building.x / GRID_SIZE) * 100}%`,
              top: `${(building.y / GRID_SIZE) * 100}%`,
              width: `${(building.w / GRID_SIZE) * 100}%`,
              height: `${(building.h / GRID_SIZE) * 100}%`,
            }}
          />
        ))}
        
        {/* Units on minimap */}
        {employees.map((emp, i) => {
          const building = Object.values(BUILDINGS).find(b => b.role === emp.role);
          const x = building ? building.x + 1 + (i % 2) : 5;
          const y = building ? building.y + 1 + Math.floor(i / 2) * 0.5 : 5;
          
          return (
            <div
              key={emp.id}
              className={`minimap-unit ${selectedIds.includes(emp.id) ? 'selected' : ''} ${emp.status}`}
              style={{
                left: `${(x / GRID_SIZE) * 100}%`,
                top: `${(y / GRID_SIZE) * 100}%`,
              }}
              onClick={() => onSelectUnit(emp.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Command panel
function CommandPanel({
  selectedUnits,
  onCommand,
}: {
  selectedUnits: Employee[];
  onCommand: (cmd: string) => void;
}) {
  const hasSelected = selectedUnits.length > 0;
  
  return (
    <div className="rts-command-panel">
      <div className="command-section unit-info">
        {hasSelected ? (
          <>
            <div className="selected-count">
              {selectedUnits.length} unit{selectedUnits.length !== 1 ? 's' : ''} selected
            </div>
            <div className="selected-list">
              {selectedUnits.slice(0, 4).map(emp => (
                <div key={emp.id} className="selected-unit-icon">
                  {emp.role === 'engineer' ? '👩‍💻' : 
                   emp.role === 'designer' ? '🎨' : 
                   emp.role === 'marketer' ? '📣' : '📊'}
                </div>
              ))}
              {selectedUnits.length > 4 && (
                <div className="more-selected">+{selectedUnits.length - 4}</div>
              )}
            </div>
          </>
        ) : (
          <div className="no-selection">Click units or drag to select</div>
        )}
      </div>
      
      <div className="command-section commands">
        <button 
          className="cmd-btn" 
          onClick={() => onCommand('work')}
          disabled={!hasSelected}
        >
          <span className="cmd-icon">⚒️</span>
          <span className="cmd-label">Work</span>
          <span className="cmd-hotkey">W</span>
        </button>
        <button 
          className="cmd-btn" 
          onClick={() => onCommand('break')}
          disabled={!hasSelected}
        >
          <span className="cmd-icon">☕</span>
          <span className="cmd-label">Break</span>
          <span className="cmd-hotkey">B</span>
        </button>
        <button 
          className="cmd-btn" 
          onClick={() => onCommand('boost')}
          disabled={!hasSelected}
        >
          <span className="cmd-icon">⚡</span>
          <span className="cmd-label">Boost</span>
          <span className="cmd-hotkey">V</span>
        </button>
        <button 
          className="cmd-btn" 
          onClick={() => onCommand('assign')}
          disabled={!hasSelected}
        >
          <span className="cmd-icon">📋</span>
          <span className="cmd-label">Assign</span>
          <span className="cmd-hotkey">A</span>
        </button>
      </div>
      
      <div className="command-section global-commands">
        <button className="cmd-btn" onClick={() => onCommand('hire')}>
          <span className="cmd-icon">➕</span>
          <span className="cmd-label">Hire</span>
          <span className="cmd-hotkey">H</span>
        </button>
        <button className="cmd-btn" onClick={() => onCommand('tasks')}>
          <span className="cmd-icon">📥</span>
          <span className="cmd-label">Tasks</span>
          <span className="cmd-hotkey">T</span>
        </button>
        <button className="cmd-btn" onClick={() => onCommand('tech')}>
          <span className="cmd-icon">🔬</span>
          <span className="cmd-label">Tech</span>
          <span className="cmd-hotkey">U</span>
        </button>
      </div>
    </div>
  );
}

// Resource bar
function ResourceBar({ 
  money, 
  runway, 
  taskCounts,
  time,
}: { 
  money: number;
  runway: number;
  taskCounts: { pending: number; active: number; review: number; completed: number };
  time: number;
}) {
  const hours = Math.floor((time % 720) / 30);
  const days = Math.floor(time / 720);
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return (
    <div className="rts-resource-bar">
      <div className="resource-group">
        <div className="resource">
          <span className="resource-icon">💰</span>
          <span className="resource-value">${(money / 1000).toFixed(0)}k</span>
        </div>
        <div className="resource">
          <span className="resource-icon">📅</span>
          <span className={`resource-value ${runway < 3 ? 'danger' : runway < 6 ? 'warning' : ''}`}>
            {runway.toFixed(1)}mo
          </span>
        </div>
      </div>
      
      <div className="resource-group tasks">
        <div className="resource">
          <span className="resource-icon">📋</span>
          <span className="resource-value">{taskCounts.pending}</span>
        </div>
        <span className="resource-arrow">→</span>
        <div className="resource">
          <span className="resource-icon">⚙️</span>
          <span className="resource-value">{taskCounts.active}</span>
        </div>
        <span className="resource-arrow">→</span>
        <div className="resource">
          <span className="resource-icon">👀</span>
          <span className="resource-value">{taskCounts.review}</span>
        </div>
        <span className="resource-arrow">→</span>
        <div className="resource">
          <span className="resource-icon">✅</span>
          <span className="resource-value">{taskCounts.completed}</span>
        </div>
      </div>
      
      <div className="resource-group time">
        <div className="resource time-display">
          <span className="resource-icon">🕐</span>
          <span className="resource-value">Day {days + 1} • {displayHour}:00 {period}</span>
        </div>
      </div>
    </div>
  );
}

// Selection box component
function SelectionBox({ 
  start, 
  current 
}: { 
  start: { x: number; y: number }; 
  current: { x: number; y: number }; 
}) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  
  return (
    <div 
      className="selection-box"
      style={{ left, top, width, height }}
    />
  );
}

// Main RTS View
export function RTSView() {
  const { 
    employees, 
    tasks, 
    money, 
    selectedEmployeeIds,
    selectEmployees,
    boostMorale,
    setScreen,
    tick,
    project,
  } = useGameStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const [unitPositions, setUnitPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  
  // Calculate runway
  const monthlyBurn = employees.reduce((sum, e) => sum + e.salary, 0);
  const runway = monthlyBurn > 0 ? money / monthlyBurn : 99;
  
  // Task counts
  const taskCounts = {
    pending: tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length,
    active: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'done').length,
  };
  
  // Selected employees
  const selectedUnits = employees.filter(e => selectedEmployeeIds.includes(e.id));
  
  // Stats for fog of war
  const roleEmployees: Record<string, number> = {};
  employees.forEach(e => {
    roleEmployees[e.role] = (roleEmployees[e.role] || 0) + 1;
  });
  const unlockStats = {
    money,
    employeeCount: employees.length,
    taskCount: tasks.length,
    roleEmployees,
  };
  
  // Generate unlock hints
  const getUnlockHint = (building: typeof BUILDINGS[string]): string => {
    if (!building.unlockReq) return '';
    const { money: reqMoney, employees: reqEmps, tasks: reqTasks } = building.unlockReq;
    if (reqMoney) return `$${reqMoney.toLocaleString()}`;
    if (reqEmps) return `${reqEmps} employees`;
    if (reqTasks) return `${reqTasks} tasks`;
    return '';
  };
  
  // Initialize and update unit positions
  useEffect(() => {
    const newPositions = new Map<string, { x: number; y: number }>();
    
    employees.forEach((emp, i) => {
      const building = Object.values(BUILDINGS).find(b => b.role === emp.role);
      if (building) {
        const offsetX = (i % 3) * 0.8;
        const offsetY = Math.floor(i / 3) * 0.6;
        const pos = gridToScreen(
          building.x + 0.5 + offsetX, 
          building.y + building.h + 0.3 + offsetY
        );
        newPositions.set(emp.id, pos);
      } else {
        // Lounge for breaks
        const lounge = BUILDINGS.lounge;
        const pos = gridToScreen(
          lounge.x + Math.random() * lounge.w,
          lounge.y + Math.random() * lounge.h
        );
        newPositions.set(emp.id, pos);
      }
    });
    
    setUnitPositions(newPositions);
  }, [employees]);
  
  // Handle mouse events for selection box
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('iso-floor')) {
      const rect = containerRef.current!.getBoundingClientRect();
      setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setSelectionCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectionStart && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSelectionCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [selectionStart]);
  
  const handleMouseUp = useCallback(() => {
    if (selectionStart && selectionCurrent) {
      const left = Math.min(selectionStart.x, selectionCurrent.x);
      const right = Math.max(selectionStart.x, selectionCurrent.x);
      const top = Math.min(selectionStart.y, selectionCurrent.y);
      const bottom = Math.max(selectionStart.y, selectionCurrent.y);
      
      // Check if box is big enough to be a selection
      if (right - left > 10 && bottom - top > 10) {
        const selectedIds = employees
          .filter(emp => {
            const pos = unitPositions.get(emp.id);
            if (!pos) return false;
            return pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom;
          })
          .map(e => e.id);
        
        selectEmployees(selectedIds);
      }
    }
    setSelectionStart(null);
    setSelectionCurrent(null);
  }, [selectionStart, selectionCurrent, employees, unitPositions, selectEmployees]);
  
  // Handle unit click
  const handleUnitClick = useCallback((emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      if (selectedEmployeeIds.includes(emp.id)) {
        selectEmployees(selectedEmployeeIds.filter(id => id !== emp.id));
      } else {
        selectEmployees([...selectedEmployeeIds, emp.id]);
      }
    } else {
      // Single select
      selectEmployees([emp.id]);
    }
  }, [selectedEmployeeIds, selectEmployees]);
  
  // Handle commands
  const handleCommand = useCallback((cmd: string) => {
    switch (cmd) {
      case 'boost':
        boostMorale();
        break;
      case 'hire':
        setScreen('hire');
        break;
      case 'tasks':
        setScreen('queue');
        break;
      case 'tech':
        setScreen('tech');
        break;
      case 'assign':
        setScreen('tasks');
        break;
    }
  }, [boostMorale, setScreen]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'h':
          handleCommand('hire');
          break;
        case 't':
          handleCommand('tasks');
          break;
        case 'u':
          handleCommand('tech');
          break;
        case 'v':
          handleCommand('boost');
          break;
        case 'a':
          handleCommand('assign');
          break;
        case 'escape':
          selectEmployees([]);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCommand, selectEmployees]);
  
  return (
    <div className="rts-view">
      <ResourceBar 
        money={money} 
        runway={runway} 
        taskCounts={taskCounts}
        time={tick}
      />
      
      <div 
        className="rts-viewport"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Isometric floor grid */}
        <div className="iso-floor">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const pos = gridToScreen(x, y);
            return (
              <div 
                key={i}
                className="iso-tile"
                style={{
                  left: pos.x - TILE_WIDTH / 2,
                  top: pos.y,
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                }}
              />
            );
          })}
        </div>
        
        {/* Buildings */}
        {Object.entries(BUILDINGS).map(([id, building]) => {
          const isUnlocked = isBuildingUnlocked(id, building, unlockStats);
          return (
            <Building
              key={id}
              building={building}
              employeeCount={employees.filter(e => e.role === building.role).length}
              isActive={employees.some(e => e.role === building.role && e.status === 'working')}
              isUnlocked={isUnlocked}
              unlockHint={!isUnlocked ? getUnlockHint(building) : undefined}
              onClick={() => {
                const roleEmps = employees.filter(e => e.role === building.role);
                selectEmployees(roleEmps.map(e => e.id));
              }}
            />
          );
        })}
        
        {/* Units (employees) */}
        {employees.map(emp => {
          const pos = unitPositions.get(emp.id);
          if (!pos) return null;
          
          const task = tasks.find(t => t.assigneeId === emp.id && t.status === 'in_progress');
          
          return (
            <UnitSprite
              key={emp.id}
              employee={emp}
              position={pos}
              isSelected={selectedEmployeeIds.includes(emp.id)}
              onClick={(e) => handleUnitClick(emp, e)}
              task={task}
            />
          );
        })}
        
        {/* Selection box */}
        {selectionStart && selectionCurrent && (
          <SelectionBox start={selectionStart} current={selectionCurrent} />
        )}
        
        {/* Project name */}
        <div className="project-banner">
          <span className="project-name">{project?.name || 'Founder Mode'}</span>
        </div>
      </div>
      
      <Minimap 
        employees={employees}
        selectedIds={selectedEmployeeIds}
        onSelectUnit={(id) => selectEmployees([id])}
      />
      
      <CommandPanel 
        selectedUnits={selectedUnits}
        onCommand={handleCommand}
      />
    </div>
  );
}

export default RTSView;
