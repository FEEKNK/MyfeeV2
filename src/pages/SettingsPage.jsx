import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Flame,
  Lock,
  KeyRound,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import ChangePinModal from '../components/ChangePinModal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    settings,
    updateSettings,
    streak,
    habits,
    finance,
    todos,
    learnedCards,
    notes,
    exportAllData,
    importAllData,
    isSyncing,
    lastSyncedAt,
    cloudSyncError,
    syncCloudData,
  } = useStore();

  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [copied, setCopied] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const fileInputRef = useRef(null);

  const handleManualSync = async () => {
    setManualSyncing(true);
    try {
      await syncCloudData();
      setBackupStatus({
        type: 'success',
        message: 'ซิงค์ข้อมูลกับคลาวด์สำเร็จ! ⚡',
      });
      setTimeout(() => setBackupStatus(null), 3000);
    } catch {
      setBackupStatus({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการซิงค์',
      });
      setTimeout(() => setBackupStatus(null), 3000);
    } finally {
      setManualSyncing(false);
    }
  };

  const handleExport = () => {
    try {
      const data = exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `myfee_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupStatus({
        type: 'success',
        message: `สำรองข้อมูลสำเร็จ! ดาวน์โหลดไฟล์ myfee_backup_${dateStr}.json เรียบร้อย`,
      });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      setBackupStatus({
        type: 'error',
        message: `เกิดข้อผิดพลาดในการสำรองข้อมูล: ${err.message}`,
      });
      setTimeout(() => setBackupStatus(null), 4000);
    }
  };

  const handleCopyJson = async () => {
    try {
      const data = exportAllData();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setBackupStatus({
        type: 'success',
        message: 'คัดลอกข้อความ JSON ลงคลิปบอร์ดแล้ว',
      });
      setTimeout(() => {
        setCopied(false);
        setBackupStatus(null);
      }, 3000);
    } catch {
      setBackupStatus({
        type: 'error',
        message: 'ไม่สามารถคัดลอกได้ กรุณาใช้ปุ่มดาวน์โหลดไฟล์',
      });
      setTimeout(() => setBackupStatus(null), 3000);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result);
        const success = importAllData(parsed);
        if (success) {
          setBackupStatus({
            type: 'success',
            message: 'กู้คืนข้อมูลทั้งหมดเรียบร้อยแล้ว!',
          });
        } else {
          setBackupStatus({
            type: 'error',
            message: 'รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ JSON ที่สำรองไว้',
          });
        }
      } catch (err) {
        setBackupStatus({
          type: 'error',
          message: 'ไม่สามารถอ่านไฟล์ได้: ' + err.message,
        });
      }
      setTimeout(() => setBackupStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
        <h1 className="font-black text-white dark-invert text-lg">ตั้งค่า & ข้อมูล</h1>
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
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* Cloud Sync Status Card */}
        <div className="glass-dark rounded-2xl border border-blue-500/30 p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white dark-invert text-sm">คลาวด์ซิงค์เรียลไทม์ (Auto-Sync)</h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-gray-400">ซิงค์อัตโนมัติระหว่างมือถือและคอมพิวเตอร์แบบ Single-User</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="text-gray-400">
              สถานะ: <span className="text-emerald-400 font-bold">เชื่อมต่ออัตโนมัติ</span>
              {lastSyncedAt && (
                <span className="text-[11px] text-gray-500 block">
                  ซิงค์ล่าสุด: {new Date(lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleManualSync}
              disabled={isSyncing || manualSyncing}
              className="py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSyncing || manualSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              ซิงค์ทันที
            </motion.button>
          </div>

          {cloudSyncError && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">รอการสร้างตารางบน Supabase:</span>{' '}
                กรุณารันคำสั่งในไฟล์ <code className="bg-black/30 px-1 rounded font-mono">supabase_schema.sql</code> บน Supabase SQL Editor 1 ครั้งเพื่อให้คลาวด์เริ่มทำงาน
              </div>
            </div>
          )}
        </div>

        {/* Backup & Restore Card */}
        <div className="glass-dark rounded-2xl border border-emerald-500/30 p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white dark-invert text-sm">สำรอง & กู้คืนข้อมูล (Backup)</h3>
                <p className="text-xs text-gray-400">เก็บรักษาประวัติ คำศัพท์ Habit การเงิน ปลอดภัย 100%</p>
              </div>
            </div>
          </div>

          {/* Data Summary Chips */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 block">Habits</span>
              <span className="text-xs font-bold text-white">{habits.length} รายการ</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 block">การเงิน</span>
              <span className="text-xs font-bold text-emerald-400">{finance.length} รายการ</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 block">คำศัพท์จำได้</span>
              <span className="text-xs font-bold text-blue-400">{learnedCards.length} คำ</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 block">To-Do / โน้ต</span>
              <span className="text-xs font-bold text-purple-400">{todos.length + notes.length} รายการ</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดไฟล์สำรอง (.json)
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              นำเข้า / กู้คืน
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyJson}
              className="py-3 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              title="คัดลอก JSON"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </motion.button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />

          {/* Feedback alert */}
          <AnimatePresence>
            {backupStatus && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  backupStatus.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                {backupStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{backupStatus.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
