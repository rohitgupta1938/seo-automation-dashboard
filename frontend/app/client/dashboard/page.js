'use client';
// app/client/dashboard/page.js
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getScoreColor, formatDateTime } from '../../../lib/utils';
import SEOScoreCard from '../../../components/shared/SEOScoreCard';
import RecommendationCard from '../../../components/shared/RecommendationCard';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, MousePointer, Eye, Percent, MapPin, AlertCircle, AlertTriangle, Zap } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [latestAudit, setLatestAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.getAudits({ limit: 20, status: 'COMPLETED' });
      const completed = data.audits || [];
      setAudits(completed);
      if (completed.length > 0) {
        const latest = await api.getAudit(completed[0].id);
        setLatestAudit(latest.audit);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  const result = latestAudit?.result;
  const gsc = result?.gscData || {};
  const rankings = result?.rankingsData || {};

  const trendData = audits.slice(0, 10).reverse().map(a => ({
    date: new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    overall: a.result?.overallScore || 0,
    technical: a.result?.technicalScore || 0,
    onPage: a.result?.onPageScore || 0,
  }));

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={36} className="text-teal-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Audit Data Yet</h2>
          <p className="text-slate-500 mb-6">Contact your admin to run an SEO audit for your website.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">Last audit: {formatDateTime(latestAudit?.completedAt)}</p>
      </div>

      {/* Score Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <h2 className="font-semibold text-slate-800 text-sm sm:text-base mb-4 sm:mb-5">SEO Score Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          <SEOScoreCard score={result.overallScore} label="Overall" size="lg" />
          <SEOScoreCard score={result.technicalScore} label="Technical" />
          <SEOScoreCard score={result.onPageScore} label="On-Page" />
          <SEOScoreCard score={result.contentScore} label="Content" />
          <SEOScoreCard score={result.cwvScore} label="Core Web Vitals" />
          <SEOScoreCard score={result.schemaScore} label="Schema.org" />
        </div>
      </div>

      {/* Issues Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-2" size={26} />
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{Array.isArray(result.criticalIssues) ? result.criticalIssues.length : 0}</p>
          <p className="text-xs sm:text-sm text-red-700 font-medium mt-1">Critical Issues</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-center">
          <AlertTriangle className="text-amber-500 mx-auto mb-2" size={26} />
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">{Array.isArray(result.importantIssues) ? result.importantIssues.length : 0}</p>
          <p className="text-xs sm:text-sm text-amber-700 font-medium mt-1">Important Issues</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-center">
          <Zap className="text-emerald-500 mx-auto mb-2" size={26} />
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{Array.isArray(result.quickWins) ? result.quickWins.length : 0}</p>
          <p className="text-xs sm:text-sm text-emerald-700 font-medium mt-1">Quick Wins</p>
        </div>
      </div>

      {/* GSC Stats */}
      {gsc.rows && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer size={16} className="text-teal-500" />
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Clicks</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{gsc.totalClicks?.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={16} className="text-blue-500" />
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Impressions</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{gsc.totalImpressions?.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Percent size={16} className="text-amber-500" />
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Avg CTR</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">
              {gsc.rows ? (gsc.rows.reduce((s, r) => s + r.ctr, 0) / gsc.rows.length * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-purple-500" />
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Avg Position</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">
              #{gsc.rows ? Math.round(gsc.rows.reduce((s, r) => s + r.position, 0) / gsc.rows.length) : 0}
            </p>
          </div>
        </div>
      )}

      {/* SEO Score Trend */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-4">SEO Score Trend</h3>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="overall" stroke="#14b8a6" strokeWidth={2} dot={false} name="Overall" />
                <Line type="monotone" dataKey="technical" stroke="#3b82f6" strokeWidth={2} dot={false} name="Technical" />
                <Line type="monotone" dataKey="onPage" stroke="#f59e0b" strokeWidth={2} dot={false} name="On-Page" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Keyword Rankings */}
      {gsc.rows && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-4">Keyword Performance (Google Search Console)</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Query</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Clicks</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Impressions</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">CTR</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gsc.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-800">{row.query}</td>
                    <td className="py-3 text-right text-slate-600">{row.clicks}</td>
                    <td className="py-3 text-right text-slate-500">{row.impressions.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-500">{(row.ctr * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right">
                      <span className={`font-bold text-sm ${row.position <= 5 ? 'text-emerald-600' : row.position <= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                        #{Math.round(row.position)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {result.executiveSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Executive Summary</h3>
          <p className="text-blue-800 text-sm leading-relaxed">{result.executiveSummary}</p>
        </div>
      )}

      {/* Top Recommendations */}
      {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-4">Top Recommendations</h3>
          <div className="space-y-4">
            {result.recommendations.slice(0, 3).map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
