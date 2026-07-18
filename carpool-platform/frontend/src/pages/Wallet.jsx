import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, IndianRupee } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const quickAmounts = [200, 500, 1000, 2000];

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);

  const load = () => api.get('/wallet').then(({ data }) => { setBalance(data.balance); setTransactions(data.transactions); });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const recharge = async (amt) => {
    if (!amt || amt <= 0) return;
    setRecharging(true);
    try {
      await api.post('/wallet/recharge', { amount: amt });
      await load();
      setAmount('');
    } finally {
      setRecharging(false);
    }
  };

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-1">Wallet</h1>
      <p className="text-muted text-sm mb-6">Manage your balance and payment methods.</p>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-ink text-white rounded-2xl p-7 relative overflow-hidden">
        <WalletIcon size={22} className="text-route mb-6" />
        <p className="text-white/50 text-xs">Available balance</p>
        <p className="font-display text-4xl font-semibold mt-1 flex items-center gap-1"><IndianRupee size={28} />{balance.toLocaleString()}</p>
        <motion.div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-route/10" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} />
      </motion.div>

      <div className="bg-card rounded-2xl border border-black/5 shadow-card p-6 mt-4">
        <h3 className="font-semibold text-sm mb-4">Recharge wallet</h3>
        <div className="flex gap-2 flex-wrap mb-4">
          {quickAmounts.map((a) => (
            <button key={a} onClick={() => setAmount(String(a))} className={`px-4 py-2 rounded-xl text-sm font-medium border ${String(a) === amount ? 'bg-route text-white border-route' : 'border-black/10 text-ink hover:bg-route-light'}`}>
              ₹{a}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm" />
          <button onClick={() => recharge(Number(amount))} disabled={recharging} className="px-6 py-2.5 rounded-xl bg-route text-white font-semibold text-sm disabled:opacity-60">
            {recharging ? 'Processing…' : 'Recharge'}
          </button>
        </div>
        <p className="text-xs text-muted mt-2">Processed via Razorpay test mode — no real money is charged.</p>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold text-sm mb-4">Recent transactions</h3>
        {loading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <p className="text-muted text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => {
              const credit = ['recharge', 'ride_earning', 'refund'].includes(t.type);
              return (
                <div key={t._id} className="bg-card border border-black/5 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${credit ? 'bg-route-light text-route-dark' : 'bg-coral/10 text-coral'}`}>
                    {credit ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{t.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {t.method}</p>
                  </div>
                  <p className={`font-mono text-sm font-semibold ${credit ? 'text-route-dark' : 'text-coral'}`}>{credit ? '+' : '-'}₹{t.amount}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
