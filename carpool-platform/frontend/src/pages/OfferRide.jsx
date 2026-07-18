import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, IndianRupee, ArrowRight, ArrowLeft, Car, PlusCircle, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import RouteStepper from '../components/RouteStepper';
import PlaceInput from '../components/PlaceInput';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = ['Offer Ride', 'Route Confirmation', 'Published'];

const todayStr = () => new Date().toISOString().slice(0, 10);
const maxDateStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function OfferRide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('09:00');
  const [seats, setSeats] = useState(3);
  const [fare, setFare] = useState('');
  const [route, setRoute] = useState(null);
  const [fareSuggestion, setFareSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishedRide, setPublishedRide] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vehicles').then(({ data }) => {
      setVehicles(data.vehicles);
      if (data.vehicles.length) setVehicleId(data.vehicles[0]._id);
    });
  }, []);

  const savedPlaces = user?.savedPlaces || [];
  const selectedVehicle = vehicles.find((v) => v._id === vehicleId);

  const confirmRoute = async () => {
    setError('');
    if (!vehicleId) { setError('Please register a vehicle first.'); return; }
    if (!pickup || !destination) { setError('Please choose both pickup and destination.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/rides/route-preview', { pickup, destination });
      setRoute(data.route);
      const fareRes = await api.post('/rides/suggest-fare', { distanceKm: data.route.distanceKm, departureAt: `${date}T${time}` });
      setFareSuggestion(fareRes.data);
      if (!fare) setFare(fareRes.data.suggestedFare);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not calculate route.');
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/rides', {
        vehicleId, pickup, destination,
        departureAt: `${date}T${time}`,
        availableSeats: seats,
        farePerSeat: Number(fare),
      });
      setPublishedRide(data.ride);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish ride.');
    } finally {
      setLoading(false);
    }
  };

  if (vehicles.length === 0) {
    return (
      <Layout>
        <div className="bg-card border border-dashed border-black/10 rounded-2xl p-10 text-center">
          <Car className="mx-auto text-muted mb-3" size={32} />
          <h2 className="font-display font-semibold text-lg">Register a vehicle first</h2>
          <p className="text-muted text-sm mt-1 mb-5">You need at least one registered vehicle before you can offer a ride.</p>
          <button onClick={() => navigate('/vehicles')} className="px-5 py-2.5 rounded-xl bg-route text-white font-semibold text-sm inline-flex items-center gap-2">
            <PlusCircle size={16} /> Add a vehicle
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Offer a Ride</h1>
      <p className="text-muted text-sm mb-6">Publish your route and share your seats with colleagues.</p>

      <RouteStepper steps={steps} current={step} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-2xl border border-black/5 shadow-card p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm bg-card">
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>{v.model} · {v.registrationNumber} · {v.seatingCapacity} seats</option>
                ))}
              </select>
            </div>

            <PlaceInput label="Pickup location" value={pickup} onChange={setPickup} savedPlaces={savedPlaces} />
            <PlaceInput label="Destination" value={destination} onChange={setDestination} savedPlaces={savedPlaces} />

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><Calendar size={12} /> Date</label>
                <input type="date" value={date} min={todayStr()} max={maxDateStr()}
                  onChange={(e) => setDate(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><Clock size={12} /> Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><Users size={12} /> Available seats</label>
                <input type="number" min={1} max={selectedVehicle?.seatingCapacity || 4} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
              </div>
            </div>

            {error && <p className="text-coral text-xs bg-coral/10 rounded-lg px-3 py-2">{error}</p>}

            <button onClick={confirmRoute} disabled={loading} className="w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? 'Calculating route…' : 'Confirm route'} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 1 && route && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <MapView pickup={pickup} destination={destination} polyline={route.polyline} height={320} />
            <div className="bg-card rounded-2xl border border-black/5 shadow-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div><p className="text-xl font-display font-semibold">{route.distanceKm} km</p><p className="text-xs text-muted">Distance</p></div>
                <div><p className="text-xl font-display font-semibold">{route.durationMin} min</p><p className="text-xs text-muted">Est. duration</p></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1"><IndianRupee size={12} /> Fare per seat</label>
                <input type="number" min={1} value={fare} onChange={(e) => setFare(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
                {fareSuggestion && (
                  <p className="text-xs text-route-dark mt-1.5 flex items-center gap-1">
                    <Sparkles size={12} className="text-signal" />
                    AI-suggested ₹{fareSuggestion.suggestedFare}
                    {fareSuggestion.method === 'regression'
                      ? ` · trained on ${fareSuggestion.sampleSize} past rides in your org (${fareSuggestion.confidence} confidence)`
                      : ' · baseline estimate (not enough ride history yet to train a model)'}
                  </p>
                )}
              </div>
            </div>
            {error && <p className="text-coral text-xs bg-coral/10 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl border border-black/10 font-semibold text-sm flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back</button>
              <button onClick={publish} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors disabled:opacity-70">
                {loading ? 'Publishing…' : 'Publish ride'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && publishedRide && (
          <motion.div key="s2" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-black/5 shadow-card p-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="w-16 h-16 rounded-full bg-route-light flex items-center justify-center mx-auto mb-4">
              <Car className="text-route-dark" size={28} />
            </motion.div>
            <h2 className="font-display text-xl font-semibold">Ride published!</h2>
            <p className="text-muted text-sm mt-1">Colleagues along your route can now find and book this ride.</p>
            <div className="flex gap-3 mt-6 max-w-xs mx-auto">
              <button onClick={() => navigate('/my-trips')} className="flex-1 py-2.5 rounded-xl bg-route text-white font-semibold text-sm">My Trips</button>
              <button onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-xl border border-black/10 font-semibold text-sm">Offer another</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
