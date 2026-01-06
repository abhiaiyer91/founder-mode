/**
 * Animated Sprite Components - Visual representations of employees and activities
 */

import { useEffect, useState } from 'react';
import './Sprite.css';

// Employee sprite with animations
export function EmployeeSprite({
  role,
  status,
  morale,
  size = 'medium',
}: {
  role: 'engineer' | 'designer' | 'pm' | 'marketer';
  status: 'idle' | 'working' | 'blocked' | 'on_break';
  morale: number;
  size?: 'small' | 'medium' | 'large';
}) {
  const [frame, setFrame] = useState(0);

  // Animate when working
  useEffect(() => {
    if (status === 'working') {
      const interval = setInterval(() => {
        setFrame(f => (f + 1) % 4);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Role-based appearance
  const roleSprites = {
    engineer: {
      idle: ['👨‍💻', '👨‍💻', '👨‍💻', '👨‍💻'],
      working: ['👨‍💻', '⌨️', '👨‍💻', '💻'],
      blocked: ['🤔', '😕', '🤔', '😕'],
      on_break: ['☕', '🍕', '☕', '📱'],
    },
    designer: {
      idle: ['🎨', '🎨', '🎨', '🎨'],
      working: ['🎨', '✏️', '🖌️', '🎨'],
      blocked: ['🤔', '😕', '🤔', '😕'],
      on_break: ['☕', '🍕', '☕', '📱'],
    },
    pm: {
      idle: ['📊', '📊', '📊', '📊'],
      working: ['📊', '📋', '📈', '📊'],
      blocked: ['🤔', '😕', '🤔', '😕'],
      on_break: ['☕', '🍕', '☕', '📱'],
    },
    marketer: {
      idle: ['📢', '📢', '📢', '📢'],
      working: ['📢', '📣', '💬', '📢'],
      blocked: ['🤔', '😕', '🤔', '😕'],
      on_break: ['☕', '🍕', '☕', '📱'],
    },
  };

  const sprites = roleSprites[role] || roleSprites.engineer;
  const currentSprite = sprites[status]?.[frame] || sprites.idle[0];
  
  // Morale affects appearance
  const moraleIndicator = morale >= 80 ? '😊' : morale >= 50 ? '' : '😫';
  const moraleClass = morale >= 80 ? 'happy' : morale >= 50 ? 'neutral' : 'stressed';

  return (
    <div className={`employee-sprite ${size} ${status} ${moraleClass}`}>
      <div className="sprite-main">
        {currentSprite}
      </div>
      {status === 'working' && (
        <div className="working-indicator">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      )}
      {moraleIndicator && (
        <div className="morale-indicator">{moraleIndicator}</div>
      )}
    </div>
  );
}

// Activity indicator - shows what's happening
export function ActivityIndicator({
  type,
}: {
  type: 'coding' | 'designing' | 'thinking' | 'shipping' | 'bug' | 'deploy';
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const animations = {
    coding: ['⌨️', '💻', '⌨️', '✨'],
    designing: ['🎨', '✏️', '🎨', '🖼️'],
    thinking: ['🤔', '💭', '🤔', '💡'],
    shipping: ['📦', '🚀', '✨', '🎉'],
    bug: ['🐛', '🔍', '🔧', '✅'],
    deploy: ['🚀', '☁️', '🌐', '✨'],
  };

  const frames = animations[type] || animations.coding;

  return (
    <div className="activity-indicator">
      <span className="activity-emoji">{frames[frame]}</span>
    </div>
  );
}

// Code typing animation
export function CodeTypingAnimation({
  code,
  speed = 50,
  onComplete,
}: {
  code: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < code.length) {
      const timer = setTimeout(() => {
        setDisplayedCode(prev => prev + code[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, code, speed, onComplete]);

  return (
    <pre className="code-typing">
      <code>{displayedCode}</code>
      <span className="cursor">|</span>
    </pre>
  );
}

// Progress ring for tasks
export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 4,
  color = '#00ff88',
}: {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg className="progress-ring" width={size} height={size}>
      <circle
        className="progress-ring-bg"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="progress-ring-progress"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 0.3s ease',
        }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="progress-ring-text"
        fill={color}
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
}

// Minimap with activity visualization
export function Minimap({
  employees,
  tasks,
}: {
  employees: Array<{ id: string; status: string; role: string }>;
  tasks: Array<{ id: string; status: string; type: string }>;
}) {
  const tasksByStatus = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const total = tasks.length || 1;

  return (
    <div className="minimap">
      <div className="minimap-header">
        <span>Project Overview</span>
        <span className="minimap-total">{tasks.length} tasks</span>
      </div>
      
      <div className="minimap-bar">
        <div 
          className="minimap-segment done" 
          style={{ width: `${(tasksByStatus.done / total) * 100}%` }}
          title={`${tasksByStatus.done} done`}
        />
        <div 
          className="minimap-segment review" 
          style={{ width: `${(tasksByStatus.review / total) * 100}%` }}
          title={`${tasksByStatus.review} in review`}
        />
        <div 
          className="minimap-segment in-progress" 
          style={{ width: `${(tasksByStatus.in_progress / total) * 100}%` }}
          title={`${tasksByStatus.in_progress} in progress`}
        />
        <div 
          className="minimap-segment todo" 
          style={{ width: `${(tasksByStatus.todo / total) * 100}%` }}
          title={`${tasksByStatus.todo} todo`}
        />
        <div 
          className="minimap-segment backlog" 
          style={{ width: `${(tasksByStatus.backlog / total) * 100}%` }}
          title={`${tasksByStatus.backlog} backlog`}
        />
      </div>

      <div className="minimap-employees">
        {employees.map(emp => (
          <div 
            key={emp.id}
            className={`minimap-employee ${emp.status}`}
            title={`${emp.role} - ${emp.status}`}
          >
            {emp.status === 'working' && <span className="pulse" />}
          </div>
        ))}
      </div>

      <div className="minimap-legend">
        <span><span className="dot done" /> Done</span>
        <span><span className="dot in-progress" /> Active</span>
        <span><span className="dot todo" /> Todo</span>
      </div>
    </div>
  );
}
