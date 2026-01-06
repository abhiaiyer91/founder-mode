/**
 * Lite Demo - Interactive demo embedded on the landing page
 * 
 * A mini version of the game that users can try without starting.
 * Shows the core loop: hire → assign → watch AI work → see code
 */

import { useState, useEffect, useCallback } from 'react';
import './LiteDemo.css';

interface DemoEmployee {
  id: string;
  name: string;
  role: 'engineer' | 'designer' | 'pm';
  emoji: string;
  status: 'idle' | 'working';
  taskId: string | null;
}

interface DemoTask {
  id: string;
  title: string;
  type: 'feature' | 'design' | 'bug';
  progress: number;
  status: 'todo' | 'in_progress' | 'done';
  assigneeId: string | null;
  code?: string;
}

interface DemoState {
  step: number;
  money: number;
  employees: DemoEmployee[];
  tasks: DemoTask[];
  generatedCode: string[];
  showCode: boolean;
  isRunning: boolean;
}

const INITIAL_STATE: DemoState = {
  step: 0,
  money: 50000,
  employees: [],
  tasks: [
    { id: 't1', title: 'Build login page', type: 'feature', progress: 0, status: 'todo', assigneeId: null },
    { id: 't2', title: 'Design dashboard', type: 'design', progress: 0, status: 'todo', assigneeId: null },
    { id: 't3', title: 'Fix auth bug', type: 'bug', progress: 0, status: 'todo', assigneeId: null },
  ],
  generatedCode: [],
  showCode: false,
  isRunning: false,
};

const AVAILABLE_HIRES = [
  { id: 'e1', name: 'Alex Chen', role: 'engineer' as const, emoji: '👨‍💻', cost: 8000 },
  { id: 'e2', name: 'Sam Rivera', role: 'designer' as const, emoji: '🎨', cost: 6000 },
  { id: 'e3', name: 'Jordan Lee', role: 'engineer' as const, emoji: '👩‍💻', cost: 10000 },
];

const CODE_SNIPPETS = [
  `// LoginPage.tsx
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn(email, password);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} />
      <input type="password" value={password} />
      <button>Sign In</button>
    </form>
  );
}`,
  `/* Dashboard.css */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: #1a1a2e;
  padding: 24px;
}

.main-content {
  padding: 32px;
  background: #0d0d12;
}`,
  `// auth.ts - Bug Fix
export async function validateToken(token: string) {
  // Fixed: Added null check
  if (!token || token.length === 0) {
    throw new AuthError('Invalid token');
  }
  
  const decoded = jwt.verify(token, SECRET);
  return decoded;
}`,
];

const TUTORIAL_STEPS = [
  { title: 'Welcome!', description: 'Try the game right here. Click "Hire" to add your first employee.' },
  { title: 'Great hire!', description: 'Now drag an employee to a task, or click a task and assign them.' },
  { title: 'Working...', description: 'Watch your AI team generate real code!' },
  { title: 'Code generated!', description: 'Click "View Code" to see what your team built.' },
  { title: 'You did it!', description: 'Start the full game to build your entire product.' },
];

export function LiteDemo({ onStartGame }: { onStartGame?: () => void }) {
  const [state, setState] = useState<DemoState>(INITIAL_STATE);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showHireMenu, setShowHireMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulate work progress
  useEffect(() => {
    if (!state.isRunning) return;

    const interval = setInterval(() => {
      setState(prev => {
        const updatedTasks = prev.tasks.map(task => {
          if (task.status !== 'in_progress' || !task.assigneeId) return task;
          
          const newProgress = Math.min(task.progress + 5, 100);
          
          if (newProgress >= 100) {
            // Task complete - generate code
            const taskIndex = prev.tasks.findIndex(t => t.id === task.id);
            const code = CODE_SNIPPETS[taskIndex] || CODE_SNIPPETS[0];
            
            return {
              ...task,
              progress: 100,
              status: 'done' as const,
              code,
            };
          }
          
          return { ...task, progress: newProgress };
        });

        // Check if any task just completed
        const justCompleted = updatedTasks.find(
          (t, i) => t.status === 'done' && prev.tasks[i].status === 'in_progress'
        );

        // Update employee status when task completes
        const updatedEmployees = prev.employees.map(emp => {
          const task = updatedTasks.find(t => t.assigneeId === emp.id);
          if (task?.status === 'done' && emp.status === 'working') {
            return { ...emp, status: 'idle' as const, taskId: null };
          }
          return emp;
        });

        // Add generated code
        const newGeneratedCode = justCompleted?.code
          ? [...prev.generatedCode, justCompleted.code]
          : prev.generatedCode;

        // Check if all tasks are done
        const allDone = updatedTasks.every(t => t.status === 'done');

        return {
          ...prev,
          tasks: updatedTasks,
          employees: updatedEmployees,
          generatedCode: newGeneratedCode,
          step: allDone ? 4 : justCompleted ? 3 : prev.step,
          isRunning: !allDone,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [state.isRunning]);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  const hireEmployee = (hire: typeof AVAILABLE_HIRES[0]) => {
    if (state.money < hire.cost) {
      showNotification("Not enough money!");
      return;
    }

    if (state.employees.find(e => e.id === hire.id)) {
      showNotification("Already hired!");
      return;
    }

    setState(prev => ({
      ...prev,
      money: prev.money - hire.cost,
      employees: [...prev.employees, { ...hire, status: 'idle', taskId: null }],
      step: prev.step === 0 ? 1 : prev.step,
    }));

    setShowHireMenu(false);
    showNotification(`${hire.name} joined your team!`);
  };

  const assignTask = (taskId: string, employeeId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    const employee = state.employees.find(e => e.id === employeeId);
    
    if (!task || !employee || task.status !== 'todo' || employee.status !== 'idle') {
      return;
    }

    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === taskId ? { ...t, status: 'in_progress' as const, assigneeId: employeeId } : t
      ),
      employees: prev.employees.map(e =>
        e.id === employeeId ? { ...e, status: 'working' as const, taskId } : e
      ),
      step: 2,
      isRunning: true,
    }));

    setSelectedEmployee(null);
    showNotification(`${employee.name} is working on "${task.title}"`);
  };

  const handleTaskClick = (taskId: string) => {
    if (selectedEmployee) {
      assignTask(taskId, selectedEmployee);
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    const employee = state.employees.find(e => e.id === employeeId);
    if (employee?.status === 'idle') {
      setSelectedEmployee(selectedEmployee === employeeId ? null : employeeId);
    }
  };

  const resetDemo = () => {
    setState(INITIAL_STATE);
    setSelectedEmployee(null);
    setShowHireMenu(false);
  };

  const currentStep = TUTORIAL_STEPS[state.step];
  const completedTasks = state.tasks.filter(t => t.status === 'done').length;

  return (
    <div className="lite-demo">
      {/* Tutorial Banner */}
      <div className="demo-tutorial">
        <div className="tutorial-step">
          <span className="step-number">{state.step + 1}/5</span>
          <div className="step-content">
            <strong>{currentStep.title}</strong>
            <span>{currentStep.description}</span>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="demo-notification">{notification}</div>
      )}

      {/* Header */}
      <div className="demo-header">
        <div className="demo-project">
          <span className="project-icon">🚀</span>
          <span className="project-name">My Startup</span>
        </div>
        <div className="demo-stats">
          <span className="stat money">💰 ${state.money.toLocaleString()}</span>
          <span className="stat tasks">✅ {completedTasks}/3</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="demo-content">
        {/* Team Panel */}
        <div className="demo-panel team-panel">
          <div className="panel-header">
            <h3>👥 Team</h3>
            <button 
              className="hire-btn"
              onClick={() => setShowHireMenu(!showHireMenu)}
            >
              + Hire
            </button>
          </div>

          {showHireMenu && (
            <div className="hire-menu">
              {AVAILABLE_HIRES.filter(h => !state.employees.find(e => e.id === h.id)).map(hire => (
                <button
                  key={hire.id}
                  className="hire-option"
                  onClick={() => hireEmployee(hire)}
                >
                  <span className="hire-emoji">{hire.emoji}</span>
                  <div className="hire-info">
                    <span className="hire-name">{hire.name}</span>
                    <span className="hire-role">{hire.role}</span>
                  </div>
                  <span className="hire-cost">${hire.cost.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}

          <div className="employee-list">
            {state.employees.length === 0 ? (
              <div className="empty-team">
                <span>👆</span>
                <p>Click "Hire" to add employees</p>
              </div>
            ) : (
              state.employees.map(emp => (
                <div
                  key={emp.id}
                  className={`employee-card ${emp.status} ${selectedEmployee === emp.id ? 'selected' : ''}`}
                  onClick={() => handleEmployeeClick(emp.id)}
                >
                  <span className="emp-emoji">{emp.emoji}</span>
                  <div className="emp-info">
                    <span className="emp-name">{emp.name}</span>
                    <span className={`emp-status ${emp.status}`}>
                      {emp.status === 'working' ? '⚡ Working...' : '💤 Idle'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Panel */}
        <div className="demo-panel tasks-panel">
          <div className="panel-header">
            <h3>📋 Tasks</h3>
          </div>

          <div className="task-list">
            {state.tasks.map(task => {
              const assignee = state.employees.find(e => e.id === task.assigneeId);
              const typeEmoji = task.type === 'feature' ? '✨' : task.type === 'design' ? '🎨' : '🐛';
              
              return (
                <div
                  key={task.id}
                  className={`task-card ${task.status} ${selectedEmployee && task.status === 'todo' ? 'assignable' : ''}`}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="task-header">
                    <span className="task-type">{typeEmoji}</span>
                    <span className="task-title">{task.title}</span>
                    {task.status === 'done' && <span className="task-done">✓</span>}
                  </div>
                  
                  {task.status === 'in_progress' && (
                    <div className="task-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{task.progress}%</span>
                    </div>
                  )}
                  
                  {assignee && (
                    <div className="task-assignee">
                      <span>{assignee.emoji}</span>
                      <span>{assignee.name}</span>
                    </div>
                  )}
                  
                  {selectedEmployee && task.status === 'todo' && (
                    <div className="assign-hint">Click to assign</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Panel */}
        <div className="demo-panel code-panel">
          <div className="panel-header">
            <h3>💻 Generated Code</h3>
            {state.generatedCode.length > 0 && (
              <button 
                className="view-code-btn"
                onClick={() => setState(prev => ({ ...prev, showCode: !prev.showCode }))}
              >
                {state.showCode ? 'Hide' : 'View'} Code
              </button>
            )}
          </div>

          <div className="code-content">
            {state.generatedCode.length === 0 ? (
              <div className="empty-code">
                <span>🤖</span>
                <p>Assign tasks to see AI-generated code</p>
              </div>
            ) : state.showCode ? (
              <div className="code-files">
                {state.generatedCode.map((code, i) => (
                  <pre key={i} className="code-block">
                    <code>{code}</code>
                  </pre>
                ))}
              </div>
            ) : (
              <div className="code-summary">
                <span className="file-count">{state.generatedCode.length}</span>
                <span>files generated</span>
                <button onClick={() => setState(prev => ({ ...prev, showCode: true }))}>
                  View Code →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="demo-footer">
        {completedTasks === 3 ? (
          <div className="demo-complete">
            <span className="complete-icon">🎉</span>
            <div className="complete-text">
              <strong>You built a product!</strong>
              <span>Ready for the full experience?</span>
            </div>
            <button className="start-full-btn" onClick={onStartGame}>
              Start Full Game →
            </button>
          </div>
        ) : (
          <div className="demo-actions">
            <button className="reset-btn" onClick={resetDemo}>
              ↺ Reset Demo
            </button>
            <button className="start-btn" onClick={onStartGame}>
              Start Full Game →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiteDemo;
