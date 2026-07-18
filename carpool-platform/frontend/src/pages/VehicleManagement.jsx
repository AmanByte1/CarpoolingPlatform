import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plus, Trash2, X, Users } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey'];

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ model: '', registrationNumber: '', seatingCapacity: 4, color: 'White' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/vehicles').then(({ data }) => setVehicles(data.vehicles));
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vehicles', form);
      await load();
      setOpen(false);
      setForm({ model: '', registrationNumber: '', seatingCapacity: 4, color: 'White' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this vehicle?')) return;
    await api.delete(`/vehicles/${id}`);
    load();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">My Vehicle</h1>
          <p className="text-muted text-sm mt-1">Register vehicles you drive for carpooling.</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2.5 rounded-xl bg-route text-white font-semibold text-sm flex items-center gap-2">
          <Plus size={16} /> Add vehicle
        </button>
      </div>

      {loading ? <LoadingSpinner /> : vehicles.length === 0 ? (
        <div className="bg-card border border-dashed border-black/10 rounded-2xl p-10 text-center text-muted text-sm">No vehicles registered yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {vehicles.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-black/5 shadow-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-route-light flex items-center justify-center"><Car size={20} className="text-route-dark" /></div>
                <button onClick={() => remove(v._id)} className="text-muted hover:text-coral"><Trash2 size={16} /></button>
              </div>
              <h3 className="font-semibold mt-3">{v.model}</h3>
              <p className="text-sm text-muted font-mono">{v.registrationNumber}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Users size={12} /> {v.seatingCapacity} seats</span>
                <span>· {v.color}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <motion.form
              onSubmit={submit}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Add vehicle</h3>
                <button type="button" onClick={() => setOpen(false)}><X size={18} /></button>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Vehicle model</label>
                <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Maruti Swift" className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Registration number</label>
                <input required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })} placeholder="GJ01AB1234" className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted">Seating capacity</label>
                  <input type="number" min={1} max={8} required value={form.seatingCapacity} onChange={(e) => setForm({ ...form, seatingCapacity: Number(e.target.value) })} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Color</label>
                  <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm bg-card">
                    {colors.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm disabled:opacity-60">
                {saving ? 'Saving…' : 'Register vehicle'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
