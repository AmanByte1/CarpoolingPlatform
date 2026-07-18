import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => navigate(user ? '/dashboard' : '/login'), 1400);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center overflow-hidden relative">
      <svg width="0" height="0"><defs /></svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="relative w-20 h-20 mb-6">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-route"
            animate={{ rotate: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-display font-bold text-3xl">C</span>
          </div>
        </div>
        <h1 className="text-white font-display font-semibold text-2xl tracking-tight">Commute</h1>
        <p className="text-white/50 text-sm mt-1">Enterprise carpooling, simplified</p>
      </motion.div>

      <motion.div
        className="absolute bottom-16 h-px w-40"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg,#1FAE86 0 8px,transparent 8px 16px)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
    </div>
  );
}
