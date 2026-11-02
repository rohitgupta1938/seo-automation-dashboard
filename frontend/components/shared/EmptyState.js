'use client';
// components/shared/EmptyState.js
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EmptyState({
  icon: Icon = AlertCircle,
  title = 'No data found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
}) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center', className)}>
      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition shadow-sm hover:shadow"
        >
          {ActionIcon && <ActionIcon size={16} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
