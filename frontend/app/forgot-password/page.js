'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      if (res.resetUrl) {
        setDevResetUrl(res.resetUrl);
      }
      toast.success(res.message || 'Reset link sent! Please check your email.');
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-1">SEO Automation Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Check your inbox</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                If an account exists for <strong className="text-slate-800">{email}</strong>, we have sent instructions to reset your password.
              </p>

              {devResetUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2 mt-4">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
                    <span>⚠️ Development Mode (SMTP Not Configured)</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Real email delivery requires Gmail App Password in <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">backend/.env</code>.
                  </p>
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-600 font-medium mb-1">Generated Reset Link:</p>
                    <a
                      href={devResetUrl}
                      className="block text-xs font-mono bg-white p-2.5 rounded border border-amber-200 text-teal-600 hover:text-teal-700 underline break-all"
                    >
                      {devResetUrl}
                    </a>
                  </div>
                  <div className="pt-2">
                    <a
                      href={devResetUrl}
                      className="w-full inline-block text-center bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs px-3 py-2 rounded-lg transition"
                    >
                      Click Here to Reset Password Now →
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Didn't receive an email? Try another address
                </button>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 py-2"
                >
                  <ArrowLeft size={16} /> Back to Sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Forgot your password?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-900"
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
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
          )}
        </div>
      </div>
    </div>
  );
}
