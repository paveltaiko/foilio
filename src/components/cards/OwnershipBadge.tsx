import { Check } from 'lucide-react';

export interface OwnershipBadgeProps {
  variant: 'nonfoil' | 'foil';
  isOwned: boolean;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  className?: string;
  readOnly?: boolean;
}

export function OwnershipBadge({ variant, isOwned, label, onClick, children, className = '', readOnly = false }: OwnershipBadgeProps) {
  const baseClass = `flex flex-1 items-center justify-center gap-0.5 leading-none font-semibold rounded-image-sm transition-all duration-200 ${className}`;

  const colorClass = variant === 'foil'
    ? isOwned
      ? 'bg-purple-100 text-foil-purple hover:bg-purple-200'
      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
    : isOwned
      ? 'bg-green-100 text-owned hover:bg-green-200'
      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200';

  const content = children ?? (
    <>
      {isOwned && !onClick && !readOnly && <Check className="w-3 h-3 shrink-0" strokeWidth={3} />}
      {label}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClass} ${colorClass} active:scale-95 cursor-pointer`}>
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClass} ${colorClass}`}>
      {content}
    </div>
  );
}
