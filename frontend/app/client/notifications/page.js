'use client';
// app/client/notifications/page.js
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDateTime } from '../../../lib/utils';
import { toast } from 'sonner';
import { Bell, CheckCheck } from 'lucide-react';

const TYPE_ICONS = {
  AUDIT_STARTED: '🚀', AUDIT_COMPLETED: '✅', AUDIT_FAILED: '❌',
  PDF_GENERATED: '📄', REPORT_DELIVERED: '📬', REPORT_DELIVERY_FAILED: '📪',
};

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications({ limit: 50 })
      .then(d => setNotifications(d.notifications || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h1>
      <div className="space-y-3">
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl border p-4 animate-pulse h-16" />) :
          notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-500">No notifications yet</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${n.isRead ? 'border-slate-200 opacity-60' : 'border-teal-200'}`}>
              <span className="text-xl">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)} className="text-xs text-teal-600 flex items-center gap-1">
                  <CheckCheck size={13} /> Mark read
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
