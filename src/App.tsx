import { useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { 
  StartScreen, 
  CommandCenter,
  OfficeScreen, 
  HireScreen, 
  TasksScreen,
  TeamScreen,
  CodeScreen,
  SettingsScreen 
} from './components/screens';
import { StatusBar } from './components/StatusBar';
import type { GameScreen, GameSpeed } from './types';
import './App.css';

function App() {
  const { 
    screen, 
    gameSpeed, 
    setScreen, 
    setGameSpeed,
    gameTick,
    triggerRandomEvent,
    tick,
    project
  } = useGameStore();

  // Game loop
  useEffect(() => {
    if (gameSpeed === 'paused') return;

    const speeds = {
      normal: 1000,
      fast: 500,
      turbo: 100,
    };

    const interval = setInterval(() => {
      gameTick();
    }, speeds[gameSpeed as keyof typeof speeds] || 1000);

    return () => clearInterval(interval);
  }, [gameSpeed, gameTick]);

  // Random events (every ~5 minutes of game time / 300 ticks)
  useEffect(() => {
    if (tick > 0 && tick % 300 === 0 && Math.random() > 0.5) {
      triggerRandomEvent();
    }
  }, [tick, triggerRandomEvent]);

  // Monthly payroll (every 1440 ticks = 1 day in-game)
  useEffect(() => {
    if (tick > 0 && tick % 1440 === 0) {
      const state = useGameStore.getState();
      const monthlyBurn = state.employees.reduce((sum, e) => sum + e.salary, 0);
      if (monthlyBurn > 0) {
        useGameStore.setState({ 
          money: Math.max(0, state.money - monthlyBurn) 
        });
        state.addNotification(`💸 Payday! -$${monthlyBurn.toLocaleString()} in salaries`, 'warning');
      }
    }
  }, [tick]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle if not typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Escape to go back
    if (e.key === 'Escape') {
      if (screen !== 'start' && screen !== 'office') {
        setScreen('office');
      }
      return;
    }

    // Speed controls (when in game)
    if (project) {
      const speedMap: Record<string, GameSpeed> = {
        '0': 'paused',
        '1': 'normal',
        '2': 'fast',
        '3': 'turbo',
      };
      if (speedMap[e.key]) {
        e.preventDefault();
        setGameSpeed(speedMap[e.key]);
        return;
      }

      // Screen shortcuts (when in office)
      if (screen === 'office') {
        const screenMap: Record<string, GameScreen> = {
          'h': 'hire',
          't': 'tasks',
          'e': 'team',
          'c': 'code',
          's': 'settings',
        };
        if (screenMap[e.key.toLowerCase()]) {
          e.preventDefault();
          setScreen(screenMap[e.key.toLowerCase()]);
        }
      }
    }
  }, [screen, setScreen, setGameSpeed, project]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen />;
      case 'command':
        return <CommandCenter />;
      case 'office':
        return <OfficeScreen />;
      case 'hire':
        return <HireScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'team':
        return <TeamScreen />;
      case 'code':
        return <CodeScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <StartScreen />;
    }
  };

  // Command Center has its own status bar built-in
  const showStatusBar = project && screen !== 'command';

  return (
    <div className="app">
      {renderScreen()}
      {showStatusBar && <StatusBar />}
    </div>
  );
}

export default App;
