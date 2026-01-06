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
  type?: 'text' | 'password';
}

export function Input({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  prompt = '>',
  autoFocus = true,
  multiline = false,
  maxLength,
  type = 'text'
}: InputProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Blinking cursor effect - only when focused
  useEffect(() => {
    if (!isFocused) {
      setCursorVisible(false);
      return;
    }
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, [isFocused]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const maskedValue = type === 'password' ? '•'.repeat(value.length) : value;
  const displayValue = maskedValue || placeholder;
  const isPlaceholder = !value && placeholder;

  if (multiline) {
    return (
      <div className={`tui-input multiline ${isFocused ? 'focused' : ''}`}>
        <span className="input-prompt">{prompt}</span>
        <div className="input-wrapper">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
    <div className={`tui-input ${isFocused ? 'focused' : ''}`}>
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="input-field"
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}

export default Input;
