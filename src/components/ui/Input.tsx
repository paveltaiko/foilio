import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
}

export function Input({ label, prefix, className = '', ...props }: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-neutral-600 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-mono">
            {prefix}
          </span>
        )}
        <input
          className={`
            w-full h-10 px-3 text-sm font-mono text-right
            bg-white border border-neutral-200 rounded-md
            transition-colors duration-150
            focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100
            placeholder:text-neutral-400
            disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
            ${prefix ? 'pl-8' : ''}
          `}
          {...props}
        />
      </div>
    </div>
  );
}
