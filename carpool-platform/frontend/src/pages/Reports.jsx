import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Route, TrendingUp, Fuel, IndianRupee } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary').then(({ data }) => setReport(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const costPerKm = 7.5;
  const totalCost = Math.round((report?.totalDistance || 0) * costPerKm);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Reports & Analytics</h1>
      <p className="text-muted text-sm mb-6">Insights into your travel activity and transportation costs.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Route} label="Total trips" value={report.totalTrips} accent="route" />
        <StatCard icon={TrendingUp} label="Distance travelled" value={`${report.totalDistance} km`} accent="signal" delay={0.05} />
        <StatCard icon={Fuel} label="Est. fuel cost" value={`₹${totalCost}`} accent="coral" delay={0.1} />
        <StatCard icon={IndianRupee} label="Cost per km" value={`₹${costPerKm}`} accent="route" delay={0.15} />
      </div>

      <div className="bg-card rounded-2xl border border-black/5 shadow-card p-6 mt-6">
        <h3 className="font-semibold text-sm mb-4">Trips by month</h3>
        {report.monthly.length === 0 ? (
          <p className="text-muted text-sm py-10 text-center">Complete a few trips to see your monthly trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.monthly}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E7E5DD" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5B6672' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6672' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#E4F5EF' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px -12px rgba(18,24,28,0.25)' }} />
              <Bar dataKey="trips" fill="#1FAE86" radius={[6, 6, 0, 0]} name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {report.vehicleWise.length > 0 && (
        <div className="bg-card rounded-2xl border border-black/5 shadow-card p-6 mt-6">
          <h3 className="font-semibold text-sm mb-4">Vehicle-wise cost analysis</h3>
          <div className="space-y-3">
            {report.vehicleWise.map((v) => (
              <div key={v.registrationNumber} className="flex items-center justify-between text-sm">
                <span>{v.vehicle} <span className="text-muted font-mono text-xs">{v.registrationNumber}</span></span>
                <span className="text-muted">{v.trips} trips · {Math.round(v.distance)} km</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
