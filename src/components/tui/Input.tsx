import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import './Input.css';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  prompt?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

export function Input({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  prompt = '>',
  autoFocus = true,
  multiline = false,
  maxLength
}: InputProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const displayValue = value || placeholder;
  const isPlaceholder = !value && placeholder;

  if (multiline) {
    return (
      <div className="tui-input multiline">
        <span className="input-prompt">{prompt}</span>
        <div className="input-wrapper">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field"
            placeholder={placeholder}
            maxLength={maxLength}
            rows={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tui-input">
      <span className="input-prompt">{prompt}</span>
      <div className="input-wrapper">
        <span className={`input-display ${isPlaceholder ? 'placeholder' : ''}`}>
          {displayValue}
        </span>
        <span className={`input-cursor ${cursorVisible ? 'visible' : ''}`}>█</span>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input-field"
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}

export default Input;
