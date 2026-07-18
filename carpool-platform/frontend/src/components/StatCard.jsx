import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, accent = 'route', delay = 0 }) {
  const colorMap = {
    route: 'bg-route-light text-route-dark',
    signal: 'bg-signal-light text-signal',
    coral: 'bg-coral/10 text-coral',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-card rounded-2xl border border-black/5 shadow-card p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-display font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted mt-1">{label}</p>
      </div>
    </motion.div>
  );
}
