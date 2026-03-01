import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger-ghost' | 'link';
  size?: 'sm' | 'md';
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger-ghost' | 'link';
  size?: 'sm' | 'md';
}

const variantStyles = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
  secondary:
    'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  ghost:
    'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800',
  'danger-ghost':
    'bg-transparent text-neutral-600 hover:bg-red-50 hover:text-red-700',
  link:
    'text-secondary-500 bg-secondary-50 border border-secondary-200 hover:bg-secondary-100',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs min-h-8',
  md: 'px-4 py-2 text-sm min-h-11',
};

const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-md cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'link',
  size = 'md',
  className = '',
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
