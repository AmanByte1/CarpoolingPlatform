import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ full = false, label = 'Loading' }) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-10 h-10">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-route/30"
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-route border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
      <span className="text-sm text-muted font-medium">{label}…</span>
    </div>
  );
  if (full) {
    return <div className="min-h-screen flex items-center justify-center bg-surface">{content}</div>;
  }
  return <div className="py-16 flex items-center justify-center">{content}</div>;
}
