import { useGameStore } from '../store/gameStore';
import './StatusBar.css';

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function formatTime(ticks: number): string {
  const days = Math.floor(ticks / 1440); // 1440 ticks per day
  const hours = Math.floor((ticks % 1440) / 60);
  if (days > 0) {
    return `Day ${days + 1}, ${hours}:00`;
  }
  return `Day 1, ${hours}:00`;
}

export function StatusBar() {
  const { 
    money, 
    employees, 
    tasks, 
    tick, 
    isPaused,
    togglePause,
    project 
  } = useGameStore();

  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const monthlyBurn = employees.reduce((sum, e) => sum + e.salary, 0);
  const runway = monthlyBurn > 0 ? Math.floor(money / monthlyBurn) : 99;

  if (!project) return null;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="project-name">🚀 {project.name}</span>
        <span className="game-time">{formatTime(tick)}</span>
      </div>
      
      <div className="status-center">
        <div className="status-item">
          <span className="label">💰</span>
          <span className="value">{formatMoney(money)}</span>
        </div>
        <div className="status-item">
          <span className="label">👥</span>
          <span className="value">{employees.length}</span>
        </div>
        <div className="status-item">
          <span className="label">📋</span>
          <span className="value">{activeTasks}/{tasks.length}</span>
        </div>
        <div className="status-item">
          <span className="label">✅</span>
          <span className="value">{completedTasks}</span>
        </div>
        <div className={`status-item ${runway < 3 ? 'danger' : runway < 6 ? 'warning' : ''}`}>
          <span className="label">⏳</span>
          <span className="value">{runway}mo</span>
        </div>
      </div>
      
      <div className="status-right">
        <button className="pause-toggle" onClick={togglePause} title="Toggle pause [Space]">
          <span className="pause-icon">{isPaused ? '▶' : '❚❚'}</span>
          <span className="pause-label">{isPaused ? 'Play' : 'Pause'}</span>
        </button>
      </div>
    </div>
  );
}

export default StatusBar;
