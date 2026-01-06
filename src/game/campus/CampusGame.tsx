/**
 * CampusGame - React wrapper for the Phaser campus view
 * 
 * Bridges Phaser and React, syncing game state with the campus visualization.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { CampusScene } from './CampusScene';
import type { CampusSceneEvents } from './CampusScene';
import { useGameStore } from '../../store/gameStore';
import { BuildingType } from './types';
import './CampusGame.css';

// Map employee roles to building types
function getRoleBuildingType(role: string): BuildingType {
  const roleMap: Record<string, BuildingType> = {
    developer: BuildingType.Engineering,
    engineer: BuildingType.Engineering,
    frontend: BuildingType.Engineering,
    backend: BuildingType.Engineering,
    fullstack: BuildingType.Engineering,
    designer: BuildingType.Design,
    'ui/ux': BuildingType.Design,
    marketer: BuildingType.Marketing,
    growth: BuildingType.Marketing,
    pm: BuildingType.Headquarters,
    'project manager': BuildingType.Headquarters,
    founder: BuildingType.Headquarters,
    ops: BuildingType.Operations,
    devops: BuildingType.Operations,
  };
  
  const lowerRole = role.toLowerCase();
  for (const [key, value] of Object.entries(roleMap)) {
    if (lowerRole.includes(key)) return value;
  }
  
  return BuildingType.Headquarters;
}

export function CampusGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CampusScene | null>(null);
  
  const { employees, tasks, project } = useGameStore();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    
    const events: CampusSceneEvents = {
      onBuildingClick: (buildingId) => {
        console.log('Building clicked:', buildingId);
      },
      onCharacterClick: (employeeId) => {
        setSelectedEmployee(employeeId);
      },
      onTileClick: (x, y) => {
        console.log('Tile clicked:', x, y);
      },
    };
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#1a1a2e',
      scene: CampusScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
    };
    
    const game = new Phaser.Game(config);
    gameRef.current = game;
    
    // Wait for scene to be ready
    game.events.once('ready', () => {
      const scene = game.scene.getScene('CampusScene') as CampusScene;
      if (scene) {
        sceneRef.current = scene;
        // Re-init with events
        scene.init({ events });
        setIsReady(true);
      }
    });
    
    // Fallback: check for scene after a short delay
    setTimeout(() => {
      const scene = game.scene.getScene('CampusScene') as CampusScene;
      if (scene && !sceneRef.current) {
        sceneRef.current = scene;
        scene.init({ events });
        setIsReady(true);
      }
    }, 500);
    
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);
  
  // Sync employees to campus characters
  useEffect(() => {
    if (!sceneRef.current || !isReady) return;
    
    const scene = sceneRef.current;
    
    // Clear existing characters
    scene.clearCharacters();
    
    // Add employees as characters
    employees.forEach((employee, index) => {
      // Find what task they're working on
      const activeTask = tasks.find(
        t => t.assigneeId === employee.id && t.status === 'in_progress'
      );
      
      // Position characters around their building type
      const buildingType = getRoleBuildingType(employee.role);
      
      // Simple positioning based on role
      let baseX = 10;
      let baseY = 10;
      
      switch (buildingType) {
        case BuildingType.Engineering:
          baseX = 6;
          baseY = 6;
          break;
        case BuildingType.Design:
          baseX = 14;
          baseY = 6;
          break;
        case BuildingType.Marketing:
          baseX = 6;
          baseY = 14;
          break;
        case BuildingType.Headquarters:
          baseX = 10;
          baseY = 10;
          break;
        case BuildingType.Operations:
          baseX = 10;
          baseY = 14;
          break;
      }
      
      // Offset within building area
      const offsetX = (index % 3) - 1;
      const offsetY = Math.floor(index / 3) % 2;
      
      scene.addCharacter(
        `char_${employee.id}`,
        employee.id,
        employee.name.split(' ')[0], // First name only
        employee.avatarEmoji,
        baseX + offsetX,
        baseY + offsetY,
        undefined,
        activeTask?.title
      );
    });
  }, [employees, tasks, isReady]);
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current && containerRef.current) {
        gameRef.current.scale.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleZoomIn = useCallback(() => {
    if (gameRef.current) {
      const cam = gameRef.current.scene.getScene('CampusScene')?.cameras.main;
      if (cam) {
        cam.setZoom(Math.min(cam.zoom + 0.2, 2));
      }
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (gameRef.current) {
      const cam = gameRef.current.scene.getScene('CampusScene')?.cameras.main;
      if (cam) {
        cam.setZoom(Math.max(cam.zoom - 0.2, 0.5));
      }
    }
  }, []);
  
  const handleCenter = useCallback(() => {
    if (gameRef.current) {
      const cam = gameRef.current.scene.getScene('CampusScene')?.cameras.main;
      if (cam) {
        cam.centerOn(cam.width / 2, 300);
        cam.setZoom(1);
      }
    }
  }, []);
  
  return (
    <div className="campus-game">
      <div className="campus-header">
        <div className="campus-title">
          <span className="campus-icon">🏢</span>
          <h2>{project?.name || 'Startup'} Campus</h2>
        </div>
        
        <div className="campus-stats">
          <span className="stat">
            <span className="stat-icon">👥</span>
            {employees.length} employees
          </span>
          <span className="stat">
            <span className="stat-icon">📋</span>
            {tasks.filter(t => t.status === 'in_progress').length} active tasks
          </span>
        </div>
        
        <div className="campus-controls">
          <button onClick={handleZoomOut} title="Zoom Out">−</button>
          <button onClick={handleCenter} title="Center View">⌂</button>
          <button onClick={handleZoomIn} title="Zoom In">+</button>
        </div>
      </div>
      
      <div className="campus-container" ref={containerRef} />
      
      <div className="campus-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6366f1' }} />
          <span>HQ</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#22c55e' }} />
          <span>Engineering</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ec4899' }} />
          <span>Design</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f59e0b' }} />
          <span>Marketing</span>
        </div>
      </div>
      
      <div className="campus-help">
        <span>🖱️ Scroll to zoom</span>
        <span>⌨️ WASD/Arrows to pan</span>
        <span>🖱️ Middle-click drag to pan</span>
      </div>
      
      {selectedEmployee && (
        <div className="campus-employee-popup">
          <button 
            className="popup-close" 
            onClick={() => setSelectedEmployee(null)}
          >
            ×
          </button>
          <EmployeePopup employeeId={selectedEmployee} />
        </div>
      )}
    </div>
  );
}

// Employee popup component
function EmployeePopup({ employeeId }: { employeeId: string }) {
  const { employees, tasks } = useGameStore();
  const employee = employees.find(e => e.id === employeeId);
  
  if (!employee) return null;
  
  const activeTask = tasks.find(
    t => t.assigneeId === employee.id && t.status === 'in_progress'
  );
  
  const completedTasks = tasks.filter(
    t => t.assigneeId === employee.id && t.status === 'done'
  );
  
  // Calculate progress percentage
  const progressPercent = activeTask 
    ? Math.round((activeTask.progressTicks / activeTask.estimatedTicks) * 100)
    : 0;
  
  return (
    <div className="employee-popup-content">
      <div className="popup-header">
        <span className="popup-avatar">{employee.avatarEmoji}</span>
        <div className="popup-info">
          <h3>{employee.name}</h3>
          <span className="popup-role">{employee.role}</span>
        </div>
      </div>
      
      {activeTask ? (
        <div className="popup-task active">
          <span className="task-status">🔄 Working on:</span>
          <span className="task-title">{activeTask.title}</span>
          <div className="task-progress">
            <div 
              className="task-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="popup-task idle">
          <span className="task-status">💤 Idle</span>
          <span className="task-hint">Assign a task to get them working!</span>
        </div>
      )}
      
      <div className="popup-stats">
        <div className="popup-stat">
          <span className="stat-value">{completedTasks.length}</span>
          <span className="stat-label">Tasks completed</span>
        </div>
        <div className="popup-stat">
          <span className="stat-value">{employee.tasksCompleted}</span>
          <span className="stat-label">Tasks Done</span>
        </div>
      </div>
    </div>
  );
}

export default CampusGame;
