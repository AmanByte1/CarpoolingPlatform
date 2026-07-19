import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-surface">
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col justify-between bg-ink text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-route flex items-center justify-center">
            <span className="font-display font-bold text-sm">C</span>
          </div>
          <span className="font-display font-semibold text-lg">Commute</span>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-semibold leading-tight max-w-md">
            Share the ride.<br />Skip the traffic.
          </h2>
          <p className="text-white/60 mt-4 max-w-sm">
            Find colleagues heading your way, or offer a seat in your own car — live tracking and payments handled for you.
          </p>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-route" />
              <span className="w-px h-10" style={{ backgroundImage: 'repeating-linear-gradient(180deg,#1FAE86 0 6px,transparent 6px 12px)' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-signal" />
            </div>
            <div className="text-sm text-white/70 space-y-6">
              <p>Pickup at your saved place</p>
              <p>Dropped right at your office</p>
            </div>
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">Built for enterprise commute programs</p>

        <motion.div
          className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-route/10"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        />
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-route flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">C</span>
            </div>
            <span className="font-display font-semibold text-lg">Commute</span>
          </div>

          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Log in to find or offer a ride today.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">Work email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 bg-card text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 bg-card text-sm"
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-coral text-xs bg-coral/10 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            New to your organization's carpool? <Link to="/signup" className="text-route-dark font-semibold">Create an account</Link>
          </p>

          <div className="mt-8 p-3 rounded-xl bg-route-light text-xs text-route-dark">
            <strong>Demo:</strong> org code <span className="font-mono">ACME01</span> · admin@acme.com or driver1@acme.com / password123 (run <span className="font-mono">npm run seed</span> in backend first)
          </div>
        </motion.div>
      </div>
    </div>
  );
}
