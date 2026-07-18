import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, Phone, MessageCircle, X, Navigation, IndianRupee, Wallet as WalletIcon, Banknote, CreditCard, LocateFixed } from 'lucide-react';
import Layout from '../components/Layout';
import MapView from '../components/MapView';
import ChatBox from '../components/ChatBox';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';

const statusSteps = ['booked', 'started', 'in_progress', 'completed'];
const statusLabels = { booked: 'Ride Booked', started: 'Trip Started', in_progress: 'Trip In Progress', completed: 'Trip Completed' };

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [payMethod, setPayMethod] = useState(null);
  const [paying, setPaying] = useState(false);
  const [presence, setPresence] = useState({}); // userId -> {lat,lng,updatedAt}
  const [sharing, setSharing] = useState(false);
  const presenceWatchId = useRef(null);
  const watchId = useRef(null);

  const isDriver = trip && String(trip.driver._id) === String(user._id);
  const myPassenger = trip?.passengers?.find((p) => String(p.user._id) === String(user._id));

  const load = () =>
    api.get(`/trips/${id}`).then(({ data }) => {
      setTrip(data.trip);
      const initial = {};
      (data.trip.liveShares || []).forEach((s) => {
        initial[String(s.user._id || s.user)] = { lat: s.lat, lng: s.lng, updatedAt: s.updatedAt, user: s.user };
      });
      setPresence(initial);
    });

  useEffect(() => {
    load()
      .then(() => api.get(`/trips/${id}/messages`))
      .then(({ data }) => setMessages(data.messages))
      .finally(() => setLoading(false));

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('trip:join', id);

    const onLocation = (payload) => {
      if (payload.tripId !== id) return;
      setTrip((prev) => (prev ? { ...prev, currentLocation: { lat: payload.lat, lng: payload.lng, updatedAt: payload.updatedAt } } : prev));
    };
    const onStatus = (payload) => {
      if (payload.tripId !== id) return;
      setTrip((prev) => (prev ? { ...prev, status: payload.status } : prev));
    };
    const onMessage = (msg) => {
      if (String(msg.trip) !== id) return;
      setMessages((prev) => [...prev, msg]);
    };
    const onPresenceUpdate = (payload) => {
      if (payload.tripId !== id) return;
      setPresence((prev) => ({ ...prev, [payload.userId]: { lat: payload.lat, lng: payload.lng, updatedAt: payload.updatedAt } }));
    };
    const onPresenceStopped = (payload) => {
      if (payload.tripId !== id) return;
      setPresence((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    };

    socket.on('trip:location', onLocation);
    socket.on('trip:status', onStatus);
    socket.on('chat:message', onMessage);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('presence:stopped', onPresenceStopped);

    return () => {
      socket.emit('trip:leave', id);
      socket.off('trip:location', onLocation);
      socket.off('trip:status', onStatus);
      socket.off('chat:message', onMessage);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('presence:stopped', onPresenceStopped);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (presenceWatchId.current) navigator.geolocation.clearWatch(presenceWatchId.current);
      if (sharing) getSocket().emit('presence:stop', { tripId: id });
    };
  }, [id]);

  const startTrip = async () => {
    await api.put(`/trips/${id}/start`);
    load();
    // begin sharing live location (falls back to a simulated path if geolocation is denied)
    const socket = getSocket();
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => socket.emit('trip:location', { tripId: id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => simulateMovement(socket),
        { enableHighAccuracy: true }
      );
    } else {
      simulateMovement(socket);
    }
  };

  const simulateMovement = (socket) => {
    if (!trip) return;
    const { pickup, destination } = trip;
    let t = 0;
    const iv = setInterval(() => {
      t += 0.08;
      if (t > 1) { clearInterval(iv); return; }
      const lat = pickup.lat + (destination.lat - pickup.lat) * t;
      const lng = pickup.lng + (destination.lng - pickup.lng) * t;
      socket.emit('trip:location', { tripId: id, lat, lng });
    }, 2000);
  };

  const completeTrip = async () => {
    await api.put(`/trips/${id}/complete`);
    load();
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
  };

  const sendMessage = (text) => {
    getSocket().emit('chat:send', { tripId: id, text });
  };

  const toggleSharing = () => {
    const socket = getSocket();
    if (sharing) {
      if (presenceWatchId.current) navigator.geolocation.clearWatch(presenceWatchId.current);
      socket.emit('presence:stop', { tripId: id });
      setSharing(false);
      return;
    }
    setSharing(true);
    if (navigator.geolocation) {
      presenceWatchId.current = navigator.geolocation.watchPosition(
        (pos) => socket.emit('presence:share', { tripId: id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert('Could not access your location. Please allow location permission in your browser.'),
        { enableHighAccuracy: true }
      );
    }
  };

  const pay = async (method) => {
    setPaying(true);
    try {
      await api.post(`/wallet/pay/${id}`, { method });
      await load();
      setPayMethod(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!trip) return <Layout><p className="text-muted text-sm">Trip not found.</p></Layout>;

  const participantInfo = (userId) => {
    if (String(trip.driver._id) === String(userId)) return trip.driver;
    const p = trip.passengers.find((p) => String(p.user._id) === String(userId));
    return p?.user;
  };

  const presenceMarkers = Object.entries(presence)
    .filter(([userId]) => String(userId) !== String(user._id))
    .map(([userId, loc]) => {
      const info = participantInfo(userId);
      return info ? { userId, lat: loc.lat, lng: loc.lng, color: info.avatarColor, initial: info.name[0], name: info.name, updatedAt: loc.updatedAt } : null;
    })
    .filter(Boolean);

  const stepIndex = statusSteps.indexOf(trip.status === 'cancelled' ? 'booked' : trip.status);

  return (
    <Layout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{trip.pickup.address.split(',')[0]} → {trip.destination.address.split(',')[0]}</h1>
          <p className="text-muted text-sm mt-1">{new Date(trip.departureAt).toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleSharing}
            className={`p-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors ${sharing ? 'bg-route text-white' : 'bg-route-light text-route-dark'}`}
          >
            <LocateFixed size={18} className={sharing ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">{sharing ? 'Sharing my location' : 'Share my location'}</span>
          </button>
          <button onClick={() => setChatOpen(true)} className="p-2.5 rounded-xl bg-route-light text-route-dark">
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      {/* status stepper */}
      <div className="flex items-center mb-6">
        {statusSteps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div animate={{ scale: i === stepIndex ? 1.2 : 1 }} className={`w-3 h-3 rounded-full ${i <= stepIndex ? 'bg-route' : 'bg-black/10'}`} />
              <span className={`text-[10px] font-medium text-center max-w-[70px] ${i <= stepIndex ? 'text-route-dark' : 'text-muted'}`}>{statusLabels[s]}</span>
            </div>
            {i < statusSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? 'bg-route' : 'bg-black/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      <MapView
        pickup={trip.pickup} destination={trip.destination}
        liveLocation={trip.currentLocation}
        presenceMarkers={presenceMarkers}
        height={340}
      />
      {presenceMarkers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {presenceMarkers.map((m) => (
            <span key={m.userId} className="text-xs px-3 py-1.5 rounded-full bg-route-light text-route-dark font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-route animate-pulse" /> {m.name} is sharing their location
            </span>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-card rounded-2xl border border-black/5 shadow-card p-5">
          <h3 className="font-semibold text-sm mb-3">Driver</h3>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: trip.driver.avatarColor }}>
              {trip.driver.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{trip.driver.name}</p>
              <p className="text-xs text-muted">{trip.vehicle.model} · {trip.vehicle.registrationNumber}</p>
            </div>
            <a href={`tel:${trip.driver.phone}`} className="p-2 rounded-lg bg-route-light text-route-dark"><Phone size={15} /></a>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-black/5 shadow-card p-5">
          <h3 className="font-semibold text-sm mb-3">Passengers ({trip.passengers.length})</h3>
          <div className="space-y-2">
            {trip.passengers.map((p) => (
              <div key={p._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: p.user.avatarColor }}>
                  {p.user.name[0]}
                </div>
                <p className="text-sm flex-1">{p.user.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.paymentStatus === 'completed' ? 'bg-route-light text-route-dark' : 'bg-signal-light text-signal'}`}>
                  {p.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-6 flex gap-3 flex-wrap">
        {isDriver && trip.status === 'booked' && (
          <button onClick={startTrip} className="px-5 py-2.5 rounded-xl bg-route text-white font-semibold text-sm flex items-center gap-2"><Play size={16} /> Start trip</button>
        )}
        {isDriver && ['started', 'in_progress'].includes(trip.status) && (
          <button onClick={completeTrip} className="px-5 py-2.5 rounded-xl bg-ink text-white font-semibold text-sm flex items-center gap-2"><CheckCircle2 size={16} /> Complete trip</button>
        )}
        {!isDriver && myPassenger && trip.status === 'completed' && myPassenger.paymentStatus !== 'completed' && (
          <button onClick={() => setPayMethod('choose')} className="px-5 py-2.5 rounded-xl bg-signal text-white font-semibold text-sm flex items-center gap-2">
            <IndianRupee size={16} /> Pay ₹{myPassenger.fare}
          </button>
        )}
      </div>

      {/* payment method sheet */}
      {payMethod && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setPayMethod(null)}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Pay ₹{myPassenger?.fare}</h3>
              <button onClick={() => setPayMethod(null)}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {[{ id: 'wallet', label: 'Wallet balance', icon: WalletIcon }, { id: 'upi', label: 'UPI', icon: IndianRupee }, { id: 'card', label: 'Card', icon: CreditCard }, { id: 'cash', label: 'Cash', icon: Banknote }].map(({ id: m, label, icon: Icon }) => (
                <button key={m} disabled={paying} onClick={() => pay(m)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-black/10 hover:bg-route-light text-sm font-medium disabled:opacity-60">
                  <Icon size={18} className="text-route-dark" /> {label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* chat drawer */}
      {chatOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setChatOpen(false)}>
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 28 }} onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-sm h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <h3 className="font-semibold">Trip chat</h3>
              <button onClick={() => setChatOpen(false)}><X size={18} /></button>
            </div>
            <ChatBox messages={messages} onSend={sendMessage} currentUserId={user._id} />
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
