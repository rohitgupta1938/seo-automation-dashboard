'use client';
// app/client/websites/page.js
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { toast } from 'sonner';
import { Globe, Plus, Pencil, X } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ClientWebsitesPage() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editWebsite, setEditWebsite] = useState(null);
  const [form, setForm] = useState({ url: '', name: '', businessType: '', city: '', state: '', targetKeywords: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getWebsites({ limit: 50 })
      .then(d => setWebsites(d.websites || []))
      .catch(() => toast.error('Failed to load websites'))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createWebsite({ ...form, targetKeywords: form.targetKeywords.split(',').map(k => k.trim()).filter(Boolean) });
      toast.success('Website added');
      setShowAdd(false);
      const data = await api.getWebsites({ limit: 50 });
      setWebsites(data.websites || []);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateWebsite(editWebsite.id, { ...form, targetKeywords: form.targetKeywords.split(',').map(k => k.trim()).filter(Boolean) });
      toast.success('Website updated');
      setEditWebsite(null);
      const data = await api.getWebsites({ limit: 50 });
      setWebsites(data.websites || []);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  }

  const WebsiteForm = ({ onSubmit, label }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {[
        { key: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true },
        { key: 'name', label: 'Website Name', type: 'text', required: true },
        { key: 'businessType', label: 'Business Type', type: 'text', placeholder: 'Dental Clinic' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'state', label: 'State', type: 'text' },
        { key: 'targetKeywords', label: 'Target Keywords (comma-separated)', type: 'text', placeholder: 'keyword1, keyword2' },
      ].map(({ key, label, type, placeholder, required }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required ? ' *' : ''}</label>
          <input type={type} value={form[key]} placeholder={placeholder} required={required}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => { setShowAdd(false); setEditWebsite(null); }}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm">Cancel</button>
        <button type="submit" disabled={submitting}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
          {submitting ? 'Saving...' : label}
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Websites</h1>
        <button onClick={() => { setShowAdd(true); setForm({ url: '', name: '', businessType: '', city: '', state: '', targetKeywords: '' }); }}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Plus size={18} /> Add Website
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border animate-pulse" />)}
        </div>
      ) : websites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Globe size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No websites added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {websites.map(w => (
            <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Globe size={20} className="text-teal-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{w.name}</p>
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">{w.url}</a>
                  </div>
                </div>
                <button onClick={() => { setEditWebsite(w); setForm({ url: w.url, name: w.name, businessType: w.businessType || '', city: w.city || '', state: w.state || '', targetKeywords: (w.targetKeywords || []).join(', ') }); }}
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                  <Pencil size={15} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3">
                <span>📍 {[w.city, w.state].filter(Boolean).join(', ') || 'Location N/A'}</span>
                <span>🏷️ {w.businessType || 'General'}</span>
                <span>🔍 {w._count?.audits || 0} audits run</span>
                <span>📅 Last: {formatDate(w.lastAuditAt) || 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <Modal title="Add Website" onClose={() => setShowAdd(false)}><WebsiteForm onSubmit={handleAdd} label="Add Website" /></Modal>}
      {editWebsite && <Modal title="Edit Website" onClose={() => setEditWebsite(null)}><WebsiteForm onSubmit={handleEdit} label="Save Changes" /></Modal>}
    </div>
  );
}
