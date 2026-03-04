import { memo } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Active track color. Defaults to 'primary'. */
  color?: 'primary' | 'neutral';
  /** Screen-reader label. */
  label?: string;
  /** Stop click propagation (useful when toggle is inside a clickable parent). */
  stopPropagation?: boolean;
}

export const Toggle = memo(function Toggle({
  checked,
  onChange,
  color = 'primary',
  label,
  stopPropagation = false,
}: ToggleProps) {
  const activeColor = color === 'primary' ? 'bg-primary-500' : 'bg-neutral-700';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? activeColor : 'bg-neutral-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
});
