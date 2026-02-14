interface BadgeProps {
  variant: 'owned' | 'foil' | 'not-owned' | 'set-label';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<BadgeProps['variant'], string> = {
  owned:
    'bg-owned-bg text-owned border-owned-border',
  foil:
    'bg-foil-bg text-foil-purple border-foil-border',
  'not-owned':
    'bg-neutral-100 text-neutral-400 border-neutral-200',
  'set-label':
    'bg-neutral-100 text-neutral-700 border-neutral-200 font-mono font-bold',
};

export function Badge({ variant, children, onClick, className = '' }: BadgeProps) {
  const base =
    'inline-flex items-center px-2 py-0.5 text-2xs font-medium tracking-wide uppercase rounded-sm border transition-all duration-200';
  const interactive = onClick ? 'cursor-pointer active:scale-95 hover:opacity-80' : '';

  return (
    <span
      className={`${base} ${variantStyles[variant]} ${interactive} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </span>
  );
}
