import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Cloud, Key, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured, reinitSupabase } from '../lib/supabase';
import useStore from '../store/useStore';

export default function AuthModal({ isOpen, onClose }) {
  const { user, setUser, syncCloudData, initSync, resetLocalSessionData, isSyncing } = useStore();
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('supabase_custom_url') || '');
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('supabase_custom_key') || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const timerRef = useRef(null);

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const scheduleAction = (fn, delayMs) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fn();
    }, delayMs);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isConfigured || !supabase) {
      setTab('config');
      setErrorMsg('กรุณาตั้งค่า Supabase URL และ Anon Key ก่อนเข้าสู่ระบบ');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data?.user) {
          setUser(data.user);
          setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังซิงค์ข้อมูล...');
          await syncCloudData();
          scheduleAction(onClose, 1400);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data?.user) {
          setUser(data.user);
          setSuccessMsg('เข้าสู่ระบบสำเร็จ! กำลังโหลดข้อมูล...');
          await syncCloudData();
          scheduleAction(onClose, 1200);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMsg('กรุณากรอกข้อมูล Supabase ให้ครบถ้วน');
      return;
    }
    const success = reinitSupabase(customUrl, customKey);
    if (success) {
      setSuccessMsg('บันทึกการตั้งค่า Supabase สำเร็จ!');
      await initSync();
      scheduleAction(() => {
        setSuccessMsg('');
        setTab('login');
      }, 1000);
    } else {
      setErrorMsg('URL หรือ Key ไม่ถูกต้อง (URL ต้องขึ้นต้นด้วย https:// และ Key ยาวเกิน 15 ตัวอักษร)');
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (supabase) await supabase.auth.signOut();
      resetLocalSessionData();
      setSuccessMsg('ออกจากระบบและล้างข้อมูลเซสชันบนเครื่องเรียบร้อย');
      scheduleAction(onClose, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการออกจากระบบ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={onClose}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md glass-dark rounded-3xl border border-white/15 p-6 shadow-2xl overflow-hidden"
        >
          {/* Header Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            aria-label="ปิดหน้าต่างบัญชีผู้ใช้"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-lg font-black text-white">Supabase Cloud</h2>
              <p className="text-xs text-gray-400">ซิงค์ข้อมูล To-Do, นิสัย, การเงิน บนคลาวด์อย่างปลอดภัย</p>
            </div>
          </div>

          {/* Logged in state */}
          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">เข้าสู่ระบบแล้ว</p>
                  <p className="text-sm font-bold text-white truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    await syncCloudData();
                    setSuccessMsg('ซิงค์ข้อมูลสำเร็จ! ⚡');
                    scheduleAction(() => setSuccessMsg(''), 2000);
                  }}
                  disabled={isSyncing}
                  className="flex-1 py-3 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  ซิงค์ข้อมูลทันที
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSignOut}
                  disabled={loading}
                  className="py-3 px-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs transition-colors"
                >
                  ออกจากระบบ
                </motion.button>
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                การออกจากระบบจะล้างแคชข้อมูลส่วนตัวบนเครื่องนี้เพื่อความเป็นส่วนตัว
              </p>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === 'login' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setErrorMsg(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === 'signup' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  สมัครใหม่
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('config'); setErrorMsg(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === 'config' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  ตั้งค่า API Key
                </button>
              </div>

              {/* Status alerts */}
              {!isConfigured && tab !== 'config' && (
                <div className="mb-4 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs flex items-start gap-2.5">
                  <Key className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ยังไม่ได้เชื่อมต่อ Supabase Project:</span>{' '}
                    สามารถใส่ URL & Key ในแท็บ{' '}
                    <button type="button" onClick={() => setTab('config')} className="underline font-bold">
                      ตั้งค่า API Key
                    </button>{' '}
                    หรือไฟล์ <code className="font-mono bg-black/40 px-1 rounded">.env</code>
                  </div>
                </div>
              )}

              {/* Auth Form */}
              {tab === 'login' || tab === 'signup' ? (
                <form onSubmit={handleAuth} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="auth-email" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">อีเมล</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="auth-password" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">รหัสผ่าน</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        id="auth-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {tab === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้ใช้'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="supabase-url" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Supabase Project URL</label>
                    <input
                      id="supabase-url"
                      type="url"
                      required
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="supabase-key" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Supabase Anon Public Key</label>
                    <textarea
                      id="supabase-key"
                      rows={2}
                      required
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors font-mono resize-none"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    บันทึกการตั้งค่า Supabase
                  </motion.button>
                </form>
              )}
            </>
          )}

          {/* Feedback message */}
          {errorMsg && (
            <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
