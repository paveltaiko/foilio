import type { ReactNode } from 'react';

interface SegmentOption<T extends string> {
  id: T;
  label: ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  fullWidth = false,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex text-sm ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          title={option.title}
          className={`
            px-4 h-[38px] font-medium transition-colors duration-150 cursor-pointer relative
            border first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0
            ${fullWidth ? 'flex-1' : ''}
            ${value === option.id
              ? 'bg-primary-500 text-white border-primary-500 z-10'
              : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-700 hover:bg-neutral-50 z-0'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
