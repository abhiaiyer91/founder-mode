/**
 * Floating Resources - RTS-style floating resource indicators
 * 
 * Shows animated floating numbers when resources are gained/lost,
 * similar to Warcraft/Starcraft resource feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import './FloatingResources.css';

interface FloatingResource {
  id: string;
  type: 'money' | 'task' | 'xp' | 'morale';
  value: string;
  x: number;
  y: number;
  positive: boolean;
}

export function FloatingResources() {
  const [floaters, setFloaters] = useState<FloatingResource[]>([]);
  const { money, tasks } = useGameStore();
  
  // Track previous values
  const [prevMoney, setPrevMoney] = useState(money);
  const [prevCompleted, setPrevCompleted] = useState(() => 
    tasks.filter(t => t.status === 'done').length
  );
  
  // Add a floater
  const addFloater = useCallback((
    type: FloatingResource['type'],
    value: string,
    positive: boolean
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const floater: FloatingResource = {
      id,
      type,
      value,
      x: Math.random() * 200 + 100, // Random position in viewport
      y: Math.random() * 100 + 50,
      positive,
    };
    
    setFloaters(prev => [...prev, floater]);
    
    // Remove after animation
    setTimeout(() => {
      setFloaters(prev => prev.filter(f => f.id !== id));
    }, 2000);
  }, []);
  
  // Watch for money changes
  useEffect(() => {
    const diff = money - prevMoney;
    if (diff !== 0 && Math.abs(diff) > 10) {
      const positive = diff > 0;
      const formatted = `${positive ? '+' : ''}$${Math.abs(diff).toLocaleString()}`;
      addFloater('money', formatted, positive);
    }
    setPrevMoney(money);
  }, [money, prevMoney, addFloater]);
  
  // Watch for task completions
  useEffect(() => {
    const completed = tasks.filter(t => t.status === 'done').length;
    if (completed > prevCompleted) {
      addFloater('task', `+${completed - prevCompleted} Task${completed - prevCompleted > 1 ? 's' : ''}`, true);
    }
    setPrevCompleted(completed);
  }, [tasks, prevCompleted, addFloater]);
  
  // Morale changes could be tracked here in the future
  // For now, money and task changes are the main resource animations
  
  if (floaters.length === 0) return null;
  
  return (
    <div className="floating-resources">
      {floaters.map(floater => (
        <div
          key={floater.id}
          className={`floater ${floater.type} ${floater.positive ? 'positive' : 'negative'}`}
          style={{ left: floater.x, top: floater.y }}
        >
          <span className="floater-icon">
            {floater.type === 'money' && '💰'}
            {floater.type === 'task' && '✅'}
            {floater.type === 'xp' && '⭐'}
            {floater.type === 'morale' && '❤️'}
          </span>
          <span className="floater-value">{floater.value}</span>
        </div>
      ))}
    </div>
  );
}

export default FloatingResources;
