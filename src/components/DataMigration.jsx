import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const DATA_KEYS = ['learnedCards', 'favCards', 'todoData', 'habitData', 'financeData', 'goalsData', 'notesData', 'projectsData', 'countdownData', 'appSettings', 'streakData', 'myfee_cr_progress', 'expenseCategories', 'incomeCategories'];

export default function DataMigration() {
  const { importAllData } = useStore();
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleExport = () => {
    const data = {};
    DATA_KEYS.forEach(k => {
      try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { data[k] = null; }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `myfee-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importAllData(data);
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      } catch {
        setStatus('error');
        setTimeout(() => setStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="glass-dark rounded-2xl border border-white/10 p-4">
      <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">โอนย้ายข้อมูลจาก v1</p>
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold">
          <Download className="w-4 h-4" /> Export จาก v1
        </motion.button>
        <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold cursor-pointer">
          <Upload className="w-4 h-4" /> Import เข้า v2
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>
      <p className="text-[10px] text-gray-600 mt-2 text-center">กด Export บน v1 → เอาไฟล์มา Import ที่นี่</p>
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {status === 'success' ? 'นำเข้าข้อมูลสำเร็จแล้ว' : 'ไฟล์ไม่ถูกต้อง กรุณาลองใหม่'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
