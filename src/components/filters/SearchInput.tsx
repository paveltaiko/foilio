import { useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search card...' }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 min-w-0">
      {/* Search icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full h-9 pl-9 pr-8 text-sm
          bg-white border border-neutral-200 rounded-lg
          transition-colors duration-150
          focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100
          placeholder:text-neutral-400
        "
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            w-5 h-5 flex items-center justify-center
            text-neutral-400 hover:text-neutral-600
            transition-colors duration-150
          "
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
