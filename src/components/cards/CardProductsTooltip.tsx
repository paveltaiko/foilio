import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useCardProducts } from '../../hooks/useCardProducts';
import type { CardProduct } from '../../types/card';

const TOOLTIP_WIDTH = 288; // w-72 = 18rem = 288px
const VIEWPORT_PADDING = 8; // min distance from viewport edge

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

function calcPortalStyle(buttonRef: React.RefObject<HTMLElement | null>): CSSProperties {
  if (!buttonRef.current) return { position: 'fixed', top: 0, left: 0 };

  const rect = buttonRef.current.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  // Ideal: center on button
  const idealLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;

  // Clamp within viewport
  const clampedLeft = Math.max(
    VIEWPORT_PADDING,
    Math.min(idealLeft, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING)
  );

  return {
    position: 'fixed',
    top: rect.bottom + 6,
    left: clampedLeft,
    width: TOOLTIP_WIDTH,
  };
}

export function CardProductsTooltip({ setCode, collectorNumber }: CardProductsTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading } = useCardProducts(setCode, collectorNumber);
  const hasProducts = !!products && products.length > 0;
  const isDisabled = !isLoading && !hasProducts;

  // Recalculate position whenever tooltip opens or viewport resizes
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setPortalStyle(calcPortalStyle(buttonRef));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  // Close on click outside — ignore clicks inside the portal tooltip
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <span className="inline-flex items-center min-w-[82px]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (isDisabled) return;
          setIsOpen((v) => !v);
        }}
        className={`inline-flex items-center justify-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded border transition-colors min-h-[22px] ${
          isDisabled
            ? 'border-neutral-200 text-neutral-300 cursor-default'
            : 'border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 cursor-pointer'
        }`}
        aria-label="Available in products"
        disabled={isDisabled}
      >
        {isLoading ? (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <>
            Products
            {hasProducts && <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} strokeWidth={3} />}
          </>
        )}
      </button>

      {isOpen && hasProducts && createPortal(
        <div
          ref={tooltipRef}
          className="z-[9999] w-72 bg-white border border-neutral-200 rounded-lg shadow-lg p-2"
          style={portalStyle}
        >
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1 px-1">
            Available in products
          </p>
          <ul className="px-1">
            {products.map((product) => (
              <ProductRow key={product.uuid} product={product} />
            ))}
          </ul>
        </div>,
        document.body
      )}
    </span>
  );
}
