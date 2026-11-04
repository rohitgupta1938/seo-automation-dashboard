'use client';
// app/admin/dashboard/page.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatDateTime, getStatusBadge, getScoreColor } from '../../../lib/utils';
import StatCard from '../../../components/shared/StatCard';
import LoadingSkeleton from '../../../components/shared/LoadingSkeleton';
import EmptyState from '../../../components/shared/EmptyState';
import { toast } from 'sonner';
import {
  Users,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const data = await api.adminStats();
      if (data && data.stats) {
        setStats(data.stats);
        setRecentAudits(data.recentAudits || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  }

  const chartData = stats
    ? [
        { name: 'Completed', count: stats.COMPLETED || 0, fill: '#10b981' },
        { name: 'Active', count: stats.ACTIVE || 0, fill: '#3b82f6' },
        { name: 'Pending', count: stats.WAITING || 0, fill: '#f59e0b' },
        { name: 'Failed', count: stats.FAILED || 0, fill: '#ef4444' },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Platform overview, audit performance and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/audits"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <span>Manage Audits</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* StatCards: Total Clients, Websites, Audits, Completed, Failed, Average Score */}
      {loading ? (
        <LoadingSkeleton type="stat" count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Clients"
            value={stats?.totalClients ?? 0}
            icon={Users}
            color="teal"
          />
          <StatCard
            title="Total Websites"
            value={stats?.totalWebsites ?? 0}
            icon={Globe}
            color="blue"
          />
          <StatCard
            title="Total Audits"
            value={stats?.totalAudits ?? 0}
            icon={Search}
            color="slate"
          />
          <StatCard
            title="Completed"
            value={stats?.COMPLETED ?? 0}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Failed"
            value={stats?.FAILED ?? 0}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Average Score"
            value={`${stats?.averageSeoScore ?? 0}/100`}
            icon={TrendingUp}
            color="amber"
          />
        </div>
      )}

      {/* Charts & Recent Audits Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Status BarChart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Audit Status Overview</h2>
              <p className="text-xs text-slate-400">Distribution across all tracked audits</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Live
            </span>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
          ) : !stats || stats.totalAudits === 0 ? (
            <EmptyState
              icon={Search}
              title="No audit data"
              description="Audits will appear here once executed."
              className="py-12 border-none shadow-none"
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Audits Table (last 10 audits: website name, status badge, score) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Audits</h2>
              <p className="text-xs text-slate-400">Latest 10 audit runs across all client websites</p>
            </div>
            <Link
              href="/admin/audits"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 hover:underline"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentAudits.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No audits recorded"
              description="Run audits on client websites to see real-time updates."
              className="py-12 border-none shadow-none"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="py-2.5 px-3">Website</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentAudits.slice(0, 10).map((audit) => {
                    const score = audit.result?.overallScore;
                    return (
                      <tr key={audit.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 truncate max-w-xs flex items-center gap-1.5">
                            <span>{audit.website?.name || 'Unknown Website'}</span>
                            {audit.website?.url && (
                              <span className="text-slate-400 text-[11px] font-normal truncate hidden sm:inline">
                                ({audit.website.url})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getStatusBadge(
                              audit.status
                            )}`}
                          >
                            {audit.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {score != null ? (
                            <span className={`font-bold text-xs ${getScoreColor(score)}`}>
                              {score}/100
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                          {formatDateTime(audit.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
