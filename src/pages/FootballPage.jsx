import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check, X, Calendar, Trophy, Clock, Edit2, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { fetchFootballSchedule } from '../services/geminiService';

export default function FootballPage() {
  const navigate = useNavigate();
  const rawMatches = useStore(state => state.footballMatches);
  const matches = useMemo(() => rawMatches || [], [rawMatches]);
  const addMatch = useStore(state => state.addFootballMatch);
  const editMatch = useStore(state => state.editFootballMatch);
  const deleteMatch = useStore(state => state.deleteFootballMatch);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [opponent, setOpponent] = useState('');
  const [competition, setCompetition] = useState('');
  const [squad, setSquad] = useState('ชุดใหญ่'); // ชุดใหญ่, U23, U20, U17
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('upcoming');

  const now = new Date();
  
  // Sort and group matches
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
  }, [matches]);

  const upcomingMatches = sortedMatches.filter(m => {
    const matchDate = new Date(`${m.date}T23:59:59`);
    return matchDate >= now || m.status === 'upcoming';
  });

  const pastMatches = sortedMatches.filter(m => {
    const matchDate = new Date(`${m.date}T23:59:59`);
    return matchDate < now || m.status === 'completed';
  }).reverse(); // Most recent past matches first

  const openAddForm = () => {
    setEditingId(null);
    setOpponent('');
    setCompetition('');
    setSquad('ชุดใหญ่');
    setResult('');
    setStatus('upcoming');
    const today = new Date();
    setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
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
      editMatch(editingId, { date, time, opponent, competition, squad, result, status });
    } else {
      addMatch(date, time, opponent, competition, squad);
    }
    setShowForm(false);
  };

  const handleAiUpdate = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const schedule = await fetchFootballSchedule();
      if (!Array.isArray(schedule)) throw new Error('ข้อมูลที่ได้รับจาก AI ไม่ถูกต้อง');

      let addedCount = 0;
      schedule.forEach(newMatch => {
        // Check for duplicates (same date + opponent + squad)
        const isDuplicate = matches.some(m => 
          m.date === newMatch.date && 
          m.opponent.toLowerCase() === newMatch.opponent.toLowerCase() &&
          (m.squad || 'ชุดใหญ่').toLowerCase() === (newMatch.squad || 'ชุดใหญ่').toLowerCase()
        );

        if (!isDuplicate) {
          addMatch(newMatch.date, newMatch.time || '', newMatch.opponent, newMatch.competition || '', newMatch.squad || 'ชุดใหญ่');
          addedCount++;
        }
      });
      
      if (addedCount === 0) {
        alert('ตารางแข่งอัปเดตล่าสุดอยู่แล้ว หรือไม่พบข้อมูลใหม่ครับ');
      } else {
        alert(`เพิ่มตารางแข่งใหม่ ${addedCount} นัด เรียบร้อยแล้ว!`);
      }
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก AI');
      setTimeout(() => setAiError(null), 3000);
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatThaiDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const renderMatchCard = (m, isPast) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      key={m.id}
      className={`relative glass rounded-2xl p-4 border ${isPast ? 'border-gray-500/20' : 'border-blue-500/30'} flex flex-col gap-3 overflow-hidden`}
    >
      {/* Background Flag Accent */}
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
            <h3 className="text-xl font-black text-white">🇹🇭 vs {m.opponent}</h3>
          </div>
        </div>
        
        {isPast && m.result && (
          <div className="px-3 py-1.5 glass-dark rounded-xl border border-white/10 flex items-center justify-center">
            <span className="font-black text-lg text-white tracking-wider">{m.result}</span>
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
          <button onClick={() => openEditForm(m)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => deleteMatch(m.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <button onClick={() => navigate('/')} className="p-2 glass rounded-2xl text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-red-500 p-[1px]">
            <div className="w-full h-full bg-black rounded-[15px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400">ทีมชาติไทย</h1>
            <p className="text-xs text-gray-400 font-medium -mt-1">Football Schedule</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAiUpdate} 
            disabled={isAiLoading}
            className="px-3 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-purple-500/30 text-purple-300 rounded-2xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 transition-all disabled:opacity-50"
          >
            {isAiLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Sparkles className="w-5 h-5" />
              </motion.div>
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span className="text-xs font-bold hidden sm:inline">{isAiLoading ? 'กำลังดึงข้อมูล...' : 'AI อัปเดต'}</span>
          </button>
          
          <button onClick={openAddForm} className="p-2 bg-blue-500 text-white rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)] active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {aiError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{aiError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="glass p-4 rounded-3xl border border-blue-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
          <span className="text-xs text-gray-400 font-bold mb-1">นัดต่อไป</span>
          <span className="text-2xl font-black text-blue-400">{upcomingMatches.length}</span>
        </div>
        <div className="glass p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="text-xs text-gray-400 font-bold mb-1">แข่งแล้ว</span>
          <span className="text-2xl font-black text-white">{pastMatches.length}</span>
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
              {upcomingMatches.map(m => renderMatchCard(m, false))}
            </div>
          </div>
        )}

        {pastMatches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 px-1">
              <Check className="w-4 h-4" /> แข่งแล้ว (Past)
            </h2>
            <div className="flex flex-col gap-3 opacity-80">
              {pastMatches.map(m => renderMatchCard(m, true))}
            </div>
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <Trophy className="w-12 h-12 text-gray-600 mb-4" />
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
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 glass-dark rounded-t-[32px] border-t border-white/20 p-6 max-w-2xl mx-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingId ? 'แก้ไขคิวเตะ' : 'เพิ่มคิวเตะใหม่'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 glass rounded-full text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">ทีมคู่แข่ง *</label>
                  <input
                    type="text"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="เช่น เกาหลีใต้, ญี่ปุ่น, เวียดนาม"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">วันที่ *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">เวลา</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">รายการแข่งขัน</label>
                  <input
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    placeholder="เช่น ฟุตบอลโลก รอบคัดเลือก, อาเซียนคัพ"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">รุ่น / ทีม (Squad)</label>
                  <div className="flex flex-wrap gap-2">
                    {['ชุดใหญ่', 'U23', 'U20', 'U17', 'ฟุตซอล'].map(s => (
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
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">ผลการแข่งขัน (ถ้าแข่งจบแล้ว)</label>
                    <input
                      type="text"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      placeholder="เช่น 1-1, 2-0, ชนะจุดโทษ 5-4"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 font-bold tracking-wide"
                    />
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
