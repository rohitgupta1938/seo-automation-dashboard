'use client';
// app/client/reports/page.js
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDateTime } from '../../../lib/utils';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';

export default function ClientReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReports()
      .then(d => setReports(d.reports || []))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  function downloadReport(id, fileName) {
    const url = api.downloadReport(id);
    const token = localStorage.getItem('seo_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName || `report.pdf`;
        a.click();
      })
      .catch(() => toast.error('Download failed'));
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
        <p className="text-slate-500 mt-0.5 text-sm">{reports.length} PDF reports available</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileText size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No reports yet. Complete an audit to generate your first PDF report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={22} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{report.audit?.website?.name} — SEO Audit Report</p>
                <p className="text-xs text-slate-500 mt-0.5">Generated {formatDateTime(report.generatedAt)}</p>
                <div className="flex gap-2 mt-1.5">
                  {report.deliveries?.map((d, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'mock_sent' || d.status === 'sent' || d.status === 'simulated' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {d.channel}: {d.status}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => downloadReport(report.id, report.fileName)}
                className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0">
                <Download size={16} /> Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
