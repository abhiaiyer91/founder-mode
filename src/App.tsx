import { useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { StartScreen, OfficeScreen, HireScreen, TasksScreen } from './components/screens';
import './App.css';

function App() {
  const { screen, gameSpeed, setScreen, gameTick } = useGameStore();

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
    }
  }, [screen, setScreen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen />;
      case 'office':
        return <OfficeScreen />;
      case 'hire':
        return <HireScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'team':
        return <OfficeScreen />; // TODO: Dedicated team screen
      case 'code':
        return <OfficeScreen />; // TODO: Code view screen
      case 'settings':
        return <OfficeScreen />; // TODO: Settings screen
      default:
        return <StartScreen />;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
}

export default App;
