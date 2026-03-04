interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeading({ children, className = '' }: SectionHeadingProps) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wider text-neutral-400 ${className}`}>
      {children}
    </p>
  );
}
