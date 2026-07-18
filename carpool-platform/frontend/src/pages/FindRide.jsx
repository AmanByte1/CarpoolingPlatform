import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Repeat, ArrowRight, ArrowLeft, IndianRupee } from 'lucide-react';
import Layout from '../components/Layout';
import RouteStepper from '../components/RouteStepper';
import PlaceInput from '../components/PlaceInput';
import MapView from '../components/MapView';
import RideCard from '../components/RideCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = ['Find Ride', 'Route Confirmation', 'Available Rides'];

const todayStr = () => new Date().toISOString().slice(0, 10);
const maxDateStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function FindRide() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('09:00');
  const [seats, setSeats] = useState(1);
  const [recurring, setRecurring] = useState(false);
  const [route, setRoute] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const savedPlaces = user?.savedPlaces || [];

  const confirmRoute = async () => {
    setError('');
    if (!pickup || !destination) {
      setError('Please choose both pickup and destination.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/rides/route-preview', { pickup, destination });
      setRoute(data.route);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not calculate route.');
    } finally {
      setLoading(false);
    }
  };

  const searchRides = async () => {
    setLoading(true);
    setError('');
    try {
      const dateTime = `${date}T${time}`;
      const { data } = await api.get('/rides/search', {
        params: { pickupLat: pickup.lat, pickupLng: pickup.lng, destLat: destination.lat, destLng: destination.lng, date: dateTime, seats },
      });
      setRides(data.rides);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const bookRide = async (ride) => {
    setBooking(ride._id);
    try {
      await api.post(`/rides/${ride._id}/book`, { seats });
      setRides((prev) => prev.map((r) => (r._id === ride._id ? { ...r, availableSeats: r.availableSeats - seats } : r)));
      alert('Ride booked! Check "My Trips" to view details.');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(null);
    }
  };

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Find a Ride</h1>
      <p className="text-muted text-sm mb-6">Search for available rides matching your route and schedule.</p>

      <RouteStepper steps={steps} current={step} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-black/5 shadow-card p-6 space-y-4">
            <PlaceInput label="Pickup location" value={pickup} onChange={setPickup} savedPlaces={savedPlaces} />
            <PlaceInput label="Destination" value={destination} onChange={setDestination} savedPlaces={savedPlaces} />

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><Calendar size={12} /> Travel date</label>
                <input type="date" value={date} min={todayStr()} max={maxDateStr()}
                  onChange={(e) => setDate(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><Clock size={12} /> Travel time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><Users size={12} /> Seats needed</label>
                <input type="number" min={1} max={4} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="rounded" />
              <Repeat size={14} /> This is a recurring ride
            </label>

            {error && <p className="text-coral text-xs bg-coral/10 rounded-lg px-3 py-2">{error}</p>}

            <button onClick={confirmRoute} disabled={loading} className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? 'Calculating route…' : 'Confirm route'} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 1 && route && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <MapView pickup={pickup} destination={destination} polyline={route.polyline} height={320} />
            <div className="bg-card rounded-2xl border border-black/5 shadow-card p-6 grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xl font-display font-semibold">{route.distanceKm} km</p><p className="text-xs text-muted">Distance</p></div>
              <div><p className="text-xl font-display font-semibold">{route.durationMin} min</p><p className="text-xs text-muted">Est. duration</p></div>
              <div><p className="text-xl font-display font-semibold">{seats}</p><p className="text-xs text-muted">Seats needed</p></div>
            </div>
            {error && <p className="text-coral text-xs bg-coral/10 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl border border-black/10 font-semibold text-sm flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back</button>
              <button onClick={searchRides} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors disabled:opacity-70">
                {loading ? 'Searching…' : 'Search matching rides'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={() => setStep(1)} className="text-sm text-route-dark font-medium flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Adjust route</button>
            {loading ? (
              <LoadingSpinner />
            ) : rides.length === 0 ? (
              <div className="bg-card border border-dashed border-black/10 rounded-2xl p-10 text-center text-muted text-sm">
                No matching rides found for this route and time. Try a different time, or offer your own ride!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {rides.map((r) => (
                  <RideCard key={r._id} ride={r} onBook={bookRide} booking={booking === r._id} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
