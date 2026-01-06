import { useEffect, useCallback, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import { 
  LandingPage,
  AuthScreen,
  StartScreen,
  ProjectsScreen,
  // Onboarding flow screens
  HirePMScreen,
  IdeateScreen,
  HireEngineerScreen,
  // Main game screens
  HireScreen, 
  TasksScreen,
  TeamScreen,
  ArtifactsScreen,
  PreviewScreen,
  SettingsScreen 
} from './components/screens';
import { GameLayout } from './components/GameLayout';
import { useSession } from './lib/auth';
import { getApiKey, saveApiKey } from './lib/storage/secureStorage';
import './App.css';

/**
 * Main App Component
 * 
 * Routes:
 * - / : Landing page (marketing)
 * - /login, /signup : Authentication
 * - /start : Start a new project
 * - /projects : List of saved projects
 * - /play : Main game view (requires active project)
 * - /play/hire : Hire employees
 * - /play/tasks : Manage tasks
 * - /play/team : View team
 * - /play/code : View generated code
 * - /play/preview : Live app preview
 * - /play/settings : Game settings
 */

/**
 * RequireProject - Route guard that redirects to /start if no project is active
 * IMPORTANT: This must be defined OUTSIDE the App component to avoid remounting
 */
function RequireProject({ children }: { children: React.ReactNode }) {
  const project = useGameStore(state => state.project);
  
  if (!project) {
    return <Navigate to="/start" replace />;
  }
  return <>{children}</>;
}

/**
 * PhaseRouter - Routes to the correct screen based on game phase
 * Used for the onboarding flow
 */
function PhaseRouter() {
  const phase = useGameStore(state => state.phase);
  
  switch (phase) {
    case 'hire_pm':
      return <HirePMScreen />;
    case 'ideate':
      return <IdeateScreen />;
    case 'hire_engineer':
      return <HireEngineerScreen />;
    case 'playing':
    default:
      // If in playing phase, redirect to main game
      return <Navigate to="/play" replace />;
  }
}

/**
 * PlayingPhaseGuard - Redirects to onboarding if not in playing phase
 */
function PlayingPhaseGuard({ children }: { children: React.ReactNode }) {
  const phase = useGameStore(state => state.phase);
  
  if (phase !== 'playing') {
    return <Navigate to="/play/onboarding" replace />;
  }
  return <>{children}</>;
}

/**
 * GameLoop - Handles the game tick loop without causing App to re-render
 * This is a "headless" component that only manages side effects
 */
function GameLoop() {
  const isPaused = useGameStore(state => state.isPaused);
  const project = useGameStore(state => state.project);
  const autopilot = useGameStore(state => state.autopilot);
  const focusMode = useGameStore(state => state.focusMode);
  const eventsEnabled = useGameStore(state => state.eventsEnabled);
  const pmBrain = useGameStore(state => state.pmBrain);
  const tick = useGameStore(state => state.tick);
  const aiSettings = useGameStore(state => state.aiSettings);
  const aiWorkQueue = useGameStore(state => state.aiWorkQueue);
  
  const gameTick = useGameStore(state => state.gameTick);
  const processQueue = useGameStore(state => state.processQueue);
  const runAutopilot = useGameStore(state => state.runAutopilot);
  const triggerRandomEvent = useGameStore(state => state.triggerRandomEvent);
  const triggerEvent = useGameStore(state => state.triggerEvent);
  const checkAchievements = useGameStore(state => state.checkAchievements);
  const updatePlayTime = useGameStore(state => state.updatePlayTime);
  const runPMEvaluation = useGameStore(state => state.runPMEvaluation);
  const processAIWorkQueue = useGameStore(state => state.processAIWorkQueue);

  // Game loop - runs at fixed speed when not paused
  useEffect(() => {
    if (isPaused || !project) return;

    const interval = setInterval(() => {
      gameTick();
      processQueue();
      if (autopilot) {
        runAutopilot();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, gameTick, processQueue, autopilot, runAutopilot, project]);

  // AI Work Queue processor
  useEffect(() => {
    if (!aiSettings.enabled || aiWorkQueue.length === 0) return;
    
    const interval = setInterval(() => {
      processAIWorkQueue();
    }, 2000);

    return () => clearInterval(interval);
  }, [aiSettings.enabled, aiWorkQueue.length, processAIWorkQueue]);

  // Random events
  useEffect(() => {
    if (tick > 0 && tick % 300 === 0 && Math.random() > 0.5) {
      if (eventsEnabled && !focusMode) {
        triggerRandomEvent();
        triggerEvent();
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

  // Monthly payroll
  useEffect(() => {
    if (tick > 0 && tick % 1440 === 0) {
      const state = useGameStore.getState();
      const monthlyBurn = state.employees.reduce((sum, e) => sum + e.salary, 0);
      if (monthlyBurn > 0) {
        useGameStore.setState({ 
          money: Math.max(0, state.money - monthlyBurn) 
        });
        state.addNotification(`Payday! -$${monthlyBurn.toLocaleString()} in salaries`, 'warning');
      }
    }
  }, [tick]);

  return null; // This component renders nothing
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only subscribe to what App actually needs for rendering/navigation
  const project = useGameStore(state => state.project);
  const togglePause = useGameStore(state => state.togglePause);
  
  // Auth state
  const { data: session, isPending: authLoading } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  
  // Check if user is authenticated (session or guest)
  const isAuthenticated = !!session || isGuest;
  
  // Get AI configuration
  const configureAI = useGameStore(state => state.configureAI);
  const aiSettings = useGameStore(state => state.aiSettings);

  // Restore saved API key on mount
  useEffect(() => {
    const savedKey = getApiKey('openai');
    if (savedKey && !aiSettings.enabled) {
      configureAI();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (!project) return;

    // Pause toggle
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
      return;
    }

    // Navigation shortcuts
    const isInGame = location.pathname.startsWith('/play');
    if (isInGame) {
      const navMap: Record<string, string> = {
        'h': '/play/hire',
        't': '/play/tasks',
        'e': '/play/team',
        'c': '/play/code',
        'p': '/play/preview',
        's': '/play/settings',
        'Escape': '/play',
      };
      if (navMap[e.key]) {
        e.preventDefault();
        navigate(navMap[e.key]);
      }
    }
  }, [project, togglePause, navigate, location.pathname]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle auth success
  const handleAuthSuccess = () => {
    setIsGuest(false);
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    navigate(redirect || '/start');
  };
  
  const handleSkipAuth = () => {
    setIsGuest(true);
    navigate('/');
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="app">
        <div className="app-content">
          <div className="loading-screen">
            <div className="loading-spinner" />
            <div className="loading-text">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Game loop runs independently without causing App re-renders */}
      <GameLoop />
      
      <div className="app-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/projects" replace /> : (
                <AuthScreen mode="login" onSuccess={handleAuthSuccess} onSkip={handleSkipAuth} />
              )
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? <Navigate to="/projects" replace /> : (
                <AuthScreen mode="signup" onSuccess={handleAuthSuccess} onSkip={handleSkipAuth} />
              )
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/start" 
            element={isAuthenticated ? <StartScreen /> : <Navigate to="/login?redirect=/start" replace />} 
          />
          <Route 
            path="/projects" 
            element={isAuthenticated ? <ProjectsScreen /> : <Navigate to="/login?redirect=/projects" replace />} 
          />
          
          {/* Onboarding flow routes - phase-specific screens */}
          <Route 
            path="/play/onboarding/*" 
            element={
              <RequireProject>
                <PhaseRouter />
              </RequireProject>
            }
          />
          
          {/* Game routes - require active project and playing phase */}
          <Route 
            path="/play" 
            element={
              <RequireProject>
                <PlayingPhaseGuard>
                  <GameLayout />
                </PlayingPhaseGuard>
              </RequireProject>
            }
          >
            <Route index element={<GameDashboard />} />
            <Route path="hire" element={<HireScreen />} />
            <Route path="tasks" element={<TasksScreen />} />
            <Route path="team" element={<TeamScreen />} />
            <Route path="code" element={<ArtifactsScreen />} />
            <Route path="preview" element={<PreviewScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// AI Provider configurations
const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  { 
    id: 'google', 
    name: 'Google', 
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    keyPlaceholder: 'API key...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  { 
    id: 'groq', 
    name: 'Groq', 
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    keyPlaceholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
  },
];

/**
 * GameDashboard - Main game view showing gameplay progress and next actions
 */
function GameDashboard() {
  const navigate = useNavigate();
  const { employees, tasks, project, aiSettings, configureAI, setGlobalModel } = useGameStore();
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const codeGenerated = tasks.filter(t => t.codeGenerated).length;
  
  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider)!;
  
  // Update model when provider changes
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setSelectedModel(provider.models[0]);
    }
    setError('');
  };
  
  // Handle API key submission
  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    
    setIsConnecting(true);
    setError('');
    
    try {
      // Save the API key
      saveApiKey(selectedProvider as 'openai' | 'anthropic' | 'google' | 'groq', apiKey.trim());
      
      // Set model and enable AI
      setGlobalModel(selectedModel);
      configureAI();
    } catch (err) {
      setError('Failed to configure AI. Please try again.');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // If AI is not enabled, show setup screen
  if (!aiSettings.enabled) {
    return (
      <div className="game-dashboard">
        <div className="ai-setup">
          <div className="setup-icon">◈</div>
          <h1>Configure AI</h1>
          <p>Select your AI provider and model, then enter your API key.</p>
          
          <div className="setup-form">
            {/* Provider Selection */}
            <div className="form-group">
              <label>Provider</label>
              <div className="provider-grid">
                {AI_PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    type="button"
                    className={`provider-btn ${selectedProvider === provider.id ? 'active' : ''}`}
                    onClick={() => handleProviderChange(provider.id)}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Model Selection */}
            <div className="form-group">
              <label>Model</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="model-select"
              >
                {currentProvider.models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            {/* API Key Input */}
            <div className="form-group">
              <label>API Key</label>
              <div className="input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentProvider.keyPlaceholder}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button 
                  type="button" 
                  className="toggle-visibility"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <a 
                href={currentProvider.keyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="key-link"
              >
                Get {currentProvider.name} API key →
              </a>
            </div>
            
            {error && <div className="setup-error">{error}</div>}
            
            <button 
              className="setup-submit" 
              onClick={handleSubmit}
              disabled={isConnecting || !apiKey.trim()}
            >
              {isConnecting ? 'Connecting...' : 'Start Playing'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Determine current game phase
  const getGamePhase = () => {
    if (employees.length === 0) return 'hire';
    if (tasks.length === 0) return 'tasks';
    if (activeTasks > 0) return 'working';
    if (completedTasks > 0 && codeGenerated === 0) return 'waiting';
    if (codeGenerated > 0) return 'review';
    return 'working';
  };
  
  const phase = getGamePhase();
  
  const steps = [
    { 
      id: 'hire', 
      label: 'Build Your Team', 
      description: 'Hire engineers, designers, and more to work on your project.',
      action: () => navigate('/play/hire'),
      actionLabel: 'Hire Team',
      complete: employees.length > 0,
    },
    { 
      id: 'tasks', 
      label: 'Create Tasks', 
      description: 'Break down your project into tasks for your team to work on.',
      action: () => navigate('/play/tasks'),
      actionLabel: 'Create Tasks',
      complete: tasks.length > 0,
    },
    { 
      id: 'working', 
      label: 'Watch Progress', 
      description: 'Your team is working. AI generates real code as tasks complete.',
      action: () => navigate('/play/tasks'),
      actionLabel: 'View Progress',
      complete: completedTasks > 0,
    },
    { 
      id: 'review', 
      label: 'Review Code', 
      description: 'Check the generated code and preview your app.',
      action: () => navigate('/play/code'),
      actionLabel: 'View Code',
      complete: codeGenerated > 0,
    },
    { 
      id: 'deploy', 
      label: 'Deploy', 
      description: 'Push your generated code to GitHub.',
      action: () => navigate('/play/code'),
      actionLabel: 'Deploy',
      complete: false,
    },
  ];
  
  const currentStepIndex = steps.findIndex(s => s.id === phase);
  
  return (
    <div className="game-dashboard">
      {/* Project Header */}
      <div className="dashboard-header">
        <div className="project-title">
          <h1>{project?.name || 'My Project'}</h1>
          <p>{project?.description || 'Your startup simulation'}</p>
        </div>
        <div className="project-stats">
          <div className="stat">
            <span className="stat-value">{employees.length}</span>
            <span className="stat-label">Team</span>
          </div>
          <div className="stat">
            <span className="stat-value">{activeTasks}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-value">{completedTasks}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="progress-steps">
        <h2>How to Play</h2>
        <div className="steps-list">
          {steps.map((step, i) => (
            <div 
              key={step.id} 
              className={`step ${step.complete ? 'complete' : ''} ${i === currentStepIndex ? 'current' : ''}`}
            >
              <div className="step-number">
                {step.complete ? '✓' : i + 1}
              </div>
              <div className="step-content">
                <h3>{step.label}</h3>
                <p>{step.description}</p>
                {i === currentStepIndex && (
                  <button className="step-action" onClick={step.action}>
                    {step.actionLabel} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => navigate('/play/hire')}>
          <span className="action-icon">◆</span>
          <span>Hire</span>
        </button>
        <button onClick={() => navigate('/play/tasks')}>
          <span className="action-icon">◇</span>
          <span>Tasks</span>
        </button>
        <button onClick={() => navigate('/play/team')}>
          <span className="action-icon">◈</span>
          <span>Team</span>
        </button>
        <button onClick={() => navigate('/play/code')}>
          <span className="action-icon">○</span>
          <span>Code</span>
        </button>
        <button onClick={() => navigate('/play/preview')}>
          <span className="action-icon">◎</span>
          <span>Preview</span>
        </button>
      </div>
    </div>
  );
}

export default App;
