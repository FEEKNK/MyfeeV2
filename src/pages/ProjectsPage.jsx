import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Circle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Rocket,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  in_progress: { label: 'กำลังทำ', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
  future: { label: 'แผนอนาคต', color: 'bg-gray-500/20 border-gray-500/30 text-gray-400' },
  completed: { label: 'เสร็จแล้ว', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
};

const CATEGORIES = ['ทั่วไป', 'งาน', 'เรียน', 'ส่วนตัว', 'ไอที', 'ธุรกิจ', 'IT/Tech'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, addProject, deleteProject, changeProjectStatus, addSubtask, toggleSubtask } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ทั่วไป');
  const [targetDate, setTargetDate] = useState('');
  const [expanded, setExpanded] = useState({});
  const [subInputs, setSubInputs] = useState({});
  const [filter, setFilter] = useState('all');

  const filteredProjects = (projects || []).filter(p => filter === 'all' || p.status === filter);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProject(name, category, targetDate);
    setName('');
    setTargetDate('');
    setShowForm(false);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white text-lg">Projects</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(!showForm)}
          className={`p-2.5 rounded-xl border transition-colors ${showForm ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'glass border-white/10 text-white'}`}>
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleAdd} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อโปรเจกต์"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-indigo-500/50" />
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${category === c ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                  {c}
                </button>
              ))}
            </div>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-400 text-sm outline-none" />
            <motion.button whileTap={{ scale: 0.95 }} type="submit"
              className="py-2.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold text-sm">
              + เพิ่มโปรเจกต์
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'in_progress', 'future', 'completed'].map(f => {
          const isSelected = filter === f;
          const label = f === 'all' ? 'ทั้งหมด' : STATUS_CONFIG[f].label;
          const cfgColor = f === 'all' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : STATUS_CONFIG[f].color;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap flex-1 ${
                isSelected ? cfgColor : 'bg-white/5 border-white/10 text-gray-400'
              }`}>
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {filteredProjects.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
              <Rocket className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
              <p className="text-sm">ไม่พบโปรเจกต์</p>
            </motion.div>
          ) : filteredProjects.map(proj => {
            const cfg = STATUS_CONFIG[proj.status] || STATUS_CONFIG.in_progress;
            const subtasksDone = (proj.subtasks || []).filter(s => s.completed).length;
            const isExpanded = expanded[proj.id];
            return (
              <motion.div key={proj.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
                {/* Project Header */}
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{proj.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 items-center">
                      <span className="text-[10px] text-gray-500">{proj.category}</span>
                      {proj.targetDate && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {proj.targetDate}
                        </span>
                      )}
                      {(proj.subtasks || []).length > 0 && (
                        <span className="text-[10px] text-gray-500">{subtasksDone}/{(proj.subtasks || []).length} งานย่อย</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Status cycle */}
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => {
                      const statuses = ['in_progress', 'future', 'completed'];
                      const idx = statuses.indexOf(proj.status);
                      changeProjectStatus(proj.id, statuses[(idx + 1) % statuses.length]);
                    }} className={`text-[10px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${cfg.color}`} title="เปลี่ยนสถานะ">
                      <RotateCcw className="w-3 h-3" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleExpand(proj.id)}
                      className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteProject(proj.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
                {/* Subtasks */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/10 p-4 space-y-2">
                      {(proj.subtasks || []).map(st => (
                        <motion.div key={st.id} layout className="flex items-center gap-2">
                          <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleSubtask(proj.id, st.id)}>
                            {st.completed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-gray-500" />}
                          </motion.button>
                          <span className={`text-sm flex-1 ${st.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{st.text}</span>
                        </motion.div>
                      ))}
                      <form className="flex gap-2 mt-2" onSubmit={e => {
                        e.preventDefault();
                        const v = subInputs[proj.id] || '';
                        if (v.trim()) { addSubtask(proj.id, v); setSubInputs(p => ({ ...p, [proj.id]: '' })); }
                      }}>
                        <input value={subInputs[proj.id] || ''} onChange={e => setSubInputs(p => ({ ...p, [proj.id]: e.target.value }))}
                          placeholder="+ เพิ่มงานย่อย"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs placeholder-gray-500 outline-none" />
                        <button type="submit" className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold">+</button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
