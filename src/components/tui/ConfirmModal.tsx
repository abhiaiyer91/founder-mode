import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  }, [onCancel, onConfirm]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div 
        className={`confirm-modal ${variant}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="confirm-modal-header">
          <div className="modal-icon">
            {variant === 'danger' && '⚠'}
            {variant === 'warning' && '⚡'}
            {variant === 'default' && '?'}
          </div>
          <h3 id="modal-title" className="modal-title">{title}</h3>
        </div>
        
        <div className="confirm-modal-body">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        
        <div className="confirm-modal-footer">
          <button 
            className="modal-btn cancel-btn" 
            onClick={onCancel}
            type="button"
          >
            <kbd>ESC</kbd> {cancelLabel}
          </button>
          <button 
            className={`modal-btn confirm-btn ${variant}`}
            onClick={onConfirm}
            type="button"
            autoFocus
          >
            <kbd>↵</kbd> {confirmLabel}
          </button>
        </div>
        
        <div className="confirm-modal-border-glow" />
      </div>
    </div>
  );
}

export default ConfirmModal;

