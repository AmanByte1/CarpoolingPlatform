import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, IndianRupee, Star, Sparkles } from 'lucide-react';

export default function RideCard({ ride, onBook, booking }) {
  const departure = new Date(ride.departureAt);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="bg-card rounded-2xl shadow-card border border-black/5 p-5 relative"
    >
      {ride.matchScore != null && (
        <div className="absolute -top-2.5 right-4 flex items-center gap-1 bg-ink text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-soft">
          <Sparkles size={11} className="text-signal" /> {ride.matchScore}% Match
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
            style={{ backgroundColor: ride.driver?.avatarColor || '#1FAE86' }}
          >
            {ride.driver?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <p className="font-semibold text-sm">{ride.driver?.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted">
              <Star size={12} className="fill-signal text-signal" />
              {ride.driver?.ratingAvg?.toFixed(1) || '5.0'}
              <span className="mx-1">·</span>
              {ride.vehicle?.model} · {ride.vehicle?.color}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-route-dark flex items-center justify-end gap-0.5">
            <IndianRupee size={14} />{ride.farePerSeat}
          </p>
          <p className="text-xs text-muted">per seat</p>
        </div>
      </div>

      <div className="mt-4 pl-1">
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-route" />
            <span className="w-px h-8 bg-route/30 my-0.5" style={{ backgroundImage: 'repeating-linear-gradient(180deg,#1FAE86 0 4px,transparent 4px 8px)' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-signal" />
          </div>
          <div className="flex-1 space-y-3.5">
            <p className="text-sm font-medium leading-tight">{ride.pickup?.address}</p>
            <p className="text-sm font-medium leading-tight">{ride.destination?.address}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1"><Clock size={13} /> {departure.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="flex items-center gap-1"><Users size={13} /> {ride.availableSeats} seats left</span>
        {ride.pickupDistanceKm != null && <span>{ride.pickupDistanceKm} km from pickup</span>}
      </div>

      {onBook && (
        <button
          onClick={() => onBook(ride)}
          disabled={booking}
          className="mt-4 w-full py-2.5 rounded-xl bg-route text-white font-semibold text-sm hover:bg-route-dark transition-colors disabled:opacity-60"
        >
          {booking ? 'Booking…' : 'Book this ride'}
        </button>
      )}
    </motion.div>
  );
}
