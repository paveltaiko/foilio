import { Settings } from 'lucide-react';
import { Link } from 'react-router';

interface CollectionEmptyStateProps {
  gridKey: number;
}

export function CollectionEmptyState({ gridKey }: CollectionEmptyStateProps) {
  return (
    <div key={gridKey} className="animate-fade-in flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 mb-4">
        <Settings className="w-7 h-7 text-neutral-400" />
      </div>
      <h2 className="text-base font-semibold text-neutral-800 mb-1">No collection selected</h2>
      <p className="text-sm text-neutral-500 max-w-xs mb-5">
        Enable a collection in Settings to start tracking your cards.
      </p>
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
      >
        <Settings className="w-4 h-4" />
        Open Settings
      </Link>
    </div>
  );
}
