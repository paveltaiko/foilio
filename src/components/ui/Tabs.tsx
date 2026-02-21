import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
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

// Dropdown component (used on mobile and when tabs overflow on desktop)
function Dropdown({ tabs, activeTab, onChange }: TabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

const OVERFLOW_BTN_WIDTH = 80; // px reserved for the "More" button

// Desktop tabs — visible tabs + "More ▾" dropdown for overflow tabs
function DesktopTabs({ tabs, activeTab, onChange }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [visibleCount, setVisibleCount] = useState<number | undefined>(undefined);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Recalculate how many tabs fit
  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const available = container.clientWidth;
    let used = 0;
    let count = 0;
    for (const tab of tabs) {
      const el = tabRefs.current.get(tab.id);
      if (!el) continue;
      const width = el.offsetWidth;
      // Reserve space for "More" button unless this would be the last tab
      const wouldBeMore = count + 1 < tabs.length;
      if (used + width + (wouldBeMore ? OVERFLOW_BTN_WIDTH : 0) > available) break;
      used += width;
      count++;
    }
    setVisibleCount(count === 0 ? 1 : count);
  }, [tabs]);

  // useLayoutEffect — runs synchronously after DOM paint, refs are ready
  useLayoutEffect(() => {
    recalculate();
    const observer = new ResizeObserver(recalculate);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [recalculate]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = visibleCount ?? 0;
  const hiddenTabs = visibleCount !== undefined ? tabs.slice(count) : [];
  const activeInHidden = hiddenTabs.some((t) => t.id === activeTab);
  const measured = visibleCount !== undefined;

  return (
    <div ref={containerRef} className="border-b border-surface-border">
      <div className={`flex -mb-px items-end ${measured ? '' : 'invisible'}`}>
        {/* All tabs rendered for measurement; hidden ones are invisible + non-interactive */}
        {tabs.map((tab, i) => {
          const isHidden = measured && i >= count;
          return (
            <button
              key={tab.id}
              ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
              onClick={() => !isHidden && onChange(tab.id)}
              aria-hidden={isHidden}
              className={`
                px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer
                border-b-2 whitespace-nowrap flex-shrink-0
                ${isHidden ? 'invisible pointer-events-none absolute' : ''}
                ${!isHidden && activeTab === tab.id
                  ? 'text-primary-500 border-primary-500'
                  : !isHidden
                    ? 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
                    : 'border-transparent'
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
          );
        })}

        {/* "More" button for hidden tabs */}
        {measured && hiddenTabs.length > 0 && (
          <div ref={moreRef} className="relative flex-shrink-0">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className={`
                px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer
                border-b-2 whitespace-nowrap flex items-center gap-1
                ${activeInHidden
                  ? 'text-primary-500 border-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
                }
              `}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>

            {moreOpen && (
              <div className="absolute z-50 top-full right-0 mt-1 w-max bg-white border border-surface-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {hiddenTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { onChange(tab.id); setMoreOpen(false); }}
                    className={`
                      w-full flex items-center justify-between gap-4 px-4 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`ml-3 px-1.5 py-0.5 text-2xs font-medium rounded-full ${activeTab === tab.id
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
        )}
      </div>
    </div>
  );
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="block md:hidden">
        <Dropdown tabs={tabs} activeTab={activeTab} onChange={onChange} />
      </div>
      {/* Desktop: Tabs with overflow fallback to dropdown */}
      <div className="hidden md:block">
        <DesktopTabs tabs={tabs} activeTab={activeTab} onChange={onChange} />
      </div>
    </>
  );
}
