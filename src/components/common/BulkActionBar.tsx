import React from 'react';
import { CheckSquare, Square, Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onClearEntireSection: () => void;
  sectionLabel: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  totalCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onClearEntireSection,
  sectionLabel,
}) => {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  if (totalCount === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800/90 rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all my-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Select All Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isAllSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : selectedCount > 0
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700'
            }`}
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : isSomeSelected ? (
              <CheckSquare className="h-4 w-4 opacity-75" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
            <span>{isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-mono">
              {selectedCount} من {totalCount}
            </span>
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 flex items-center gap-1"
              title="إلغاء التحديد"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">إلغاء الاختيار</span>
            </button>
          )}
        </div>

        {/* Action Buttons: Delete selected OR Wipe entire section */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>حذف المحدد ({selectedCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClearEntireSection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition-colors"
            title={`مسح كافة بيانات ${sectionLabel}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>مسح سجل {sectionLabel} بالكامل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
