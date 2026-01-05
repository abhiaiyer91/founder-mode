import { useEffect, useCallback, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { 
  AuthScreen,
  StartScreen, 
  RTSView,
  DashboardScreen,
  CommandCenter,
  TaskQueueScreen,
  MissionsScreen,
  TechTreeScreen,
  AchievementsScreen,
  OfficeScreen, 
  HireScreen, 
  TasksScreen,
  TeamScreen,
  CodeScreen,
  SettingsScreen 
} from './components/screens';
import { StatusBar } from './components/StatusBar';
import { RTSTopBar } from './components/RTSTopBar';
import { EventPanel } from './components/EventPanel';
import { FloatingResources } from './components/FloatingResources';
import { useSession } from './lib/auth';
import type { GameScreen, GameSpeed } from './types';
import './App.css';

function App() {
  const { 
    screen, 
    gameSpeed, 
    setScreen, 
    setGameSpeed,
    gameTick,
    processQueue,
    triggerRandomEvent,
    checkAchievements,
    triggerEvent,
    updatePlayTime,
    runAutopilot,
    tick,
    project,
    selectedEmployeeIds,
    setControlGroup,
    selectControlGroup,
    autopilot,
    focusMode,
    eventsEnabled,
  } = useGameStore();
  
  // Auth state
  const { data: session, isPending: authLoading } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  
  // Check if user should see auth screen
  const needsAuth = !session && !isGuest && !authLoading;

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
      processQueue(); // Process task queue every tick
      if (autopilot) {
        runAutopilot(); // Run autopilot logic
      }
    }, speeds[gameSpeed as keyof typeof speeds] || 1000);

    return () => clearInterval(interval);
  }, [gameSpeed, gameTick, processQueue, autopilot, runAutopilot]);

  // Random events (every ~5 minutes of game time / 300 ticks)
  // Skip if events disabled or in focus mode
  useEffect(() => {
    if (tick > 0 && tick % 300 === 0 && Math.random() > 0.5) {
      if (eventsEnabled && !focusMode) {
        triggerRandomEvent();
        triggerEvent(); // New event system
      }
    }
  }, [tick, triggerRandomEvent, triggerEvent, eventsEnabled, focusMode]);

  // Check achievements periodically
  useEffect(() => {
    if (tick > 0 && tick % 60 === 0) {
      checkAchievements();
    }
  }, [tick, checkAchievements]);

  // Update play time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (project) {
        updatePlayTime();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [project, updatePlayTime]);

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
      // Control groups: Ctrl+1-9 to set, 1-9 to recall (when not setting speed)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        if (e.ctrlKey || e.metaKey) {
          // Set control group
          e.preventDefault();
          setControlGroup(num, selectedEmployeeIds);
          return;
        } else if (!e.shiftKey) {
          // Check if we should use as speed or control group
          // Use as speed only for 1-3, otherwise control group
          if (num <= 3) {
            const speedMap: Record<number, GameSpeed> = {
              1: 'normal',
              2: 'fast',
              3: 'turbo',
            };
            e.preventDefault();
            setGameSpeed(speedMap[num]);
            return;
          } else {
            // Recall control group for 4-9
            e.preventDefault();
            selectControlGroup(num);
            return;
          }
        }
      }
      
      if (e.key === '0') {
        e.preventDefault();
        setGameSpeed('paused');
        return;
      }

      // Screen shortcuts (when in main screens)
      const mainScreens: GameScreen[] = ['rts', 'dashboard', 'command', 'office'];
      if (mainScreens.includes(screen)) {
        const screenMap: Record<string, GameScreen> = {
          'r': 'rts',        // Isometric RTS view (new default)
          'd': 'dashboard',
          'c': 'command',
          'h': 'hire',
          't': 'tasks',
          'e': 'team',
          'q': 'queue',
          'm': 'missions',   // PM missions (git worktrees)
          'u': 'tech', // Upgrades/tech tree
          'a': 'achievements', // Trophy room
          's': 'settings',
        };
        if (screenMap[e.key.toLowerCase()]) {
          e.preventDefault();
          setScreen(screenMap[e.key.toLowerCase()]);
        }
      }
    }
  }, [screen, setScreen, setGameSpeed, project, selectedEmployeeIds, setControlGroup, selectControlGroup]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle auth success
  const handleAuthSuccess = () => {
    setIsGuest(false);
  };
  
  // Handle skip (guest mode)
  const handleSkipAuth = () => {
    setIsGuest(true);
  };

  // Render current screen
  const renderScreen = () => {
    // Show loading while checking auth
    if (authLoading) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner">⏳</div>
          <div className="loading-text">Loading...</div>
        </div>
      );
    }
    
    // Show auth if needed (optional - can be skipped)
    if (needsAuth && screen === 'start' && !project) {
      return (
        <AuthScreen 
          onSuccess={handleAuthSuccess} 
          onSkip={handleSkipAuth} 
        />
      );
    }
    
    switch (screen) {
      case 'start':
        return <StartScreen />;
      case 'rts':
        return <RTSView />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'command':
        return <CommandCenter />;
      case 'queue':
        return <TaskQueueScreen />;
      case 'missions':
        return <MissionsScreen />;
      case 'tech':
        return <TechTreeScreen />;
      case 'achievements':
        return <AchievementsScreen />;
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

  // Screens with built-in status bars
  const fullScreens: GameScreen[] = ['rts', 'dashboard', 'command', 'queue', 'missions', 'tech', 'achievements'];
  const showStatusBar = project && !fullScreens.includes(screen);
  
  // Show top bar when in game
  const showTopBar = project && screen !== 'start';

  return (
    <div className="app">
      {showTopBar && <RTSTopBar />}
      <div className="app-content">
        {renderScreen()}
      </div>
      {showStatusBar && <StatusBar />}
      {project && !focusMode && <EventPanel />}
      {project && <FloatingResources />}
    </div>
  );
}

export default App;
