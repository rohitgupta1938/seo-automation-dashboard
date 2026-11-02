'use client';
// app/admin/notifications/page.js
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDateTime } from '../../../lib/utils';
import { toast } from 'sonner';
import { Bell, CheckCheck } from 'lucide-react';

const TYPE_ICONS = {
  AUDIT_STARTED: '🚀',
  AUDIT_COMPLETED: '✅',
  AUDIT_FAILED: '❌',
  PDF_GENERATED: '📄',
  REPORT_DELIVERED: '📬',
  REPORT_DELIVERY_FAILED: '📪',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    try {
      const data = await api.getNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
    } catch { toast.error('Failed to mark as read'); }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-slate-500 mt-0.5 text-sm">{unreadCount} unread</p>}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition ${n.isRead ? 'border-slate-200 opacity-70' : 'border-teal-200 shadow-sm'}`}>
              <span className="text-2xl mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)}
                  className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 shrink-0">
                  <CheckCheck size={14} /> Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
