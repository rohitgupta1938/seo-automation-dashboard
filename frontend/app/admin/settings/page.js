'use client';
// app/admin/settings/page.js
import { useAuth } from '../../../contexts/AuthContext';
import { Settings, Shield, Database, Cpu } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">System configuration and information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-800">System Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'API Server', status: 'Online', ok: true },
              { label: 'BullMQ Queue', status: 'Connected', ok: true },
              { label: 'Mock Mode', status: process.env.NEXT_PUBLIC_USE_MOCKS !== 'false' ? 'Enabled' : 'Disabled', ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Configuration</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000' },
              { label: 'AI Model', value: 'claude-sonnet-4-6' },
              { label: 'Queue', value: 'seo-audit-jobs (BullMQ)' },
              { label: 'Database', value: 'PostgreSQL (Prisma ORM)' },
              { label: 'Version', value: '1.0.0' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Admin Account</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Role', value: user?.role },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white">
          <h3 className="font-semibold mb-2">Mock Mode Active</h3>
          <p className="text-teal-100 text-sm mb-4">
            All external APIs are mocked. PageSpeed, GSC, DataForSEO, and WhatsApp return predefined test data.
          </p>
          <div className="bg-white/10 rounded-xl p-4 text-xs font-mono">
            USE_MOCKS=true<br/>
            Claude AI: Mock fallback active<br/>
            Twilio: Console logging only
          </div>
        </div>
      </div>
    </div>
  );
}
