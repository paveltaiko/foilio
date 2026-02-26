import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function IconButton({ active = false, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`
        flex items-center justify-center h-[38px] w-[38px]
        cursor-pointer transition-colors duration-150
        border rounded-lg
        disabled:opacity-60 disabled:cursor-not-allowed
        ${active
          ? 'bg-primary-500 text-white border-primary-500'
          : 'bg-white text-neutral-500 border-surface-border hover:text-neutral-700 hover:bg-neutral-50'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
