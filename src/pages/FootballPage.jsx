import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, X, Calendar, Trophy, Clock, Edit2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { fetchFootballSchedule } from '../services/geminiService';
import { SHORT_THAI_MONTHS } from '../constants/appConstants';
import { getLocalDateKey, isValidIsoDate } from '../utils/dateUtils';
import { useConfirmDelete } from '../hooks/useConfirmDelete';

const isMatchCompleted = (m, nowDate) => {
  if (m.status === 'completed') return true;
  if (!isValidIsoDate(m.date)) return false;
  return new Date(`${m.date}T23:59:59`) < nowDate;
};

export default function FootballPage() {
  const navigate = useNavigate();
  const rawMatches = useStore((state) => state.footballMatches);
  const matches = useMemo(() => rawMatches || [], [rawMatches]);
  const addMatch = useStore((state) => state.addFootballMatch);
  const editMatch = useStore((state) => state.editFootballMatch);
  const deleteMatch = useStore((state) => state.deleteFootballMatch);

  const { confirmDeleteId, requestDelete } = useConfirmDelete(deleteMatch);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // { type: 'error' | 'success', message: string }
  const statusTimerRef = useRef(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [opponent, setOpponent] = useState('');
  const [competition, setCompetition] = useState('');
  const [squad, setSquad] = useState('ชุดใหญ่');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('upcoming');

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showForm]);

  const showBanner = (nextStatus, ms = 4000) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setAiStatus(nextStatus);
    statusTimerRef.current = setTimeout(() => {
      setAiStatus(null);
      statusTimerRef.current = null;
    }, ms);
  };

  const now = new Date();

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const da = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const db = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
    });
  }, [matches]);

  const upcomingMatches = sortedMatches.filter((m) => !isMatchCompleted(m, now));
  const pastMatches = sortedMatches.filter((m) => isMatchCompleted(m, now)).reverse();

  const openAddForm = () => {
    setEditingId(null);
    setOpponent('');
    setCompetition('');
    setSquad('ชุดใหญ่');
    setResult('');
    setStatus('upcoming');
    setDate(getLocalDateKey());
    setTime('19:00');
    setShowForm(true);
  };

  const openEditForm = (m) => {
    setEditingId(m.id);
    setDate(m.date);
    setTime(m.time || '');
    setOpponent(m.opponent);
    setCompetition(m.competition);
    setSquad(m.squad);
    setResult(m.result || '');
    setStatus(m.status);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!opponent.trim() || !date) return;

    if (editingId) {
      editMatch(editingId, { date, time, opponent: opponent.trim(), competition: competition.trim(), squad, result: result.trim(), status });
    } else {
      addMatch(date, time, opponent, competition, squad);
    }
    setShowForm(false);
  };

  const handleAiUpdate = async () => {
    setIsAiLoading(true);
    setAiStatus(null);
    try {
      const schedule = await fetchFootballSchedule();
      if (!Array.isArray(schedule)) throw new Error('ข้อมูลที่ได้รับจาก AI ไม่ถูกต้อง');

      const seenKeys = new Set(
        matches.map(
          (m) => `${m.date}|${(m.opponent || '').trim().toLowerCase()}|${(m.squad || 'ชุดใหญ่').trim().toLowerCase()}`
        )
      );

      let addedCount = 0;
      schedule.forEach((newMatch) => {
        if (!newMatch || typeof newMatch !== 'object') return;
        const mDate = typeof newMatch.date === 'string' ? newMatch.date.trim() : '';
        const mOpponent = typeof newMatch.opponent === 'string' ? newMatch.opponent.trim() : '';
        const mSquad = typeof newMatch.squad === 'string' && newMatch.squad.trim() ? newMatch.squad.trim() : 'ชุดใหญ่';
        if (!isValidIsoDate(mDate) || !mOpponent) return;

        const key = `${mDate}|${mOpponent.toLowerCase()}|${mSquad.toLowerCase()}`;
        if (seenKeys.has(key)) return;

        seenKeys.add(key);
        addMatch(mDate, newMatch.time || '', mOpponent, newMatch.competition || '', mSquad);
        addedCount++;
      });

      if (addedCount === 0) {
        showBanner({ type: 'success', message: 'ตารางแข่งอัปเดตล่าสุดอยู่แล้ว หรือไม่พบข้อมูลใหม่ครับ' }, 3500);
      } else {
        showBanner({ type: 'success', message: `เพิ่มตารางแข่งใหม่ ${addedCount} นัด เรียบร้อยแล้ว!` }, 4000);
      }
    } catch (err) {
      showBanner({ type: 'error', message: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก AI' }, 4500);
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatThaiDate = (dateStr) => {
    if (!isValidIsoDate(dateStr)) return 'ไม่ระบุวันที่';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${SHORT_THAI_MONTHS[m - 1]} ${y + 543}`;
  };

  const renderMatchCard = (m, isPast) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={m.id}
      className={`relative glass rounded-2xl p-4 border ${isPast ? 'border-gray-500/20' : 'border-blue-500/30'} flex flex-col gap-3 overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 via-white/5 to-red-500/10 rounded-full blur-2xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2" />

      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              m.squad === 'ชุดใหญ่' ? 'bg-blue-500/20 text-blue-300' :
              m.squad === 'U23' ? 'bg-red-500/20 text-red-300' : 'bg-purple-500/20 text-purple-300'
            }`}>
              {m.squad}
            </span>
            <span className="text-xs text-gray-400 font-medium line-clamp-1">{m.competition || 'กระชับมิตร'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-xl font-black text-white dark-invert">🇹🇭 vs {m.opponent}</h3>
          </div>
        </div>

        {isPast && m.result && (
          <div className="px-3 py-1.5 glass-dark rounded-xl border border-white/10 flex items-center justify-center">
            <span className="font-black text-lg text-white dark-invert tracking-wider">{m.result}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatThaiDate(m.date)}</span>
          </div>
          {m.time && (
            <div className="flex items-center gap-1.5 text-blue-300/80">
              <Clock className="w-3.5 h-3.5" />
              <span>{m.time} น.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`แก้ไขคิวเตะ ${m.opponent}`}
            onClick={() => openEditForm(m)}
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label={`ลบคิวเตะ ${m.opponent}`}
            onClick={() => requestDelete(m.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              confirmDeleteId === m.id ? 'bg-red-500/25 text-red-400' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            {confirmDeleteId === m.id ? <span className="text-[10px] font-bold">ยืนยัน</span> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-full text-white dark-invert pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          aria-label="กลับหน้าหลัก"
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-2xl border border-white/10 text-white dark-invert hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-red-500 p-[1px]">
            <div className="w-full h-full bg-gray-900 rounded-[15px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white dark-invert">ทีมชาติไทย</h1>
            <p className="text-xs text-gray-400 font-medium -mt-0.5">Football Schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAiUpdate}
            disabled={isAiLoading}
            className="px-3 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-purple-500/30 text-purple-300 rounded-2xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 transition-all disabled:opacity-50"
          >
            {isAiLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="text-xs font-bold hidden sm:inline">{isAiLoading ? 'กำลังดึงข้อมูล...' : 'AI อัปเดต'}</span>
          </button>

          <button
            type="button"
            aria-label="เพิ่มตารางแข่งขัน"
            onClick={openAddForm}
            className="p-2 bg-blue-500 text-white rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {aiStatus && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              aiStatus.type === 'error'
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {aiStatus.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <p>{aiStatus.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-dark p-4 rounded-3xl border border-blue-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
          <span className="text-xs text-gray-400 font-bold mb-1">นัดต่อไป</span>
          <span className="text-2xl font-black text-blue-400">{upcomingMatches.length}</span>
        </div>
        <div className="glass-dark p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="text-xs text-gray-400 font-bold mb-1">แข่งแล้ว</span>
          <span className="text-2xl font-black text-white dark-invert">{pastMatches.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {upcomingMatches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-blue-400 flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> นัดต่อไป (Upcoming)
            </h2>
            <div className="flex flex-col gap-3">
              {upcomingMatches.map((m) => renderMatchCard(m, false))}
            </div>
          </div>
        )}

        {pastMatches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 px-1">
              <Check className="w-4 h-4" /> แข่งแล้ว (Past)
            </h2>
            <div className="flex flex-col gap-3 opacity-85">
              {pastMatches.map((m) => renderMatchCard(m, true))}
            </div>
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <Trophy className="w-12 h-12 text-gray-500 mb-4" />
            <p className="font-medium">ยังไม่มีตารางแข่งขัน</p>
            <p className="text-xs text-gray-500 mt-1">กด + มุมขวาบนเพื่อเพิ่มคิวเตะ</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="football-form-title"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 glass-dark rounded-t-[32px] border-t border-white/20 p-6 max-w-2xl mx-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 id="football-form-title" className="text-xl font-bold text-white dark-invert">
                  {editingId ? 'แก้ไขคิวเตะ' : 'เพิ่มคิวเตะใหม่'}
                </h3>
                <button
                  type="button"
                  aria-label="ปิดแบบฟอร์ม"
                  onClick={() => setShowForm(false)}
                  className="p-2 glass rounded-full text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="match-opponent" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">ทีมคู่แข่ง *</label>
                  <input
                    id="match-opponent"
                    type="text"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="เช่น เกาหลีใต้, ญี่ปุ่น, เวียดนาม"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="match-date" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">วันที่ *</label>
                    <input
                      id="match-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="match-time" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">เวลา</label>
                    <input
                      id="match-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="match-comp" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">รายการแข่งขัน</label>
                  <input
                    id="match-comp"
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    placeholder="เช่น ฟุตบอลโลก รอบคัดเลือก, อาเซียนคัพ"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">รุ่น / ทีม (Squad)</span>
                  <div className="flex flex-wrap gap-2">
                    {['ชุดใหญ่', 'U23', 'U20', 'U17', 'ฟุตซอล'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSquad(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                          squad === s
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {editingId && (
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">สถานะ</span>
                      <div className="flex gap-2">
                        {[
                          { id: 'upcoming', label: 'กำลังจะแข่ง' },
                          { id: 'completed', label: 'แข่งแล้ว' },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatus(st.id)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                              status === st.id ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="match-result" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">ผลการแข่งขัน (ถ้าแข่งจบแล้ว)</label>
                      <input
                        id="match-result"
                        type="text"
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        placeholder="เช่น 1-1, 2-0, ชนะจุดโทษ 5-4"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-bold tracking-wide"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!opponent.trim() || !date}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-2xl py-4 mt-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:shadow-none hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  บันทึก
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
