import { useEffect, useCallback, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { 
  LandingPage,
  AuthScreen,
  StartScreen, 
  RTSView,
  CampusScreen,
  DashboardScreen,
  CommandCenter,
  TaskQueueScreen,
  MissionsScreen,
  ArtifactsScreen,
  PreviewScreen,
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
import { MobileNav } from './components/MobileNav';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { useSession } from './lib/auth';
import { getApiKey } from './lib/storage/secureStorage';
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
    runPMEvaluation,
    tick,
    project,
    selectedEmployeeIds,
    setControlGroup,
    selectControlGroup,
    autopilot,
    focusMode,
    eventsEnabled,
    pmBrain,
  } = useGameStore();
  
  // Auth state
  const { data: session, isPending: authLoading } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  
  // Check if user should see auth screen
  const needsAuth = !session && !isGuest && !authLoading;
  
  // Get configureAI for restoring saved key
  const { configureAI, aiSettings, processAIWorkQueue, aiWorkQueue } = useGameStore();

  // Restore saved API key on mount
  useEffect(() => {
    if (!aiSettings.enabled) {
      const savedKey = getApiKey('openai');
      if (savedKey) {
        configureAI(savedKey);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // AI Work Queue processor (runs independently of game speed)
  useEffect(() => {
    if (!aiSettings.enabled || aiWorkQueue.length === 0) return;
    
    // Process AI work every 2 seconds (don't block on game tick)
    const interval = setInterval(() => {
      processAIWorkQueue();
    }, 2000);

    return () => clearInterval(interval);
  }, [aiSettings.enabled, aiWorkQueue.length, processAIWorkQueue]);

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

  // PM Brain evaluation loop
  useEffect(() => {
    if (project && pmBrain.enabled && tick > 0) {
      // Run evaluation at the configured interval
      if (tick - pmBrain.lastEvaluation >= pmBrain.evaluationInterval) {
        runPMEvaluation();
      }
    }
  }, [tick, project, pmBrain.enabled, pmBrain.lastEvaluation, pmBrain.evaluationInterval, runPMEvaluation]);

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
      const mainScreens: GameScreen[] = ['rts', 'campus', 'dashboard', 'command', 'office'];
      if (mainScreens.includes(screen)) {
        const screenMap: Record<string, GameScreen> = {
          'r': 'rts',        // Isometric RTS view (new default)
          'v': 'campus',     // Isometric campus view (Phaser)
          'd': 'dashboard',
          'c': 'command',
          'h': 'hire',
          't': 'tasks',
          'e': 'team',
          'q': 'queue',
          'm': 'missions',   // PM missions (git worktrees)
          'a': 'artifacts',  // AI-generated content
          'p': 'preview',    // Live code preview
          'u': 'tech', // Upgrades/tech tree
          'y': 'achievements', // Trophy room
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
      case 'landing':
        return <LandingPage />;
      case 'start':
        return <StartScreen />;
      case 'rts':
        return <RTSView />;
      case 'campus':
        return <CampusScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'command':
        return <CommandCenter />;
      case 'queue':
        return <TaskQueueScreen />;
      case 'missions':
        return <MissionsScreen />;
      case 'artifacts':
        return <ArtifactsScreen />;
      case 'preview':
        return <PreviewScreen />;
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

  // Screens with built-in status bars (no extra chrome needed)
  const fullScreens: GameScreen[] = ['landing', 'rts', 'campus', 'dashboard', 'command', 'queue', 'missions', 'artifacts', 'preview', 'tech', 'achievements'];
  const showStatusBar = project && !fullScreens.includes(screen);
  
  // Show top bar when in game (not on landing or start)
  const showTopBar = project && screen !== 'start' && screen !== 'landing';

  return (
    <div className="app">
      {showTopBar && <RTSTopBar />}
      <div className="app-content">
        {renderScreen()}
      </div>
      {showStatusBar && <StatusBar />}
      {project && !focusMode && <EventPanel />}
      {project && <FloatingResources />}
      <OnboardingTutorial />
      <MobileNav />
    </div>
  );
}

export default App;
