'use client';
// components/shared/StatCard.js
import { cn } from '../../lib/utils';

export default function StatCard({ title, value, icon: Icon, color = 'teal', subtitle, trend }) {
  const colors = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors[color])}>
            <Icon size={22} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className={cn('text-xs font-medium', trend.up ? 'text-emerald-600' : 'text-red-500')}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-slate-400 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
