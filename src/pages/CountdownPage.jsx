import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { useConfirmDelete } from '../hooks/useConfirmDelete';
import { isValidIsoDate } from '../utils/dateUtils';
import { ArrowLeft, Plus, Trash2, Clock, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function calcDiff(dateStr) {
  if (isValidIsoDate(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return NaN;
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export default function CountdownPage() {
  const navigate = useNavigate();
  const { countdowns, addCountdown, deleteCountdown } = useStore();
  const { confirmDeleteId, requestDelete } = useConfirmDelete(deleteCountdown);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const sorted = [...(countdowns || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    addCountdown(name, date);
    setName('');
    setDate('');
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          aria-label="กลับหน้าหลัก"
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white text-lg">นับถอยหลัง</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleAdd} className="glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น วันเกิด, วันสอบ..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-purple-500/50"
        />
        <input
          type="date"
          aria-label="วันที่เป้าหมาย"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-400 text-sm outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl font-bold text-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มกำหนดการ
        </motion.button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {sorted.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
              <Hourglass className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
              <p className="text-sm">ยังไม่มีกำหนดการ เพิ่มได้เลย</p>
            </motion.div>
          ) : sorted.map((item) => {
            const diff = calcDiff(item.date);
            const isInvalid = isNaN(diff);
            const isPast = !isInvalid && diff < 0;
            const isToday = !isInvalid && diff === 0;
            const color = isInvalid
              ? 'from-red-500 to-rose-500'
              : isToday
              ? 'from-yellow-500 to-orange-500'
              : isPast
              ? 'from-gray-600 to-gray-700'
              : 'from-purple-500 to-violet-500';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="glass-dark rounded-2xl border border-white/10 p-5 relative overflow-hidden group"
              >
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color} pointer-events-none`} />
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br ${color} shrink-0`}>
                    <span className="text-2xl font-black text-white leading-none">{isInvalid ? '?' : Math.abs(diff)}</span>
                    <span className="text-[9px] text-white/70 font-bold uppercase">
                      {isInvalid ? 'Error' : isToday ? 'today!' : isPast ? 'วันที่แล้ว' : 'วัน'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isInvalid
                        ? 'วันที่ไม่ถูกต้อง'
                        : new Date(item.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    aria-label={`ลบกำหนดการ ${item.name}`}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => requestDelete(item.id)}
                    className={`p-1.5 transition-all ${confirmDeleteId === item.id ? 'text-red-400 bg-red-500/20 rounded-lg' : 'text-gray-500 hover:text-red-400'}`}
                  >
                    {confirmDeleteId === item.id ? <span className="text-[10px] font-bold">ยืนยัน</span> : <Trash2 className="w-4 h-4" />}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
