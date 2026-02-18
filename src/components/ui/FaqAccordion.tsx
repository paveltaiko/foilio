import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-primary divide-y divide-surface-border overflow-hidden">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 text-left cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <h3 className="text-sm sm:text-base font-semibold text-neutral-800">{item.question}</h3>
              <ChevronDown
                className={`w-5 h-5 text-neutral-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>
            {isOpen && (
              <p className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm leading-6 text-neutral-600">
                {item.answer}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
