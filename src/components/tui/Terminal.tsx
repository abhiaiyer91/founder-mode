import type { ReactNode } from 'react';
import './Terminal.css';

interface TerminalProps {
  children: ReactNode;
  title?: string;
  showControls?: boolean;
  className?: string;
}

export function Terminal({ 
  children, 
  title = 'FOUNDER MODE', 
  showControls = true,
  className = ''
}: TerminalProps) {
  return (
    <div className={`terminal ${className}`}>
      <div className="terminal-header">
        <span className="terminal-title">{title}</span>
        {showControls && (
          <div className="terminal-controls">
            <span className="control minimize">─</span>
            <span className="control maximize">□</span>
            <span className="control close">×</span>
          </div>
        )}
      </div>
      <div className="terminal-body">
        {children}
      </div>
    </div>
  );
}

export default Terminal;
