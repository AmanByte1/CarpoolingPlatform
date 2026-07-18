import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, ChevronRight, Car } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColor = {
  booked: 'bg-signal-light text-signal',
  started: 'bg-route-light text-route-dark',
  in_progress: 'bg-route-light text-route-dark',
};

export default function MyTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trips/mine').then(({ data }) => setTrips(data.trips)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">My Trips</h1>
      <p className="text-muted text-sm mb-6">Your upcoming and active rides.</p>

      {loading ? (
        <LoadingSpinner />
      ) : trips.length === 0 ? (
        <div className="bg-card border border-dashed border-black/10 rounded-2xl p-10 text-center text-muted text-sm">
          No trips yet. Find or offer a ride to see it here.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((t, i) => {
            const isDriver = String(t.driver._id) === String(user._id);
            return (
              <Link to={`/trips/${t._id}`} key={t._id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 3 }}
                  className="bg-card border border-black/5 shadow-card rounded-2xl p-5 flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isDriver ? '#F5A62333' : '#1FAE8633' }}>
                    <Car size={18} className={isDriver ? 'text-signal' : 'text-route-dark'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.pickup.address} → {t.destination.address}</p>
                    <div className="flex items-center gap-3 text-xs text-muted mt-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(t.departureAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {t.passengers.length} passenger{t.passengers.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0 ${statusColor[t.status] || 'bg-surface text-muted'}`}>
                    {isDriver ? 'Driving' : 'Riding'} · {t.status.replace('_', ' ')}
                  </span>
                  <ChevronRight size={18} className="text-muted shrink-0" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
