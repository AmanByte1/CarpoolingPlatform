import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, Car, MapPinned, Wallet as WalletIcon,
  History, Settings as SettingsIcon, ShieldCheck, LogOut, Menu, X, BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/find-ride', label: 'Find a Ride', icon: Search },
  { to: '/offer-ride', label: 'Offer a Ride', icon: Car },
  { to: '/my-trips', label: 'My Trips', icon: MapPinned },
  { to: '/wallet', label: 'Wallet', icon: WalletIcon },
  { to: '/ride-history', label: 'Ride History', icon: History },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Console', icon: ShieldCheck }] : employeeLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-7">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-route flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">C</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Commute</span>
        </div>
        <div className="route-divider mt-5 rounded-full" />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-route text-white shadow-soft' : 'text-muted hover:bg-route-light hover:text-route-dark'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 pt-3 border-t border-black/5">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
            style={{ backgroundColor: user?.avatarColor || '#1FAE86' }}
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-muted truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-coral hover:bg-coral/10 transition-colors"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-black/5 z-30">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-black/5 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-route flex items-center justify-center">
            <span className="text-white font-display font-bold text-xs">C</span>
          </div>
          <span className="font-display font-semibold">Commute</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 text-ink">
          <Menu size={22} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 w-72 bg-card z-50 md:hidden"
            >
              <div className="flex justify-end p-3">
                <button onClick={() => setOpen(false)} className="p-2"><X size={20} /></button>
              </div>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
