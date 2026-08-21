import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { ArrowLeft, Plus, Trash2, PlusCircle, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GoalsPage() {
  const navigate = useNavigate();
  const { goals, addGoal, depositGoal, deleteGoal } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [depositAmounts, setDepositAmounts] = useState({});

  const handleAdd = (e) => {
    e.preventDefault();
    const num = parseFloat(target);
    if (!name.trim() || isNaN(num) || num <= 0) return;
    addGoal(name, target);
    setName(''); setTarget(''); setShowForm(false);
  };

  const handleDeposit = (id) => {
    const amt = parseFloat(depositAmounts[id]);
    if (isNaN(amt) || amt <= 0) return;
    depositGoal(id, amt);
    setDepositAmounts(prev => ({ ...prev, [id]: '' }));
  };

  const fmt = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0 });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white text-lg">Savings Goals</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(!showForm)}
          className={`p-2.5 rounded-xl border transition-colors ${showForm ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' : 'glass border-white/10 text-white'}`}>
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleAdd} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อเป้าหมาย (เช่น เที่ยวญี่ปุ่น)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-violet-500/50" />
            <input value={target} onChange={e => setTarget(e.target.value)} type="number" placeholder="เป้าหมาย (บาท)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none" />
            <motion.button whileTap={{ scale: 0.95 }} type="submit"
              className="py-2.5 bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-xl font-bold text-sm">
              + เพิ่มเป้าหมาย
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {goals.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
              <Target className="w-12 h-12 text-violet-400/40 mx-auto mb-3" />
              <p className="text-sm">ยังไม่มีเป้าหมาย กด + เพื่อเพิ่ม</p>
            </motion.div>
          ) : goals.map(goal => {
            const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            const isDone = pct >= 100;
            return (
              <motion.div key={goal.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                className={`glass-dark rounded-2xl border p-4 flex flex-col gap-3 relative overflow-hidden ${isDone ? 'border-yellow-500/30' : 'border-white/10'}`}>
                {isDone && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {isDone && <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />}
                      <span>{goal.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">฿{fmt(goal.current)} / ฿{fmt(goal.target)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${isDone ? 'text-yellow-400' : 'text-violet-400'}`}>{Math.round(pct)}%</span>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteGoal(goal.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${isDone ? 'bg-yellow-400' : 'bg-gradient-to-r from-violet-500 to-pink-500'}`}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                </div>

                {/* Deposit */}
                {!isDone && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmounts[goal.id] || ''}
                      onChange={e => setDepositAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                      placeholder="ออมเพิ่ม (บาท)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 outline-none focus:border-violet-500/50"
                    />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeposit(goal.id)}
                      className="px-3 py-2 bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-xl">
                      <PlusCircle className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
