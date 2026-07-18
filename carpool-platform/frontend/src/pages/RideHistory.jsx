import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Car } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RideHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trips/history').then(({ data }) => setTrips(data.trips)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Ride History</h1>
      <p className="text-muted text-sm mb-6">A record of all your completed trips.</p>

      {loading ? <LoadingSpinner /> : trips.length === 0 ? (
        <div className="bg-card border border-dashed border-black/10 rounded-2xl p-10 text-center text-muted text-sm">No completed rides yet.</div>
      ) : (
        <div className="space-y-3">
          {trips.map((t, i) => {
            const isDriver = String(t.driver._id) === String(user._id);
            return (
              <motion.div key={t._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-card border border-black/5 shadow-card rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <span className="w-2 h-2 rounded-full bg-route" />
                      <span className="w-px h-6 bg-route/30" />
                      <span className="w-2 h-2 rounded-full bg-signal" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.pickup.address}</p>
                      <p className="text-sm font-medium mt-3">{t.destination.address}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${t.status === 'completed' ? 'bg-route-light text-route-dark' : 'bg-coral/10 text-coral'}`}>{t.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted mt-4 pt-4 border-t border-black/5">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.completedAt || t.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Car size={12} /> {t.vehicle?.model}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {t.distanceKm} km</span>
                  <span className="ml-auto font-medium">{isDriver ? `Drove ${t.passengers.length} passenger(s)` : 'Passenger'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
