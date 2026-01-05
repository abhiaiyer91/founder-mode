import type { ReactNode } from 'react';
import './Box.css';

interface BoxProps {
  children: ReactNode;
  title?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Box({ 
  children, 
  title, 
  variant = 'default',
  className = '' 
}: BoxProps) {
  return (
    <div className={`tui-box ${variant} ${className}`}>
      {title && (
        <div className="box-title">
          <span className="box-title-text">{title}</span>
        </div>
      )}
      <div className="box-content">
        {children}
      </div>
    </div>
  );
}

export default Box;
