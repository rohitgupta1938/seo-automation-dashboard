'use client';
// components/shared/RecommendationCard.js
import { getPriorityBadge } from '../../lib/utils';

export default function RecommendationCard({ rec }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getPriorityBadge(rec.priority)}`}>
          {rec.priority}
        </span>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          {rec.category}
        </span>
        <div className="ml-auto flex gap-2">
          <span className="text-xs text-slate-500">Impact: <strong className="text-slate-700">{rec.estimated_impact}</strong></span>
          <span className="text-xs text-slate-500">Effort: <strong className="text-slate-700">{rec.effort}</strong></span>
        </div>
      </div>
      <h4 className="font-semibold text-slate-800 mb-2 leading-tight">{rec.finding}</h4>
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{rec.fix}</p>
      {rec.falsifiability_check && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
          <p className="text-xs font-medium text-emerald-700 mb-0.5">✓ How to verify</p>
          <p className="text-xs text-emerald-600">{rec.falsifiability_check}</p>
        </div>
      )}
    </div>
  );
}
