import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCardProducts } from '../../hooks/useCardProducts';
import type { CardProduct } from '../../types/card';

interface CardProductsTooltipProps {
  setCode: string;
  collectorNumber: string;
}

function ProductRow({ product }: { product: CardProduct }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(product.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li className="flex items-center gap-4 py-1.5 border-b border-neutral-100 last:border-0 group">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
        title="Copy to clipboard"
      >
        <span className="text-xs flex-1 leading-tight text-neutral-700 group-hover:text-neutral-900 transition-colors">
          {product.name}{copied && <span className="text-emerald-600 font-medium"> · Copied</span>}
        </span>
      </button>
      <div className="flex gap-1 flex-shrink-0">
        {product.availableNonFoil && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            NF
          </span>
        )}
        {product.availableFoil && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            F
          </span>
        )}
      </div>
    </li>
  );
}

export function CardProductsTooltip({ setCode, collectorNumber }: CardProductsTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading } = useCardProducts(setCode, collectorNumber);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Don't render anything if no products and not loading
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <div ref={wrapperRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 text-xs font-medium ml-3 px-1.5 py-0.5 rounded border border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
        aria-label="Available in products"
      >
        {isLoading ? (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <>
            Products
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} strokeWidth={3} />
          </>
        )}
      </button>

      {isOpen && products && products.length > 0 && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg p-2"
        >
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1 px-1">
            Available in products
          </p>
          <ul className="px-1">
            {products.map((product) => (
              <ProductRow key={product.uuid} product={product} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
