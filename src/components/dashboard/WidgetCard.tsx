import { memo } from 'react';
import { SectionHeading } from '../ui/SectionHeading';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const WidgetCard = memo(function WidgetCard({ title, children, className = '' }: WidgetCardProps) {
  return (
    <div className={`bg-surface-primary border border-surface-border rounded-2xl p-[18px] sm:p-6 flex flex-col gap-3 ${className}`}>
      <SectionHeading className="text-neutral-600">{title}</SectionHeading>
      {children}
    </div>
  );
});
