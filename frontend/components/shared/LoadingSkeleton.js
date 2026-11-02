'use client';
// components/shared/LoadingSkeleton.js
import { cn } from '../../lib/utils';

export default function LoadingSkeleton({ type = 'card', count = 1, className }) {
  const items = Array.from({ length: count });

  if (type === 'stat') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5', className)}>
        {items.map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden', className)}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-8 bg-slate-200 rounded w-48" />
        </div>
        <div className="divide-y divide-slate-100 animate-pulse">
          {items.map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/6" />
              <div className="h-8 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={cn('bg-white rounded-2xl border border-slate-200 p-6 animate-pulse', className)}>
        <div className="h-5 bg-slate-200 rounded w-40 mb-6" />
        <div className="h-64 bg-slate-100 rounded-xl flex items-end justify-between p-6 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-200 rounded-t"
              style={{ height: `${25 + (i * 12) % 65}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn('space-y-3 animate-pulse', className)}>
        {items.map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  // Default card
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
