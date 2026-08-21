import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { ArrowLeft, Plus, Trash2, Pin, Smile, Meh, Frown, Flame, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOODS = [
  { key: 'happy', icon: Smile, label: 'ดี', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' },
  { key: 'neutral', icon: Meh, label: 'ปกติ', color: 'bg-gray-500/20 border-gray-500/30 text-gray-400' },
  { key: 'sad', icon: Frown, label: 'เศร้า', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
  { key: 'angry', icon: Flame, label: 'หงุดหงิด', color: 'bg-red-500/20 border-red-500/30 text-red-400' },
];

export default function NotesPage() {
  const navigate = useNavigate();
  const { notes, addNote, deleteNote, togglePinNote } = useStore();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('neutral');

  const sorted = [...(notes || [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addNote(content, mood);
    setContent('');
  };

  const getMoodConfig = (m) => MOODS.find(x => x.key === m) || MOODS[1];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white text-lg">โน้ต & ไดอารี่</h1>
        <div className="w-10" />
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="เขียนโน้ต, ความรู้สึกวันนี้..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none focus:border-amber-500/50 resize-none transition-colors" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {MOODS.map(({ key, icon: MoodIcon, color }) => (
              <button key={key} type="button" onClick={() => setMood(key)}
                className={`p-2 rounded-xl border transition-all ${mood === key ? color : 'border-white/5 bg-white/5 text-gray-500'}`}>
                <MoodIcon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl font-bold text-sm">
            <Plus className="w-4 h-4" /> บันทึก
          </motion.button>
        </div>
      </form>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {sorted.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
              <FileText className="w-12 h-12 text-amber-400/40 mx-auto mb-3" />
              <p className="text-sm">ยังไม่มีโน้ต เริ่มเขียนได้เลย</p>
            </motion.div>
          ) : sorted.map(note => {
            const moodCfg = getMoodConfig(note.mood);
            const MoodIcon = moodCfg.icon;

            return (
              <motion.div key={note.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                className={`glass-dark rounded-2xl border p-4 group relative ${note.isPinned ? 'border-amber-500/30' : 'border-white/10'}`}>
                {note.isPinned && <div className="absolute top-3 right-3 text-amber-400 opacity-60"><Pin className="w-3.5 h-3.5 fill-current" /></div>}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border shrink-0 ${moodCfg.color}`}>
                    <MoodIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    <p className="text-[10px] text-gray-500 mt-2">{new Date(note.date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => togglePinNote(note.id)}
                    className={`p-1.5 rounded-lg text-xs border transition-colors ${note.isPinned ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                    <Pin className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteNote(note.id)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
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
