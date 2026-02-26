import { useState, useEffect } from 'react';
import { getBatchSize } from '../utils/responsive';

interface UseRenderBatchResult {
  renderBatchSize: number;
  renderLimit: number;
  setRenderLimit: React.Dispatch<React.SetStateAction<number>>;
}

export function useRenderBatch(resetTrigger?: unknown): UseRenderBatchResult {
  const [renderBatchSize, setRenderBatchSize] = useState(getBatchSize);
  const [renderLimit, setRenderLimit] = useState(getBatchSize);

  useEffect(() => {
    const onResize = () => {
      const next = getBatchSize();
      setRenderBatchSize(next);
      setRenderLimit((prev) => (prev < next ? next : prev));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset render limit when external trigger changes (e.g. active tab, search query)
  useEffect(() => {
    setRenderLimit(getBatchSize());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  return { renderBatchSize, renderLimit, setRenderLimit };
}
