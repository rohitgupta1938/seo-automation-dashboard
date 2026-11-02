'use client';
// components/charts/KeywordRankingTable.js
import { useState } from 'react';
import { Search, ArrowUpDown, TrendingUp } from 'lucide-react';

export default function KeywordRankingTable({ keywords = [] }) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('clicks');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = (keywords || []).filter((kw) =>
    (kw.query || kw.keyword || '').toLowerCase().includes(filter.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortKey] ?? 0;
    let valB = b[sortKey] ?? 0;
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  function toggleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function getPositionBadge(position) {
    const pos = Number(position);
    if (isNaN(pos)) return <span className="text-slate-400">N/A</span>;

    let color = 'bg-red-50 text-red-700 border-red-200';
    if (pos < 5) {
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (pos <= 10) {
      color = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
        #{pos.toFixed(1)}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Keyword Rankings</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {filtered.length}
          </span>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter keywords..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <th
                onClick={() => toggleSort('query')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1">
                  <span>Query / Keyword</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => toggleSort('clicks')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Clicks</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => toggleSort('impressions')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Impressions</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => toggleSort('ctr')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>CTR</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => toggleSort('position')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Position</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No keywords found
                </td>
              </tr>
            ) : (
              sorted.map((item, idx) => {
                const queryText = item.query || item.keyword || 'Unknown';
                const clicks = Number(item.clicks ?? 0);
                const impressions = Number(item.impressions ?? 0);
                const rawCtr = Number(item.ctr ?? 0);
                const ctrText = rawCtr > 1 ? `${rawCtr.toFixed(1)}%` : `${(rawCtr * 100).toFixed(1)}%`;
                const position = item.position ?? item.rank_absolute;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                      {queryText}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {ctrText}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getPositionBadge(position)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
