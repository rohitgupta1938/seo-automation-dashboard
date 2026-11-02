'use client';
// app/admin/reports/page.js
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDateTime } from '../../../lib/utils';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';

export default function AdminReportsPage() {
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
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName || `report-${id}.pdf`;
        link.click();
      })
      .catch(() => toast.error('Download failed'));
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-0.5 text-sm">{reports.length} generated reports</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Website</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Generated</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Delivery</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(4).fill(0).map((_, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                ))}</tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No reports generated yet</p>
                </td>
              </tr>
            ) : (
              reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{report.audit?.website?.name}</p>
                    <p className="text-xs text-slate-400">{report.fileName}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(report.generatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {report.deliveries?.map((d, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'mock_sent' || d.status === 'simulated' || d.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {d.channel}: {d.status}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => downloadReport(report.id, report.fileName)}
                      className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition">
                      <Download size={13} /> Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
