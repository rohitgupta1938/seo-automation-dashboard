'use client';
// app/admin/audits/page.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { formatDateTime, getStatusBadge, getScoreColor } from '../../../lib/utils';
import AuditProgress from '../../../components/shared/AuditProgress';
import { toast } from 'sonner';
import { Plus, RefreshCw, X, Activity, Filter } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const loadAudits = useCallback(async () => {
    try {
      const params = { page, limit: 15, ...(statusFilter && { status: statusFilter }) };
      const data = await api.getAudits(params);
      setAudits(data.audits || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadAudits(); }, [loadAudits]);

  // Poll active/waiting audits
  useEffect(() => {
    const hasActive = audits.some(a => ['WAITING', 'ACTIVE'].includes(a.status));
    if (!hasActive) return;
    const interval = setInterval(loadAudits, 5000);
    return () => clearInterval(interval);
  }, [audits, loadAudits]);

  async function loadWebsites() {
    try {
      const data = await api.getWebsites({ limit: 100 });
      setWebsites(data.websites || []);
    } catch {}
  }

  function openStartModal() {
    setShowStart(true);
    loadWebsites();
  }

  async function handleStartAudit(e) {
    e.preventDefault();
    if (!selectedWebsite) return toast.error('Select a website');
    setSubmitting(true);
    try {
      await api.createAudit(selectedWebsite);
      toast.success('Audit started! Processing in background.');
      setShowStart(false);
      setSelectedWebsite('');
      loadAudits();
    } catch (err) {
      toast.error(err.message || 'Failed to start audit');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry(auditId) {
    try {
      await api.retryAudit(auditId);
      toast.success('Audit retry queued');
      loadAudits();
    } catch (err) {
      toast.error(err.message || 'Failed to retry');
    }
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Audits</h1>
          <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">{total} total audits</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">All Status</option>
              {['WAITING', 'ACTIVE', 'COMPLETED', 'FAILED', 'DELAYED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openStartModal}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition shadow-sm"
          >
            <Plus size={18} /> Start Audit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Website</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 w-48">Progress</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Score</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Started</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : audits.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <Activity size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No audits found</p>
                </td>
              </tr>
            ) : (
              audits.map(audit => (
                <tr key={audit.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{audit.website?.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-48">{audit.website?.url}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadge(audit.status)}`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 w-48">
                    {['WAITING', 'ACTIVE'].includes(audit.status) ? (
                      <AuditProgress progress={audit.progress || 0} status={audit.status} />
                    ) : (
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${audit.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-red-400'}`}
                          style={{ width: `${audit.progress || 0}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {audit.result?.overallScore != null ? (
                      <span className={`text-lg font-bold ${getScoreColor(audit.result.overallScore)}`}>
                        {audit.result.overallScore}
                      </span>
                    ) : <span className="text-slate-400 text-sm">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(audit.createdAt)}</td>
                  <td className="px-6 py-4">
                    {audit.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(audit.id)}
                        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition">Next</button>
            </div>
          </div>
        )}
      </div>

      {showStart && (
        <Modal title="Start New Audit" onClose={() => setShowStart(false)}>
          <form onSubmit={handleStartAudit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Website *</label>
              <select
                value={selectedWebsite}
                onChange={e => setSelectedWebsite(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                required
              >
                <option value="">Choose website...</option>
                {websites.map(w => (
                  <option key={w.id} value={w.id}>{w.name} — {w.url}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Website will be crawled and analyzed</li>
                <li>Claude AI generates SEO recommendations</li>
                <li>PDF report is auto-generated</li>
                <li>Progress visible in real-time (polls every 5s)</li>
              </ul>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowStart(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {submitting ? 'Starting...' : 'Start Audit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
