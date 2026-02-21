import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, isOpen, onClose, placeholder = 'Search card...' }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleClear = () => {
    onChange('');
    onClose();
  };

  const handleBlur = () => {
    if (!value) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center bg-white px-3 py-3 shadow-md animate-fade-in">
      <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2" strokeWidth={2.5} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="
          flex-1 h-9 text-sm bg-transparent
          focus:outline-none
          placeholder:text-neutral-400
        "
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClear}
        className="
          w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer
          text-neutral-400 hover:text-neutral-600
          transition-colors duration-150
        "
        aria-label="Close search"
      >
        <X className="w-5 h-5" />
      </button>
    </div>,
    document.body
  );
}
