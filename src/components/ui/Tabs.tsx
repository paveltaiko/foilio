import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

// Mobile dropdown component
function MobileDropdown({ tabs, activeTab, onChange }: TabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = useCallback((id: string) => {
    onChange(id);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-surface-border rounded-lg text-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <span>{activeTabData?.label}</span>
          {activeTabData?.count !== undefined && (
            <span className="px-1.5 py-0.5 text-2xs font-medium bg-primary-50 text-primary-600 rounded-full">
              {activeTabData.count}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors cursor-pointer
                ${activeTab === tab.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-700 hover:bg-neutral-50'
                }
              `}
              role="option"
              aria-selected={activeTab === tab.id}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 text-2xs font-medium rounded-full ${activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Desktop tabs component
function DesktopTabs({ tabs, activeTab, onChange }: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeEl = tabRefs.current.get(activeTab);
    if (activeEl) {
      const parent = activeEl.parentElement;
      if (parent) {
        setIndicatorStyle({
          left: activeEl.offsetLeft - parent.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="relative border-b border-surface-border">
      <div className="flex overflow-x-auto scrollbar-hide -mb-px touch-pan-x">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
            }}
            onClick={() => onChange(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer
              border-b-2 border-transparent whitespace-nowrap flex-shrink-0
              ${activeTab === tab.id
                ? 'text-primary-500'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 text-2xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Animated underline indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-primary-500 transition-all duration-200 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
    </div>
  );
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="block md:hidden">
        <MobileDropdown tabs={tabs} activeTab={activeTab} onChange={onChange} />
      </div>
      {/* Desktop: Traditional tabs */}
      <div className="hidden md:block">
        <DesktopTabs tabs={tabs} activeTab={activeTab} onChange={onChange} />
      </div>
    </>
  );
}
