import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Flame,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import ChangePinModal from '../components/ChangePinModal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, streak } = useStore();
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white dark-invert text-lg">ตั้งค่า & สถิติ</h1>
        <div className="w-10" />
      </div>

      {/* Streak Banner */}
      <div className="glass-dark rounded-2xl p-5 border border-orange-500/30 flex items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
          <Flame className="w-6 h-6 text-white fill-current" />
        </div>
        <div className="z-10">
          <h3 className="text-white dark-invert font-bold text-base">Streak ต่อเนื่อง</h3>
          <p className="text-sm text-gray-300 mt-0.5">{streak.count} วัน</p>
          <p className="text-[10px] text-gray-500 mt-0.5">วันนี้อ่านแล้ว {streak.cardsFlippedToday}/10 คำ</p>
        </div>
      </div>

      {/* Settings Options */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="glass-dark rounded-2xl border border-white/10 p-5 space-y-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">แอปพลิเคชัน</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-white dark-invert text-sm">โหมดกลางคืน (Dark Mode)</p>
                <p className="text-xs text-gray-500">ปรับธีมแอปพลิเคชัน</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-indigo-500' : 'bg-gray-600'}`}
            >
              <motion.div
                animate={{ x: settings.darkMode ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                {settings.autoPlay ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-white dark-invert text-sm">เล่นเสียงอัตโนมัติ</p>
                <p className="text-xs text-gray-500">อ่านออกเสียงเมื่อเปิดการ์ด</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoPlay ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <motion.div
                animate={{ x: settings.autoPlay ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </div>

        <div className="glass-dark rounded-2xl border border-white/10 p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">งบประมาณรายรับ-รายจ่าย</h3>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">งบประมาณรายวัน (บาท)</label>
            <input
              type="number"
              value={settings.dailyBudget || ''}
              onChange={(e) => updateSettings({ dailyBudget: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white dark-invert text-sm outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">งบประมาณรายเดือน (บาท)</label>
            <input
              type="number"
              value={settings.monthlyBudget || ''}
              onChange={(e) => updateSettings({ monthlyBudget: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white dark-invert text-sm outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Security & PIN Lock */}
        <div className="glass-dark rounded-2xl border border-white/10 p-5 space-y-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">ความปลอดภัย & PIN</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white dark-invert text-sm">ล็อกแอปด้วย PIN (4 หลัก)</p>
                <p className="text-xs text-gray-500">ต้องใส่รหัส PIN ก่อนเข้าใช้งาน</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ isPinEnabled: !(settings.isPinEnabled !== false) })}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.isPinEnabled !== false ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <motion.div
                animate={{ x: settings.isPinEnabled !== false ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white dark-invert text-sm">เปลี่ยนรหัส PIN</p>
                <p className="text-xs text-gray-500">ตั้งรหัสผ่าน 4 หลักใหม่</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChangePinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-colors"
            >
              เปลี่ยนรหัส
            </motion.button>
          </div>
        </div>
      </div>

      {/* Change PIN Modal */}
      <ChangePinModal isOpen={showChangePinModal} onClose={() => setShowChangePinModal(false)} />
    </div>
  );
}
