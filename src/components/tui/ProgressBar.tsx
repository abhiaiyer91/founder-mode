import './ProgressBar.css';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  width?: number; // Character width
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  width = 10,
  showLabel = false,
  label,
  variant = 'default',
  animated = false
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const filledCount = Math.round((percentage / 100) * width);
  const emptyCount = width - filledCount;

  const filled = '█'.repeat(filledCount);
  const empty = '░'.repeat(emptyCount);

  return (
    <div className={`tui-progress ${variant} ${animated ? 'animated' : ''}`}>
      {label && <span className="progress-label">{label}</span>}
      <span className="progress-bar">
        <span className="progress-filled">{filled}</span>
        <span className="progress-empty">{empty}</span>
      </span>
      {showLabel && (
        <span className="progress-value">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

export default ProgressBar;
