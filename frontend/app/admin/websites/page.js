'use client';
// app/admin/websites/page.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Globe, X } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const BLANK_FORM = { url: '', name: '', businessType: 'general', city: '', state: '', targetKeywords: '', clientId: '' };

export default function WebsitesPage() {
  const [websites, setWebsites] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editWebsite, setEditWebsite] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const loadWebsites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getWebsites({ page, limit: 15, search });
      setWebsites(data.websites || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load websites');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadWebsites(); }, [loadWebsites]);

  async function loadClients() {
    try {
      const data = await api.getClients({ limit: 100 });
      setClients(data.clients || []);
    } catch {}
  }

  function openAdd() { setShowAdd(true); setForm(BLANK_FORM); loadClients(); }
  function openEdit(w) {
    setEditWebsite(w);
    setForm({ url: w.url, name: w.name, businessType: w.businessType, city: w.city || '', state: w.state || '', targetKeywords: (w.targetKeywords || []).join(', '), clientId: w.clientId });
    loadClients();
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createWebsite({ ...form, targetKeywords: form.targetKeywords.split(',').map(k => k.trim()).filter(Boolean) });
      toast.success('Website added');
      setShowAdd(false);
      loadWebsites();
    } catch (err) {
      toast.error(err.message || 'Failed to add website');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateWebsite(editWebsite.id, { ...form, targetKeywords: form.targetKeywords.split(',').map(k => k.trim()).filter(Boolean) });
      toast.success('Website updated');
      setEditWebsite(null);
      loadWebsites();
    } catch (err) {
      toast.error(err.message || 'Failed to update website');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.deleteWebsite(deleteTarget.id);
      toast.success('Website deleted');
      setDeleteTarget(null);
      loadWebsites();
    } catch (err) {
      toast.error(err.message || 'Failed to delete website');
    } finally {
      setSubmitting(false);
    }
  }

  const WebsiteForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Website URL *</label>
        <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required
          placeholder="https://example.com"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Website Name *</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Client *</label>
        <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
          <option value="">Select client...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.companyName} ({c.user?.email})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
          <input type="text" value={form.businessType} onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
            placeholder="Dental Clinic"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
          <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
        <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Target Keywords (comma-separated)</label>
        <input type="text" value={form.targetKeywords} onChange={e => setForm(f => ({ ...f, targetKeywords: e.target.value }))}
          placeholder="dental clinic pune, best dentist, tooth extraction"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => { setShowAdd(false); setEditWebsite(null); }}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition">Cancel</button>
        <button type="submit" disabled={submitting}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Websites</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{total} total websites</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition">
          <Plus size={18} /> Add Website
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search websites..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Website</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Location</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Audits</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                ))}</tr>
              ))
            ) : websites.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <Globe size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No websites found</p>
                </td>
              </tr>
            ) : (
              websites.map(w => (
                <tr key={w.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{w.name}</p>
                    <a href={w.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:underline truncate block max-w-48">{w.url}</a>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{w.client?.companyName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{w.businessType}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{[w.city, w.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{w._count?.audits || 0} audits</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(w)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(w)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <Modal title="Add Website" onClose={() => setShowAdd(false)}><WebsiteForm onSubmit={handleAdd} submitLabel="Add Website" /></Modal>}
      {editWebsite && <Modal title="Edit Website" onClose={() => setEditWebsite(null)}><WebsiteForm onSubmit={handleEdit} submitLabel="Save Changes" /></Modal>}
      {deleteTarget && (
        <Modal title="Delete Website" onClose={() => setDeleteTarget(null)}>
          <p className="text-slate-600 mb-6">Delete <strong>{deleteTarget.name}</strong>? All audit data will be permanently removed.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm">Cancel</button>
            <button onClick={handleDelete} disabled={submitting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
