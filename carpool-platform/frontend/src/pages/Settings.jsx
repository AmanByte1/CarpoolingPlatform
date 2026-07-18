import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPinned, Car, WalletIcon, History, HelpCircle, MessageCircle, MapPin, Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import PlaceInput from '../components/PlaceInput';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const shortcuts = [
  { to: '/my-trips', label: 'My Trips', icon: MapPinned },
  { to: '/vehicles', label: 'My Vehicle', icon: Car },
  { to: '/wallet', label: 'Payment Methods', icon: WalletIcon },
  { to: '/ride-history', label: 'Ride History', icon: History },
];

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('Home');
  const [place, setPlace] = useState(null);
  const [saving, setSaving] = useState(false);

  const addPlace = async () => {
    if (!place) return;
    setSaving(true);
    try {
      await api.post('/users/saved-places', { label, ...place });
      await refreshUser();
      setAdding(false);
      setPlace(null);
    } finally {
      setSaving(false);
    }
  };

  const removePlace = async (id) => {
    await api.delete(`/users/saved-places/${id}`);
    refreshUser();
  };

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-muted text-sm mb-6">Quick access to commonly used features.</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {shortcuts.map(({ to, label: l, icon: Icon }) => (
          <Link key={to} to={to}>
            <motion.div whileHover={{ x: 3 }} className="bg-card border border-black/5 shadow-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-route-light flex items-center justify-center"><Icon size={16} className="text-route-dark" /></div>
              <span className="text-sm font-medium">{l}</span>
            </motion.div>
          </Link>
        ))}
        <a href="mailto:support@commute-demo.app">
          <motion.div whileHover={{ x: 3 }} className="bg-card border border-black/5 shadow-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-signal-light flex items-center justify-center"><HelpCircle size={16} className="text-signal" /></div>
            <span className="text-sm font-medium">Help & Support</span>
          </motion.div>
        </a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Saved places</h3>
        <button onClick={() => setAdding((v) => !v)} className="text-sm text-route-dark font-medium flex items-center gap-1"><Plus size={14} /> Add place</button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-black/5 rounded-xl p-5 mb-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home, Office…" className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
          </div>
          <PlaceInput label="Address" value={place} onChange={setPlace} savedPlaces={[]} />
          <button onClick={addPlace} disabled={saving || !place} className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Save place'}
          </button>
        </motion.div>
      )}

      <div className="space-y-2">
        {(user?.savedPlaces || []).map((p) => (
          <div key={p._id} className="bg-card border border-black/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-route-light flex items-center justify-center"><MapPin size={16} className="text-route-dark" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="text-xs text-muted truncate">{p.address}</p>
            </div>
            <button onClick={() => removePlace(p._id)} className="text-muted hover:text-coral"><Trash2 size={16} /></button>
          </div>
        ))}
        {(!user?.savedPlaces || user.savedPlaces.length === 0) && !adding && (
          <p className="text-muted text-sm">No saved places yet — add Home or Office to speed up future searches.</p>
        )}
      </div>
    </Layout>
  );
}
