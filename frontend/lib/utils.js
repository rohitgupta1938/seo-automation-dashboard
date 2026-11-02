// lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

export function getScoreBg(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getStatusBadge(status) {
  const map = {
    WAITING: 'bg-slate-100 text-slate-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    DELAYED: 'bg-amber-100 text-amber-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function getPriorityBadge(priority) {
  const map = {
    CRITICAL: 'bg-red-100 text-red-700 border border-red-200',
    HIGH: 'bg-amber-100 text-amber-700 border border-amber-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border border-blue-200',
    LOW: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  return map[priority] || map.LOW;
}
