/**
 * Ideate Screen - Chat with PM to break down vision into tasks
 * 
 * This is the ideation phase where the PM helps break down the project
 * vision into actionable tasks before development starts.
 */

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { TaskType, TaskPriority } from '../../types';
import { aiService } from '../../lib/ai';
import './IdeateScreen.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'pm';
  content: string;
  timestamp: number;
}

interface SuggestedTask {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  estimatedTicks: number;
}

export function IdeateScreen() {
  const project = useGameStore(state => state.project);
  const employees = useGameStore(state => state.employees);
  const tasks = useGameStore(state => state.tasks);
  const createTask = useGameStore(state => state.createTask);
  const completeIdeation = useGameStore(state => state.completeIdeation);
  const aiSettings = useGameStore(state => state.aiSettings);
  
  const pm = employees.find(e => e.role === 'pm');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start the conversation when component mounts
  useEffect(() => {
    if (!hasStarted && pm && project) {
      setHasStarted(true);
      startConversation();
    }
  }, [hasStarted, pm, project]);

  const startConversation = async () => {
    if (!pm || !project) return;
    
    // Add initial PM greeting
    const greeting: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'pm',
      content: `Hi! I'm ${pm.name}, your Product Manager. I've reviewed your vision:\n\n"${project.idea}"\n\nThis sounds exciting! Let me help you break this down into actionable tasks. What aspect should we tackle first? Or I can suggest a breakdown to get us started.`,
      timestamp: Date.now(),
    };
    setMessages([greeting]);
    
    // Auto-generate initial task suggestions
    await generateTaskSuggestions();
  };

  const generateTaskSuggestions = async () => {
    if (!project || !pm) return;
    
    setIsThinking(true);
    try {
      // Use AI to generate task breakdown
      if (aiSettings.enabled) {
        const existingTitles = tasks.map(t => t.title);
        const newTasks = await aiService.pmGenerateTasks(
          project.idea,
          existingTitles,
          { engineers: 0, designers: 0, marketers: 0 }
        );
        setSuggestedTasks(newTasks);
      } else {
        // Fallback: Generate mock tasks based on project type
        const mockTasks = generateMockTasks(project.projectType, project.idea);
        setSuggestedTasks(mockTasks);
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      // Use fallback
      const mockTasks = generateMockTasks(project?.projectType || 'frontend', project?.idea || '');
      setSuggestedTasks(mockTasks);
    }
    setIsThinking(false);
  };

  const generateMockTasks = (_projectType: string, idea: string): SuggestedTask[] => {
    const baseTasks: SuggestedTask[] = [
      {
        title: 'Project setup and configuration',
        description: 'Initialize project structure, configure build tools, and set up development environment.',
        type: 'infrastructure',
        priority: 'high',
        estimatedTicks: 60,
      },
      {
        title: 'Core data models',
        description: 'Define the main data structures and types for the application.',
        type: 'feature',
        priority: 'high',
        estimatedTicks: 80,
      },
      {
        title: 'User interface design',
        description: 'Create the main UI components and layout structure.',
        type: 'design',
        priority: 'medium',
        estimatedTicks: 100,
      },
      {
        title: 'Main feature implementation',
        description: `Implement the core functionality: ${idea.slice(0, 50)}...`,
        type: 'feature',
        priority: 'high',
        estimatedTicks: 150,
      },
      {
        title: 'Testing and validation',
        description: 'Write tests and validate core functionality works as expected.',
        type: 'infrastructure',
        priority: 'medium',
        estimatedTicks: 80,
      },
    ];
    
    return baseTasks;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    
    // Generate PM response
    setTimeout(() => {
      const pmResponse: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'pm',
        content: generatePMResponse(input.trim()),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, pmResponse]);
      setIsThinking(false);
    }, 1000 + Math.random() * 1000);
  };

  const generatePMResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    
    if (lower.includes('more') || lower.includes('add') || lower.includes('another')) {
      return "I'll add more tasks to the backlog. Based on our discussion, what specific area would you like me to focus on?";
    }
    
    if (lower.includes('ready') || lower.includes('done') || lower.includes('start') || lower.includes('build')) {
      return "Great! The task breakdown looks solid. Add the tasks you want to work on, and when you're ready, click 'Start Building' to hire an engineer and begin development!";
    }
    
    if (lower.includes('change') || lower.includes('modify') || lower.includes('update')) {
      return "Sure! You can remove tasks from the list or let me know what changes you'd like, and I'll regenerate suggestions.";
    }
    
    return `Good point about "${userInput.slice(0, 30)}...". I've noted that. Should I adjust the task priorities or add specific tasks for this?`;
  };

  const handleAddTask = (task: SuggestedTask) => {
    createTask({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: task.estimatedTicks,
    });
    
    // Remove from suggestions
    setSuggestedTasks(prev => prev.filter(t => t.title !== task.title));
    
    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'pm',
      content: `Added "${task.title}" to the backlog.`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleAddAllTasks = () => {
    suggestedTasks.forEach(task => {
      createTask({
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: 'backlog',
        assigneeId: null,
        estimatedTicks: task.estimatedTicks,
      });
    });
    
    setSuggestedTasks([]);
    
    const confirmMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'pm',
      content: `Added ${suggestedTasks.length} tasks to the backlog. Looking good! When you're ready, click "Start Building" to hire an engineer.`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const taskTypeColors: Record<TaskType, string> = {
    feature: '#00ff88',
    bug: '#ef4444',
    design: '#a855f7',
    infrastructure: '#3b82f6',
  };

  return (
    <div className="ideate-screen">
      {/* Header */}
      <header className="ideate-header">
        <div className="header-left">
          <div className="pm-avatar">&#9672;</div>
          <div className="pm-name">
            <span className="name">{pm?.name || 'PM'}</span>
            <span className="role">Product Manager</span>
          </div>
        </div>
        <div className="header-right">
          <div className="task-count">
            <span className="count">{tasks.length}</span>
            <span className="label">Tasks</span>
          </div>
          <button 
            className={`start-building-btn ${tasks.length > 0 ? 'ready' : ''}`}
            onClick={completeIdeation}
            disabled={tasks.length === 0}
          >
            Start Building &rarr;
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="ideate-content">
        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.role === 'pm' && <div className="avatar">&#9672;</div>}
                <div className="bubble">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="message pm">
                <div className="avatar">&#9672;</div>
                <div className="bubble thinking">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-area">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Discuss your vision with your PM..."
              rows={1}
            />
            <button 
              className="send-btn" 
              onClick={handleSendMessage}
              disabled={!input.trim() || isThinking}
            >
              Send
            </button>
          </div>
        </div>

        {/* Tasks Panel */}
        <div className="tasks-panel">
          {/* Suggested Tasks */}
          {suggestedTasks.length > 0 && (
            <div className="task-section">
              <div className="section-header">
                <h3>Suggested Tasks</h3>
                <button className="add-all-btn" onClick={handleAddAllTasks}>
                  Add All
                </button>
              </div>
              <div className="task-list">
                {suggestedTasks.map((task, i) => (
                  <div key={i} className="task-card suggested">
                    <div className="task-header">
                      <span 
                        className="task-type"
                        style={{ color: taskTypeColors[task.type] }}
                      >
                        {task.type}
                      </span>
                      <span className="task-priority">{task.priority}</span>
                    </div>
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    <button className="add-task-btn" onClick={() => handleAddTask(task)}>
                      + Add Task
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Added Tasks */}
          {tasks.length > 0 && (
            <div className="task-section">
              <div className="section-header">
                <h3>Backlog</h3>
                <span className="task-count-badge">{tasks.length}</span>
              </div>
              <div className="task-list added">
                {tasks.map((task) => (
                  <div key={task.id} className="task-card added">
                    <div className="task-header">
                      <span 
                        className="task-type"
                        style={{ color: taskTypeColors[task.type] }}
                      >
                        {task.type}
                      </span>
                      <span className="task-priority">{task.priority}</span>
                    </div>
                    <h4>{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestedTasks.length === 0 && tasks.length === 0 && (
            <div className="empty-state">
              <p>Chat with your PM to generate task suggestions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IdeateScreen;
