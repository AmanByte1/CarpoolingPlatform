import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Car, Route, CheckCircle2, Settings, ToggleLeft, ToggleRight, TrendingUp, Leaf, Fuel, IndianRupee, Award, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [org, setOrg] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = () => Promise.all([
    api.get('/admin/stats'), api.get('/admin/employees'), api.get('/admin/organization'), api.get('/admin/business-insights'),
  ]).then(([s, e, o, bi]) => { setStats(s.data); setEmployees(e.data.employees); setOrg(o.data.organization); setInsights(bi.data); });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const toggle = async (id) => { await api.put(`/admin/employees/${id}/toggle-access`); load(); };

  const saveOrg = async () => {
    await api.put('/admin/organization', { fuelCostPerLitre: org.fuelCostPerLitre, avgMileageKmpl: org.avgMileageKmpl, costPerKm: org.costPerKm });
    alert('Organization settings saved');
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Company Administration</h1>
      <p className="text-muted text-sm mb-6">Manage employees, vehicles and organization settings.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['overview', 'business insights', 'employees', 'settings'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${tab === t ? 'bg-route text-white' : 'bg-card border border-black/10 text-muted'}`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total employees" value={stats.totalEmployees} accent="route" />
          <StatCard icon={CheckCircle2} label="Active employees" value={stats.activeEmployees} accent="signal" delay={0.05} />
          <StatCard icon={Car} label="Registered vehicles" value={stats.totalVehicles} accent="coral" delay={0.1} />
          <StatCard icon={Route} label="Completed trips" value={stats.completedTrips} accent="route" delay={0.15} />
        </div>
      )}

      {tab === 'business insights' && insights && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-ink text-white rounded-2xl p-7 relative overflow-hidden mb-6">
            <div className="flex items-center gap-2 relative z-10">
              <Sparkles size={18} className="text-signal" />
              <span className="text-white/60 text-xs font-medium uppercase tracking-wide">Program impact this month</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mt-4 relative z-10">
              <div>
                <p className="font-display text-4xl font-semibold flex items-center gap-1"><IndianRupee size={28} />{insights.projectedMonthlyCostSaved.toLocaleString()}</p>
                <p className="text-white/50 text-sm mt-1">Projected monthly cost savings for the organization</p>
              </div>
              <div>
                <p className="font-display text-4xl font-semibold flex items-center gap-1">{insights.projectedMonthlyCo2Saved}<span className="text-lg text-white/50 ml-1">kg</span></p>
                <p className="text-white/50 text-sm mt-1">Projected monthly CO₂ emissions avoided</p>
              </div>
            </div>
            <motion.div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-route/10" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={IndianRupee} label="Total cost saved to date" value={`₹${insights.costSaved.toLocaleString()}`} accent="route" />
            <StatCard icon={Fuel} label="Fuel saved" value={`${insights.fuelLitresSaved} L`} accent="signal" delay={0.05} />
            <StatCard icon={Leaf} label="CO₂ avoided" value={`${insights.co2SavedKg} kg`} accent="route" delay={0.1} />
            <StatCard icon={Award} label="Avg. occupancy per ride" value={insights.avgOccupancy} accent="coral" delay={0.15} />
          </div>

          <div className="bg-card rounded-2xl border border-black/5 shadow-card p-6 mt-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} /> Employee participation</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${insights.participationRate}%` }} transition={{ duration: 0.8 }}
                    className="h-full bg-route rounded-full"
                  />
                </div>
                <p className="text-xs text-muted mt-2">{insights.participatingEmployees} of {insights.totalEmployees} employees have taken at least one carpool ride</p>
              </div>
              <span className="font-display text-2xl font-semibold text-route-dark shrink-0">{insights.participationRate}%</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-card rounded-2xl border border-black/5 shadow-card p-5">
              <p className="text-xs text-muted mb-1">Completed trips</p>
              <p className="font-display text-xl font-semibold">{insights.totalTripsCompleted}</p>
            </div>
            <div className="bg-card rounded-2xl border border-black/5 shadow-card p-5">
              <p className="text-xs text-muted mb-1">Car-trips avoided (seats filled)</p>
              <p className="font-display text-xl font-semibold">{insights.passengerLegs}</p>
            </div>
          </div>

          <p className="text-xs text-muted mt-4">
            Savings are estimated from completed trips using your organization's configured fuel cost, mileage and cost-per-km (editable in the Settings tab), assuming each filled passenger seat replaced a separate solo commute.
          </p>
        </motion.div>
      )}

      {tab === 'employees' && (
        <div className="bg-card rounded-2xl border border-black/5 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-muted text-xs uppercase">
              <tr><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">Email</th><th className="text-left px-5 py-3">Role</th><th className="text-left px-5 py-3">Status</th><th></th></tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id} className="border-t border-black/5">
                  <td className="px-5 py-3 font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-muted">{e.email}</td>
                  <td className="px-5 py-3 capitalize">{e.role}</td>
                  <td className="px-5 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.isActive ? 'bg-route-light text-route-dark' : 'bg-coral/10 text-coral'}`}>{e.isActive ? 'Active' : 'Disabled'}</span></td>
                  <td className="px-5 py-3">
                    {e.role !== 'admin' && (
                      <button onClick={() => toggle(e._id)} className="text-muted hover:text-route-dark">
                        {e.isActive ? <ToggleRight size={22} className="text-route" /> : <ToggleLeft size={22} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && org && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-black/5 shadow-card p-6 max-w-md space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Settings size={16} /> Organization configuration</h3>
          <div>
            <label className="text-xs font-medium text-muted">Fuel cost per litre (₹)</label>
            <input type="number" value={org.fuelCostPerLitre} onChange={(e) => setOrg({ ...org, fuelCostPerLitre: Number(e.target.value) })} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Average mileage (km/l)</label>
            <input type="number" value={org.avgMileageKmpl} onChange={(e) => setOrg({ ...org, avgMileageKmpl: Number(e.target.value) })} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Default cost per km (₹)</label>
            <input type="number" value={org.costPerKm} onChange={(e) => setOrg({ ...org, costPerKm: Number(e.target.value) })} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
          </div>
          <button onClick={saveOrg} className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm">Save settings</button>
        </motion.div>
      )}
    </Layout>
  );
}
