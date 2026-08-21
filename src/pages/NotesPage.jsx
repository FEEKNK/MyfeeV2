import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { ArrowLeft, Plus, Trash2, Pin, Smile, Meh, Frown, Flame, FileText, X, Check, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOODS = [
  { key: 'happy', icon: Smile, label: 'ดี', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' },
  { key: 'neutral', icon: Meh, label: 'ปกติ', color: 'bg-gray-500/20 border-gray-500/30 text-gray-400' },
  { key: 'sad', icon: Frown, label: 'เศร้า', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
  { key: 'angry', icon: Flame, label: 'หงุดหงิด', color: 'bg-red-500/20 border-red-500/30 text-red-400' },
];

export default function NotesPage() {
  const navigate = useNavigate();
  const { notes, addNote, deleteNote, togglePinNote, editNote } = useStore();
  
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('neutral');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Viewing / Editing Modal state
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState('neutral');

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteNote(id);
      setConfirmDeleteId(null);
      if (selectedNote?.id === id) setSelectedNote(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

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

  const openNote = (note) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditContent(selectedNote.content);
    setEditMood(selectedNote.mood || 'neutral');
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editContent.trim()) return;
    editNote(selectedNote.id, editContent, editMood);
    setSelectedNote({ ...selectedNote, content: editContent, mood: editMood });
    setIsEditing(false);
  };

  const getMoodConfig = (m) => MOODS.find(x => x.key === m) || MOODS[1];

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white dark-invert text-lg">โน้ต & ไดอารี่</h1>
        <div className="w-10" />
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="เขียนโน้ต, ความรู้สึกวันนี้..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white dark-invert text-sm placeholder-gray-500 outline-none focus:border-amber-500/50 resize-none transition-colors" />
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
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
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
              <motion.div key={note.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => openNote(note)}
                className={`glass-dark rounded-2xl border p-4 group relative cursor-pointer hover:border-amber-500/50 transition-colors ${note.isPinned ? 'border-amber-500/30' : 'border-white/10'}`}>
                {note.isPinned && <div className="absolute top-3 right-3 text-amber-400 opacity-60"><Pin className="w-3.5 h-3.5 fill-current" /></div>}
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border shrink-0 ${moodCfg.color}`}>
                    <MoodIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm text-gray-200 dark-invert leading-relaxed whitespace-pre-wrap line-clamp-3">{note.content}</p>
                    <p className="text-[10px] text-gray-500 mt-2">{new Date(note.date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); togglePinNote(note.id); }}
                    className={`p-1.5 transition-colors ${note.isPinned ? 'text-blue-400 bg-blue-500/20 rounded-lg' : 'text-gray-500 hover:text-blue-400 bg-white/5 rounded-lg'}`}>
                    <Pin className="w-4 h-4" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => handleDelete(e, note.id)}
                    className={`p-1.5 transition-all ${confirmDeleteId === note.id ? 'text-red-400 bg-red-500/20 rounded-lg' : 'text-gray-500 hover:text-red-400 bg-white/5 rounded-lg'}`}>
                    {confirmDeleteId === note.id ? <span className="text-[10px] font-bold">ยืนยัน</span> : <Trash2 className="w-4 h-4" />}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* View / Edit Modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setSelectedNote(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <div className="flex gap-1.5">
                      {MOODS.map(({ key, icon: MoodIcon, color }) => (
                        <button key={key} type="button" onClick={() => setEditMood(key)}
                          className={`p-1.5 rounded-lg border transition-all ${editMood === key ? color : 'border-white/5 bg-white/5 text-gray-500'}`}>
                          <MoodIcon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className={`p-2 rounded-xl border ${getMoodConfig(selectedNote.mood).color}`}>
                        {React.createElement(getMoodConfig(selectedNote.mood).icon, { className: "w-5 h-5" })}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">บันทึกเมื่อ</div>
                        <div className="text-xs text-gray-500">{new Date(selectedNote.date).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={startEdit} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20">
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedNote(null)} className="p-2 bg-white/10 text-gray-400 rounded-full hover:text-white hover:bg-white/20">
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    autoFocus
                    className="w-full h-full min-h-[200px] bg-transparent text-white text-base leading-relaxed resize-none outline-none"
                    placeholder="เขียนบันทึกของคุณ..."
                  />
                ) : (
                  <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
                    {selectedNote.content}
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              {isEditing && (
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors">
                    ยกเลิก
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={saveEdit}
                    className="flex-[2] py-3 rounded-xl bg-amber-500 text-amber-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                    <Check className="w-5 h-5" /> บันทึกการแก้ไข
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
