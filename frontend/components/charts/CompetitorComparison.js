'use client';
// components/charts/CompetitorComparison.js
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function CompetitorComparison({ data = [], clientDomain = '', height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl text-slate-400 text-sm">
        No competitor ranking data available
      </div>
    );
  }

  // Format data for comparison
  const chartData = data.map((item) => {
    const domain = item.domain || item.name || 'Unknown';
    const position = item.rank_absolute ?? item.position ?? item.rank ?? 0;
    const isClient =
      item.isClient ||
      (clientDomain && domain.toLowerCase().includes(clientDomain.toLowerCase())) ||
      item.type === 'client';

    return {
      domain,
      position,
      isClient,
    };
  });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="domain"
            tick={{ fontSize: 11, fill: '#64748b' }}
            stroke="#cbd5e1"
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            stroke="#cbd5e1"
            label={{
              value: 'Rank Position (Lower is Better)',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 },
            }}
          />
          <Tooltip
            formatter={(value) => [`#${value}`, 'Organic Rank']}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="position" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isClient ? '#0d9488' : '#94a3b8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
