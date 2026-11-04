'use client';
// components/layout/ClientSidebar.js
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard, Globe, Search, FileText, Bell, Settings, LogOut, Zap, X
} from 'lucide-react';

const navItems = [
  { href: '/client/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/client/websites', label: 'My Websites', icon: Globe },
  { href: '/client/audits', label: 'SEO Audits', icon: Search },
  { href: '/client/reports', label: 'Reports', icon: FileText },
  { href: '/client/notifications', label: 'Notifications', icon: Bell },
  { href: '/client/settings', label: 'Settings', icon: Settings },
];

export default function ClientSidebar({ isOpen = false, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const sidebarContent = (
    <div className="w-64 h-full min-h-screen bg-white flex flex-col border-r border-slate-200">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 font-bold text-sm truncate">SEO Dashboard</p>
            <p className="text-slate-500 text-xs truncate">{user?.client?.companyName || 'Client Portal'}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-teal-50 text-teal-700 border border-teal-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-teal-700 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-500 hover:text-red-500 text-sm w-full px-2 py-2 rounded-lg hover:bg-red-50 transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:block shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer with backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
