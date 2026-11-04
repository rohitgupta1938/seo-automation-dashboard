'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Invalid Reset Link</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          No password reset token was found in the link. Please request a new password reset link.
        </p>
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <Link
            href="/forgot-password"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl text-center transition"
          >
            Request New Link
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 py-2"
          >
            <ArrowLeft size={16} /> Back to Sign in
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      setSuccess(true);
      toast.success(res.message || 'Password reset successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Password Reset Complete</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your password has been updated successfully. You can now sign in with your new credentials.
        </p>
        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/login"
            className="w-full inline-block bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl text-center transition"
          >
            Sign in to Your Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Create New Password</h2>
      <p className="text-sm text-slate-500 mb-6">
        Please enter and confirm your new secure password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-900"
            placeholder="At least 8 characters"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-900"
            placeholder="Re-enter your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Updating Password...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Choose New Password</h1>
          <p className="text-slate-400 mt-1">SEO Automation Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading...</p>
            </div>
          }>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
