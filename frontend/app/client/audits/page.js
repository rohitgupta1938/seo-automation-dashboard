'use client';
// app/client/audits/page.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { formatDateTime, getStatusBadge, getScoreColor } from '../../../lib/utils';
import AuditProgress from '../../../components/shared/AuditProgress';
import RecommendationCard from '../../../components/shared/RecommendationCard';
import { toast } from 'sonner';
import { Plus, ChevronDown, ChevronUp, Search, X, AlertTriangle, Download, Zap, AlertCircle } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ClientAuditsPage() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedAudit, setExpandedAudit] = useState(null);
  const [expandedData, setExpandedData] = useState(null);

  const loadAudits = useCallback(async () => {
    try {
      const data = await api.getAudits({ limit: 20 });
      setAudits(data.audits || []);
    } catch { toast.error('Failed to load audits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAudits(); }, [loadAudits]);

  // Poll active audits
  useEffect(() => {
    const hasActive = audits.some(a => ['WAITING', 'ACTIVE'].includes(a.status));
    if (!hasActive) return;
    const iv = setInterval(loadAudits, 5000);
    return () => clearInterval(iv);
  }, [audits, loadAudits]);

  async function loadWebsites() {
    const data = await api.getWebsites({ limit: 50 });
    setWebsites(data.websites || []);
  }

  async function handleStart(e) {
    e.preventDefault();
    if (!selectedWebsite) return toast.error('Select a website');
    setSubmitting(true);
    try {
      await api.createAudit(selectedWebsite);
      toast.success('Audit started!');
      setShowStart(false);
      setSelectedWebsite('');
      loadAudits();
    } catch (err) { toast.error(err.message || 'Failed to start audit'); }
    finally { setSubmitting(false); }
  }

  async function toggleExpand(audit) {
    if (expandedAudit === audit.id) {
      setExpandedAudit(null);
      setExpandedData(null);
      return;
    }
    setExpandedAudit(audit.id);
    if (audit.status === 'COMPLETED') {
      const data = await api.getAudit(audit.id).catch(() => null);
      if (data?.audit?.result) {
        setExpandedData({
          ...data.audit.result,
          report: data.audit.report,
          website: data.audit.website,
        });
      }
    } else {
      setExpandedData(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SEO Audits</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{audits.length} audits</p>
        </div>
        <button onClick={() => { setShowStart(true); loadWebsites(); }}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition">
          <Plus size={18} /> Request Audit
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-20" />
          ))
        ) : audits.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Search size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No audits yet</p>
            <p className="text-slate-400 text-sm mt-1">Click "Request Audit" to start your first SEO audit</p>
          </div>
        ) : (
          audits.map(audit => (
            <div key={audit.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition" onClick={() => toggleExpand(audit)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-slate-800">{audit.website?.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(audit.status)}`}>{audit.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 font-mono truncate max-w-sm">{audit.website?.url}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <p className="text-xs text-slate-500">{formatDateTime(audit.createdAt)}</p>
                  </div>
                </div>

                {['WAITING', 'ACTIVE'].includes(audit.status) ? (
                  <div className="w-48">
                    <AuditProgress progress={audit.progress || 0} status={audit.status} />
                  </div>
                ) : audit.result?.overallScore != null ? (
                  <span className={`text-2xl font-bold ${getScoreColor(audit.result.overallScore)}`}>
                    {audit.result.overallScore}<span className="text-sm text-slate-400">/100</span>
                  </span>
                ) : null}

                {expandedAudit === audit.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </div>

              {expandedAudit === audit.id && (
                <div className="border-t border-slate-200 p-6 bg-slate-50/50 space-y-6">
                  {/* FAILED STATUS BANNER */}
                  {audit.status === 'FAILED' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Audit Failed</h4>
                        <p className="text-xs text-red-600 mt-1">
                          {audit.errorMessage || 'Unable to crawl website. Connection failed or host unreachable. Please verify the URL and try again.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE / WAITING PROGRESS */}
                  {['WAITING', 'ACTIVE'].includes(audit.status) && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <h4 className="text-sm font-semibold text-slate-800">Crawl & Analysis in Progress</h4>
                        <AuditProgress progress={audit.progress || 0} status={audit.status} />
                        <p className="text-xs text-slate-500">
                          Fetching real page metadata, technical signals, performance metrics, and generating site-specific recommendations...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COMPLETED AUDIT DATA */}
                  {audit.status === 'COMPLETED' && expandedData && (
                    <>
                      {/* SCORE BREAKDOWN GRID */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Technical</p>
                          <p className={`text-xl font-bold ${getScoreColor(expandedData.technicalScore)}`}>
                            {expandedData.technicalScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                          </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">On-Page</p>
                          <p className={`text-xl font-bold ${getScoreColor(expandedData.onPageScore)}`}>
                            {expandedData.onPageScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                          </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Content</p>
                          <p className={`text-xl font-bold ${getScoreColor(expandedData.contentScore)}`}>
                            {expandedData.contentScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                          </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Core Web Vitals</p>
                          <p className={`text-xl font-bold ${getScoreColor(expandedData.cwvScore)}`}>
                            {expandedData.cwvScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                          </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Schema</p>
                          <p className={`text-xl font-bold ${getScoreColor(expandedData.schemaScore)}`}>
                            {expandedData.schemaScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                          </p>
                        </div>
                      </div>

                      {/* EXECUTIVE SUMMARY */}
                      {expandedData.executiveSummary && (
                        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1">Executive Summary</h4>
                          <p className="text-sm text-blue-800 leading-relaxed">{expandedData.executiveSummary}</p>
                        </div>
                      )}

                      {/* CRITICAL & IMPORTANT ISSUES */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(expandedData.criticalIssues) && expandedData.criticalIssues.length > 0 && (
                          <div className="bg-white border border-red-100 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <AlertTriangle size={15} /> Critical Issues ({expandedData.criticalIssues.length})
                            </h4>
                            <ul className="space-y-2 text-xs text-slate-700">
                              {expandedData.criticalIssues.map((issue, idx) => (
                                <li key={idx} className="flex items-start gap-2 bg-red-50/50 p-2 rounded-lg border border-red-50">
                                  <span className="text-red-500 font-bold">•</span>
                                  <span>{typeof issue === 'string' ? issue : JSON.stringify(issue)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {Array.isArray(expandedData.quickWins) && expandedData.quickWins.length > 0 && (
                          <div className="bg-white border border-emerald-100 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <Zap size={15} /> Quick Wins ({expandedData.quickWins.length})
                            </h4>
                            <ul className="space-y-2 text-xs text-slate-700">
                              {expandedData.quickWins.map((win, idx) => (
                                <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-50">
                                  <span className="text-emerald-500 font-bold">✓</span>
                                  <span>{typeof win === 'string' ? win : JSON.stringify(win)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* RECOMMENDATIONS */}
                      {Array.isArray(expandedData.recommendations) && expandedData.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3 text-sm">Site-Specific Recommendations</h4>
                          <div className="space-y-3">
                            {expandedData.recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
                          </div>
                        </div>
                      )}

                      {/* PDF REPORT DOWNLOAD BUTTON IF REPORT EXISTS */}
                      {expandedData.report && (
                        <div className="flex justify-end pt-2">
                          <a
                            href={api.downloadReport(expandedData.report.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-xl transition shadow-sm"
                          >
                            <Download size={14} /> Download PDF Audit Report
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showStart && (
        <Modal title="Request SEO Audit" onClose={() => setShowStart(false)}>
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Website *</label>
              <select value={selectedWebsite} onChange={e => setSelectedWebsite(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" required>
                <option value="">Choose website...</option>
                {websites.map(w => <option key={w.id} value={w.id}>{w.name} — {w.url}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowStart(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {submitting ? 'Starting...' : 'Start Audit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
