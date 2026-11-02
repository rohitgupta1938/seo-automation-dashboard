'use client';
// app/client/settings/page.js
import { useAuth } from '../../../contexts/AuthContext';

export default function ClientSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg">
        <h3 className="font-semibold text-slate-800 mb-4">Account Information</h3>
        <div className="space-y-4">
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Company', value: user?.client?.companyName || '—' },
            { label: 'Role', value: user?.role },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">To update your information, contact your account administrator.</p>
        </div>
      </div>
    </div>
  );
}
