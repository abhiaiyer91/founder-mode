/**
 * Landing Page - Command Center Style
 * 
 * Retro-futuristic game launcher aesthetic
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useSession } from '../../lib/auth';
import './LandingPage.css';

// Animated typing effect
function TypeWriter({ texts, speed = 50 }: { texts: string[]; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed]);

  return <span className="typewriter">{displayText}<span className="cursor">_</span></span>;
}

// Animated counter
function Counter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end, started]);

  useEffect(() => {
    if (!started) return;

    const step = end / (duration / 16);
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= end) {
          clearInterval(interval);
          return end;
        }
        return Math.min(prev + step, end);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [started, end, duration]);

  return <span id={`counter-${end}`}>{Math.floor(count)}{suffix}</span>;
}

// Feature card
function FeatureCard({ icon, title, description, tag }: { 
  icon: string; 
  title: string; 
  description: string;
  tag?: string;
}) {
  return (
    <div className="feature-card">
      {tag && <span className="feature-tag">{tag}</span>}
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// Mini game preview for hero
function GamePreview({ onStart }: { onStart: () => void }) {
  const [tasks, setTasks] = useState([
    { id: 1, file: 'AuthModule.tsx', progress: 0, assignee: 'Alex' },
    { id: 2, file: 'Dashboard.css', progress: 0, assignee: 'Sam' },
    { id: 3, file: 'TaskList.tsx', progress: 0, assignee: 'Jordan' },
  ]);

  // Animate progress sequentially
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => {
        const updated = [...prev];
        // Find first incomplete task
        const activeIdx = updated.findIndex(t => t.progress < 100);
        if (activeIdx !== -1) {
          updated[activeIdx].progress = Math.min(updated[activeIdx].progress + 3, 100);
        }
        return updated;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Reset when all done
  useEffect(() => {
    if (tasks.every(t => t.progress >= 100)) {
      const timeout = setTimeout(() => {
        setTasks(prev => prev.map(t => ({ ...t, progress: 0 })));
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [tasks]);

  const completedCount = tasks.filter(t => t.progress >= 100).length;

  return (
    <div className="game-preview">
      <div className="gp-header">
        <span className="gp-title">Your AI Team is Building...</span>
        <span className="gp-counter">{completedCount}/{tasks.length}</span>
      </div>

      <div className="gp-tasks">
        {tasks.map(task => (
          <div key={task.id} className={`gp-task ${task.progress >= 100 ? 'done' : task.progress > 0 ? 'active' : ''}`}>
            <div className="gp-task-left">
              <span className="gp-task-status">
                {task.progress >= 100 ? '✓' : task.progress > 0 ? '◐' : '○'}
              </span>
              <span className="gp-task-file">{task.file}</span>
            </div>
            <div className="gp-task-right">
              <span className="gp-task-assignee">{task.assignee}</span>
              {task.progress > 0 && task.progress < 100 && (
                <div className="gp-task-bar">
                  <div className="gp-task-fill" style={{ width: `${task.progress}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="gp-code-preview">
        <div className="gp-code-header">
          <span className="gp-code-dot" />
          <span>AuthModule.tsx</span>
        </div>
        <pre className="gp-code-content">
{`export function AuthModule() {
  const [user, setUser] = useState(null);
  
  return (
    <div className="auth">
      <LoginForm onSuccess={setUser} />
    </div>
  );
}`}
        </pre>
      </div>

      <button className="gp-cta" onClick={onStart}>
        Try it yourself →
      </button>
    </div>
  );
}

export function LandingPage() {
  const { startProject } = useGameStore();
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');

  const handleLaunch = () => {
    if (!session) {
      // Not logged in - redirect to login with return URL
      navigate('/login?redirect=/start');
    } else {
      // Logged in - go to start page
      navigate('/start');
    }
  };

  const handleStart = () => {
    // Store idea for after auth
    if (idea.trim()) {
      localStorage.setItem('founder-mode-idea', idea.trim());
    }
    
    if (!session) {
      navigate('/login?redirect=/start');
      return;
    }
    
    // If logged in with a valid idea, start immediately
    if (idea.trim().length >= 10) {
      startProject(idea.trim());
    } else {
      navigate('/start');
    }
  };

  const productIdeas = [
    'an AI-powered task manager',
    'a marketplace for indie games',
    'a social network for developers',
    'a fitness app with AI coach',
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="header">
        <nav className="nav">
          <div className="logo">
            <span className="logo-icon">⌘</span>
            <span className="logo-text">Founder Mode</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">Process</a>
            {session ? (
              <>
                <Link to="/projects" className="nav-projects">My Projects</Link>
                <span className="nav-user">👤 {session.user?.name || 'Founder'}</span>
              </>
            ) : (
              <Link to="/login" className="nav-login">Login</Link>
            )}
            <button className="nav-cta" onClick={handleLaunch}>
              Launch →
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="badge">System Online • Real-Time AI Generation</div>
            <h1>
              Build products.<br />
              <span className="gradient-text">Ship real code.</span><br />
              Win the game.
            </h1>
            <p className="hero-description">
              Command your AI team to build{' '}
              <TypeWriter texts={productIdeas} speed={60} />
            </p>
            
            <div className="hero-input">
              <input
                type="text"
                placeholder="Describe your startup idea..."
                value={idea}
                onChange={e => setIdea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
              <button onClick={handleStart}>
                Initialize
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value"><Counter end={16000} suffix="+" /></span>
                <span className="stat-label">Lines Generated</span>
              </div>
              <div className="stat">
                <span className="stat-value"><Counter end={270} /></span>
                <span className="stat-label">Tests Passing</span>
              </div>
              <div className="stat">
                <span className="stat-value"><Counter end={18} /></span>
                <span className="stat-label">AI Models</span>
              </div>
            </div>
          </div>

          <div className="hero-demo">
            <GamePreview onStart={handleStart} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2>System Capabilities</h2>
          <p>A complete AI-powered development environment disguised as a game</p>
        </div>

        <div className="features-grid">
          <FeatureCard
            icon="◈"
            title="Real Code Generation"
            description="Your AI team writes TypeScript, React, and CSS. Not mockups — actual deployable code."
            tag="Core"
          />
          <FeatureCard
            icon="◎"
            title="RTS Gameplay"
            description="Select units, assign tasks, manage resources. Classic strategy mechanics with real output."
          />
          <FeatureCard
            icon="◇"
            title="Agent Memory"
            description="Employees remember context. Your senior dev knows your codebase better over time."
          />
          <FeatureCard
            icon="▣"
            title="Live Preview"
            description="See generated code running instantly. Sandpack integration for real-time feedback."
          />
          <FeatureCard
            icon="◉"
            title="GitHub Sync"
            description="Push generated code directly to your repositories. OAuth integration included."
          />
          <FeatureCard
            icon="⬡"
            title="18+ AI Models"
            description="OpenAI, Anthropic, Google, Groq, or local Ollama. Configure per employee."
            tag="Pro"
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2>How it works</h2>
          <p>From idea to deployed code in minutes</p>
        </div>

        <div className="process-flow">
          <div className="process-step">
            <div className="process-card">
              <h3><span className="step-num">1</span> Describe</h3>
              <p>Tell us what you want to build in plain English</p>
              <code>"An AI task manager with collaboration"</code>
            </div>
          </div>

          <div className="process-step">
            <div className="process-card">
              <h3><span className="step-num">2</span> Assemble</h3>
              <p>Hire your AI team — engineers, designers, PMs</p>
              <div className="process-team">
                <span>+3 eng</span>
                <span>+1 design</span>
                <span>+1 PM</span>
              </div>
            </div>
          </div>

          <div className="process-step">
            <div className="process-card">
              <h3><span className="step-num">3</span> Build</h3>
              <p>Watch real-time as your team generates code</p>
              <div className="process-files">
                <div className="file-row"><span>Dashboard.tsx</span><span className="done">✓</span></div>
                <div className="file-row active"><span>TaskList.tsx</span><span className="building">78%</span></div>
              </div>
            </div>
          </div>

          <div className="process-step">
            <div className="process-card">
              <h3><span className="step-num">4</span> Ship</h3>
              <p>Push to GitHub and deploy</p>
              <div className="process-deploy">
                <span className="deploy-icon">◉</span>
                <span>github.com/you/app</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to build?</h2>
          <p>No credit card. Start in simulation mode, connect AI when ready.</p>
          
          <div className="cta-input">
            <input
              type="text"
              placeholder="Your startup idea..."
              value={idea}
              onChange={e => setIdea(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
            <button onClick={handleStart}>
              Launch
            </button>
          </div>

          <div className="cta-features">
            <span>✓ Free tier</span>
            <span>✓ Real code output</span>
            <span>✓ GitHub export</span>
            <span>✓ 18 AI models</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="logo">
            <span className="logo-icon">⌘</span>
            <span className="logo-text">Founder Mode</span>
          </div>
          <p className="footer-tagline">Build real products with AI</p>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Founder Mode</p>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;

