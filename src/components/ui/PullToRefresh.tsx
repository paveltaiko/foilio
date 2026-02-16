import { useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

const THRESHOLD_PX = 135;
const REFRESH_HOLD_PX = 82;
const REVEAL_START_PX = 60;

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const canPullRef = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getScrollContainer = () => rootRef.current?.closest('main');
  const getMaxPullPx = () => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return Math.max(220, Math.floor(vh * 0.5));
  };
  const applyResistance = (delta: number) => {
    if (delta <= 0) return 0;
    const maxPull = getMaxPullPx();
    // Consistent feel across the whole drag.
    return Math.min(maxPull, delta * 0.72);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    const scrollContainer = getScrollContainer();
    if (!scrollContainer || scrollContainer.scrollTop > 0) {
      canPullRef.current = false;
      startYRef.current = null;
      return;
    }
    canPullRef.current = true;
    startYRef.current = e.touches[0].clientY;
    setIsPulling(false);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing || !canPullRef.current || startYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    const distance = applyResistance(delta);
    setPullDistance(distance);
    setIsPulling(true);
    e.preventDefault();
  };

  const onTouchEnd = async () => {
    if (disabled || isRefreshing || !canPullRef.current) return;
    canPullRef.current = false;
    startYRef.current = null;

    if (pullDistance >= THRESHOLD_PX) {
      setIsRefreshing(true);
      setPullDistance(REFRESH_HOLD_PX);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }
      return;
    }

    setPullDistance(0);
    setIsPulling(false);
  };

  const indicatorVisible = pullDistance > REVEAL_START_PX || isRefreshing;
  const revealProgress = Math.max(
    0,
    Math.min(1, (pullDistance - REVEAL_START_PX) / Math.max(1, THRESHOLD_PX - REVEAL_START_PX))
  );
  const reveal = isRefreshing ? 1 : revealProgress;
  const indicatorY = -12 + reveal * 28;
  const spokeCount = 12;
  const activeSpokes = Math.max(1, Math.round(reveal * spokeCount));

  return (
    <div
      ref={rootRef}
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{
          opacity: indicatorVisible ? 1 : 0,
          transform: `translateY(${indicatorY}px)`,
          transition: isPulling ? 'none' : 'opacity 160ms ease, transform 220ms ease',
        }}
      >
        <div
          className="relative flex items-center justify-center text-primary-500"
          style={{
            width: 40,
            height: 40,
            transform: `scale(${0.9 + reveal * 0.1})`,
            opacity: 0.28 + reveal * 0.72,
          }}
        >
          <div
            className={isRefreshing ? 'animate-spin' : ''}
            style={{
              width: 30,
              height: 30,
              transform: isRefreshing ? undefined : `rotate(${reveal * 120}deg)`,
              transition: isPulling ? 'none' : 'transform 260ms ease',
              animationDuration: isRefreshing ? '1.35s' : undefined,
            }}
          >
            {Array.from({ length: spokeCount }).map((_, i) => {
              const shown = i < activeSpokes;
              const alpha = shown ? 0.35 + (i / Math.max(1, activeSpokes)) * 0.55 : 0.12;
              return (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 block rounded-full bg-primary-500"
                  style={{
                    width: 2,
                    height: 8,
                    marginLeft: -1,
                    marginTop: -4,
                    transform: `rotate(${i * (360 / spokeCount)}deg) translateY(-11px)`,
                    opacity: alpha,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${isRefreshing ? REFRESH_HOLD_PX : pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 320ms cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
