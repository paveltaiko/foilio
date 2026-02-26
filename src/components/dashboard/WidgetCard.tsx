interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function WidgetCard({ title, children, className = '' }: WidgetCardProps) {
  return (
    <div className={`bg-surface-primary border border-surface-border rounded-lg p-3 sm:p-4 flex flex-col gap-3 ${className}`}>
      <p className="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-600">
        {title}
      </p>
      {children}
    </div>
  );
}
