import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', orgCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const updatePhone = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, phone: digits });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Enter a valid 10-digit phone number (digits only, starting with 6–9).');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-soft p-8 border border-black/5"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-route flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">C</span>
          </div>
          <span className="font-display font-semibold text-lg">Commute</span>
        </div>
        <h1 className="font-display text-2xl font-semibold mt-4">Create your account</h1>
        <p className="text-muted text-sm mt-1">Join your organization's carpool network.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Full name</label>
            <input required value={form.name} onChange={update('name')} placeholder="Priya Sharma"
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">Work email</label>
              <input type="email" required value={form.email} onChange={update('email')} placeholder="you@company.com"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Phone</label>
              <input required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10}
                value={form.phone} onChange={updatePhone} placeholder="98XXXXXXXX"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="••••••••"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Org code</label>
              <input required value={form.orgCode} onChange={update('orgCode')} placeholder="ACME01"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm uppercase" />
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-coral text-xs bg-coral/10 rounded-lg px-3 py-2">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account? <Link to="/login" className="text-route-dark font-semibold">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
