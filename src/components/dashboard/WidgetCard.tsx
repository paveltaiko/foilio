import { SectionHeading } from '../ui/SectionHeading';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function WidgetCard({ title, children, className = '' }: WidgetCardProps) {
  return (
    <div className={`bg-surface-primary border border-surface-border rounded-2xl p-3 sm:p-4 flex flex-col gap-3 ${className}`}>
      <SectionHeading className="text-neutral-600">{title}</SectionHeading>
      {children}
    </div>
  );
}
