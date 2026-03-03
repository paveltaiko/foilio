import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import type { RefObject } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  placeholder?: string;
}

export function SearchInput({ value, onChange, isOpen, onClose, inputRef, placeholder = 'Search card...' }: SearchInputProps) {
  const [numericMode, setNumericMode] = useState(true);

  const handleClear = () => {
    onChange('');
    onClose();
  };

  const handleBlur = () => {
    if (!value) {
      onClose();
    }
  };

  const toggleMode = () => {
    setNumericMode((prev) => !prev);
    inputRef.current?.focus();
  };

  return createPortal(
    <div className={`fixed inset-x-0 top-0 z-[100] items-center bg-white px-3 py-3 shadow-md ${isOpen ? 'flex animate-fade-in' : 'hidden'}`}>
      <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2" strokeWidth={2.5} />
      <input
        ref={inputRef}
        type="text"
        inputMode={numericMode ? 'numeric' : 'text'}
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
        onClick={toggleMode}
        className={`
          sm:hidden h-7 px-2 mr-1 rounded text-xs font-medium shrink-0 cursor-pointer
          transition-colors duration-150
          ${numericMode ? 'bg-primary-50 text-primary-500' : 'bg-neutral-100 text-neutral-500'}
        `}
        aria-label="Přepnout klávesnici"
      >
        {numericMode ? 'ABC' : '123'}
      </button>
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
