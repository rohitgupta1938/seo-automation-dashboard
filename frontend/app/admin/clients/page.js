'use client';
// app/admin/clients/page.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { toast } from 'sonner';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import LoadingSkeleton from '../../../components/shared/LoadingSkeleton';
import EmptyState from '../../../components/shared/EmptyState';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Users,
  X,
  Search,
  Globe,
  Mail,
  Phone,
  Building,
  Loader2,
} from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [viewClient, setViewClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    phone: '',
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getClients({ page, limit, search });
      setClients(data.clients || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      toast.error('Name, email, and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.createClient(form);
      toast.success('Client created successfully');
      setShowAdd(false);
      setForm({ email: '', password: '', name: '', companyName: '', phone: '' });
      loadClients();
    } catch (err) {
      toast.error(err.message || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editClient) return;
    setSubmitting(true);
    try {
      await api.updateClient(editClient.id, {
        name: form.name,
        companyName: form.companyName,
        phone: form.phone,
      });
      toast.success('Client updated successfully');
      setEditClient(null);
      loadClients();
    } catch (err) {
      toast.error(err.message || 'Failed to update client');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.deleteClient(deleteTarget.id);
      toast.success('Client deleted successfully');
      setDeleteTarget(null);
      loadClients();
    } catch (err) {
      toast.error(err.message || 'Failed to delete client');
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">Manage client accounts, business profiles, and access</p>
        </div>
        <button
          onClick={() => {
            setForm({ email: '', password: '', name: '', companyName: '', phone: '' });
            setShowAdd(true);
          }}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
        >
          <Plus size={18} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing {clients.length} of {total} clients
        </span>
      </div>

      {/* Clients Table */}
      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={search ? "No clients match your search query." : "Get started by creating your first client account."}
          actionLabel={search ? undefined : "Add Client"}
          onAction={search ? undefined : () => setShowAdd(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6">Company Name</th>
                  <th className="py-3.5 px-6">Email & Contact</th>
                  <th className="py-3.5 px-6 text-center">Websites</th>
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                          {client.companyName?.[0]?.toUpperCase() || client.user?.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{client.companyName || 'N/A'}</p>
                          <p className="text-xs text-slate-400 font-normal">{client.user?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-600 text-xs">
                        <p className="font-medium text-slate-800">{client.user?.email}</p>
                        {client.phone && <p className="text-slate-400 mt-0.5">{client.phone}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                        <Globe size={12} />
                        {client._count?.websites ?? client.websites?.length ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {formatDate(client.createdAt || client.user?.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewClient(client)}
                          title="View Client"
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditClient(client);
                            setForm({
                              name: client.user?.name || '',
                              companyName: client.companyName || '',
                              phone: client.phone || '',
                              email: client.user?.email || '',
                              password: '',
                            });
                          }}
                          title="Edit Client"
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
                          title="Delete Client"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <p>
                Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <Modal title="Add New Client" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Company Name *</label>
              <input
                type="text"
                required
                placeholder="Acme Health Inc"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 555-0199"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Client Modal */}
      {editClient && (
        <Modal title="Edit Client" onClose={() => setEditClient(null)}>
          <form onSubmit={handleEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Contact Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditClient(null)}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Client Details Modal */}
      {viewClient && (
        <Modal title="Client Details" onClose={() => setViewClient(null)}>
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-bold text-lg">
                {viewClient.companyName?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewClient.companyName}</h3>
                <p className="text-slate-400">Created {formatDate(viewClient.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={15} className="text-slate-400" />
                <span>Primary Contact:</span>
                <span className="font-semibold text-slate-900">{viewClient.user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={15} className="text-slate-400" />
                <span>Email:</span>
                <span className="font-semibold text-slate-900">{viewClient.user?.email}</span>
              </div>
              {viewClient.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={15} className="text-slate-400" />
                  <span>Phone:</span>
                  <span className="font-semibold text-slate-900">{viewClient.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Globe size={14} className="text-teal-600" />
                <span>Associated Websites</span>
              </h4>
              {viewClient.websites && viewClient.websites.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {viewClient.websites.map((site) => (
                    <div key={site.id} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                      <span className="font-medium text-slate-800">{site.name}</span>
                      <span className="text-slate-400 text-[11px]">{site.url}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No websites registered yet.</p>
              )}
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setViewClient(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Client Account"
        message={`Are you sure you want to delete ${deleteTarget?.companyName || deleteTarget?.user?.name}? All associated websites, audits, and reports will also be permanently removed.`}
        confirmText="Delete Client"
        cancelText="Cancel"
        loading={submitting}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
