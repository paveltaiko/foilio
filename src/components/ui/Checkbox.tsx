interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative h-5 w-5 shrink-0 rounded-md border-2 transition-all cursor-pointer
        ${checked
          ? 'bg-primary-500 border-primary-500'
          : 'bg-white border-neutral-300 hover:border-neutral-400'
        }
        ${disabled ? 'cursor-not-allowed opacity-40' : ''}
      `}
    >
      {checked && (
        <svg
          viewBox="0 0 12 10"
          fill="none"
          className="absolute inset-0 m-auto h-3 w-3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="1,5 4.5,8.5 11,1" stroke="white" strokeWidth="1.8" fill="none" />
        </svg>
      )}
    </button>
  );
}
