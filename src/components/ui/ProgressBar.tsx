interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  // Color changes based on completion
  const barColor =
    clampedValue >= 75 ? 'bg-owned' : 'bg-primary-500';

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${barColor}`}
          style={{ width: `${clampedValue}%`, minWidth: clampedValue > 0 ? '8px' : '0' }}
        />
      </div>
    </div>
  );
}
