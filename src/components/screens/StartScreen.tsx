import { useState } from 'react';
import { Terminal, Input, Box } from '../tui';
import { useGameStore } from '../../store/gameStore';
import './StartScreen.css';

export function StartScreen() {
  const [idea, setIdea] = useState('');
  const startProject = useGameStore(state => state.startProject);

  const handleSubmit = () => {
    if (idea.trim().length > 10) {
      startProject(idea.trim());
    }
  };

  return (
    <div className="start-screen">
      <Terminal title="FOUNDER MODE v0.1.0">
        <div className="start-content">
          <div className="logo-section">
            <pre className="ascii-logo">
{`
 ███████╗ ██████╗ ██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗ 
 ██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
 █████╗  ██║   ██║██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
 ██╔══╝  ██║   ██║██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
 ██║     ╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║
 ╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝
                     ███╗   ███╗ ██████╗ ██████╗ ███████╗
                     ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
                     ██╔████╔██║██║   ██║██║  ██║█████╗  
                     ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  
                     ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
                     ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
`}
            </pre>
            <p className="tagline">Build a real startup. Ship real code. Play the game.</p>
          </div>

          <Box title="WELCOME, FOUNDER" variant="accent" className="idea-box">
            <div className="idea-section">
              <p className="prompt-text">
                You have <span className="highlight">$100,000</span> in seed funding and a dream.
              </p>
              <p className="prompt-text">
                What will you build?
              </p>
              
              <div className="idea-input">
                <Input
                  value={idea}
                  onChange={setIdea}
                  onSubmit={handleSubmit}
                  placeholder="Describe your startup idea..."
                  prompt=">"
                  multiline
                />
              </div>

              <div className="char-count">
                {idea.length}/500 characters {idea.length < 10 && idea.length > 0 && (
                  <span className="warning">(minimum 10)</span>
                )}
              </div>

              <div className="submit-hint">
                {idea.length >= 10 ? (
                  <span className="ready">Press <kbd>Enter</kbd> to begin your journey</span>
                ) : (
                  <span className="waiting">Describe your vision to continue...</span>
                )}
              </div>

              {/* Mobile-friendly start button */}
              {idea.length >= 10 && (
                <button className="mobile-start-btn" onClick={handleSubmit}>
                  🚀 Start Building
                </button>
              )}
            </div>
          </Box>

          <div className="tips-section">
            <p className="tip">💡 <strong>Tip:</strong> Be specific! "A task management app for remote teams" works better than "an app"</p>
          </div>
        </div>
      </Terminal>
    </div>
  );
}

export default StartScreen;
