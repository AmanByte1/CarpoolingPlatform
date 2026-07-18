import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Car, MapPinned, Route, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/trips/mine'), api.get('/reports/summary')])
      .then(([t, r]) => {
        setTrips(t.data.trips);
        setReport(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-muted text-sm">{greeting()},</p>
        <h1 className="font-display text-3xl font-semibold">{user?.name?.split(' ')[0]} 👋</h1>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <Link to="/find-ride">
          <motion.div whileHover={{ y: -3 }} className="bg-ink text-white rounded-2xl p-6 relative overflow-hidden">
            <Search size={22} className="text-route mb-4" />
            <h3 className="font-display font-semibold text-lg">Find a Ride</h3>
            <p className="text-white/50 text-sm mt-1">Search rides matching your route and time.</p>
            <motion.div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-route/20" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} />
          </motion.div>
        </Link>
        <Link to="/offer-ride">
          <motion.div whileHover={{ y: -3 }} className="bg-card border border-black/5 shadow-card rounded-2xl p-6 relative overflow-hidden">
            <Car size={22} className="text-signal mb-4" />
            <h3 className="font-display font-semibold text-lg">Offer a Ride</h3>
            <p className="text-muted text-sm mt-1">Publish your route and share your seats.</p>
          </motion.div>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <StatCard icon={Route} label="Completed trips" value={report?.totalTrips ?? 0} accent="route" delay={0} />
            <StatCard icon={TrendingUp} label="Distance travelled" value={`${report?.totalDistance ?? 0} km`} accent="signal" delay={0.05} />
            <StatCard icon={MapPinned} label="Active trips" value={trips.length} accent="coral" delay={0.1} />
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Upcoming trips</h2>
              <Link to="/my-trips" className="text-sm text-route-dark font-medium">View all</Link>
            </div>
            {trips.length === 0 ? (
              <div className="bg-card border border-dashed border-black/10 rounded-2xl p-10 text-center text-muted text-sm">
                No upcoming trips yet. Find or offer a ride to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {trips.slice(0, 3).map((t) => (
                  <Link to={`/trips/${t._id}`} key={t._id}>
                    <motion.div whileHover={{ x: 3 }} className="bg-card border border-black/5 rounded-xl p-4 flex items-center justify-between shadow-card">
                      <div>
                        <p className="font-medium text-sm">{t.pickup.address} → {t.destination.address}</p>
                        <p className="text-xs text-muted mt-1">{new Date(t.departureAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-route-light text-route-dark font-medium capitalize">{t.status.replace('_', ' ')}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
