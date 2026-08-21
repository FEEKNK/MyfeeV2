import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Flame,
  Check,
  Sunrise,
  Sun,
  Moon,
  Zap,
  BookOpen,
  Activity,
  Brain,
  Droplets,
  Target,
  Music,
  PenTool,
  Dumbbell,
  Heart,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROUTINE_CONFIG = {
  morning: { label: 'ยามเช้า', icon: Sunrise, color: 'text-amber-400' },
  afternoon: { label: 'ระหว่างวัน', icon: Sun, color: 'text-orange-400' },
  evening: { label: 'ก่อนนอน', icon: Moon, color: 'text-indigo-400' },
};

const ICON_MAP = {
  zap: Zap,
  book: BookOpen,
  activity: Activity,
  brain: Brain,
  droplet: Droplets,
  target: Target,
  music: Music,
  pen: PenTool,
  dumbbell: Dumbbell,
  heart: Heart,
  sun: Sun,
  coffee: Coffee,
  sparkles: Sparkles,
  // Backwards compatibility fallbacks
  '⚡': Zap,
  '📚': BookOpen,
  '🏃': Activity,
  '🧠': Brain,
  '💧': Droplets,
  '🎯': Target,
  '🎸': Music,
  '✍️': PenTool,
  '🧘': Heart,
  '😴': Moon,
  '🍎': Heart,
  '💪': Dumbbell,
};

const AVAILABLE_ICONS = [
  { key: 'zap', icon: Zap },
  { key: 'book', icon: BookOpen },
  { key: 'activity', icon: Activity },
  { key: 'brain', icon: Brain },
  { key: 'droplet', icon: Droplets },
  { key: 'target', icon: Target },
  { key: 'music', icon: Music },
  { key: 'pen', icon: PenTool },
  { key: 'dumbbell', icon: Dumbbell },
  { key: 'heart', icon: Heart },
  { key: 'coffee', icon: Coffee },
  { key: 'sparkles', icon: Sparkles },
];

const RenderHabitIcon = ({ iconKey, className = "w-4 h-4" }) => {
  const IconComp = ICON_MAP[iconKey] || Zap;
  return <IconComp className={className} />;
};

const Heatmap = ({ history }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  return (
    <div className="flex gap-1 mt-2">
      {days.map(day => (
        <div
          key={day}
          title={day}
          className={`w-3 h-3 rounded-sm ${(history || []).includes(day) ? 'bg-orange-400' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
};

export default function HabitPage() {
  const navigate = useNavigate();
  const { habits, addHabit, toggleHabit, deleteHabit } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [routine, setRoutine] = useState('morning');
  const [icon, setIcon] = useState('zap');
  const todayStr = new Date().toISOString().split('T')[0];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit(name, routine, icon);
    setName('');
    setShowForm(false);
  };

  const grouped = { morning: [], afternoon: [], evening: [] };
  habits.forEach(h => {
    (grouped[h.routine] || grouped.morning).push(h);
  });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="font-black text-white text-lg">Habit Tracker</h1>
          <p className="text-xs text-gray-400">
            {habits.filter(h => (h.history || []).includes(todayStr)).length} / {habits.length} วันนี้
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(!showForm)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showForm
              ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
              : 'glass border-white/10 text-white'
          }`}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleAdd}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3"
          >
            {/* Icon Picker */}
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_ICONS.map(({ key, icon: IconComp }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`p-2 rounded-xl border transition-all ${
                    icon === key
                      ? 'bg-orange-500/30 border-orange-400 text-orange-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              ))}
            </div>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ชื่อนิสัยใหม่ (เช่น อ่านหนังสือ 15 นาที)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-orange-500/50"
            />

            {/* Routine Picker */}
            <div className="flex gap-2">
              {Object.entries(ROUTINE_CONFIG).map(([val, cfg]) => {
                const RoutineIcon = cfg.icon;
                const isSelected = routine === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRoutine(val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                        : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                  >
                    <RoutineIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="py-2.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl font-bold text-sm"
            >
              + เพิ่มนิสัย
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Habit Groups */}
      <div className="flex-1 overflow-y-auto space-y-5">
        {Object.entries(grouped).map(([key, list]) => {
          if (list.length === 0) return null;
          const cfg = ROUTINE_CONFIG[key] || ROUTINE_CONFIG.morning;
          const RoutineIcon = cfg.icon;

          return (
            <div key={key}>
              <div className="flex items-center gap-1.5 mb-2">
                <RoutineIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {cfg.label}
                </p>
              </div>

              <div className="space-y-2">
                {list.map(habit => {
                  const isDone = (habit.history || []).includes(todayStr);
                  return (
                    <motion.div
                      key={habit.id}
                      layout
                      className={`flex items-start gap-3 p-4 glass-dark rounded-2xl border transition-colors ${
                        isDone ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/10'
                      }`}
                    >
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm transition-all ${
                          isDone
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <RenderHabitIcon iconKey={habit.icon} className="w-5 h-5" />
                        )}
                      </motion.button>

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className={`font-bold text-sm ${isDone ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {habit.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400">
                              <Flame className="w-3 h-3" />
                              {habit.streak}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => deleteHabit(habit.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </div>
                        <Heatmap history={habit.history} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Flame className="w-12 h-12 text-orange-400/40 mx-auto mb-3" />
            <p className="text-sm">กดปุ่ม + เพื่อเพิ่มนิสัยแรก</p>
          </div>
        )}
      </div>
    </div>
  );
}
