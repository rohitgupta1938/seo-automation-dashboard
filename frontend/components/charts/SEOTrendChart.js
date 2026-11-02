'use client';
// components/charts/SEOTrendChart.js
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SEOTrendChart({ data = [], height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl text-slate-400 text-sm">
        No audit trend data available yet
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((item) => ({
    date: item.date || item.createdAt || 'N/A',
    overall: item.overallScore ?? item.overall ?? 0,
    technical: item.technicalScore ?? item.technical ?? 0,
    onPage: item.onPageScore ?? item.onPage ?? 0,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            stroke="#cbd5e1"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            stroke="#cbd5e1"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            name="Overall Score"
            dataKey="overall"
            stroke="#0d9488"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            name="Technical"
            dataKey="technical"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: '#3b82f6' }}
          />
          <Line
            type="monotone"
            name="On-Page"
            dataKey="onPage"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: '#8b5cf6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
