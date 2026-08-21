import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Reorder, useDragControls } from 'framer-motion';
import useStore from '../store/useStore';
import {
  BookOpen,
  CheckSquare,
  Flame,
  Wallet,
  ChevronRight,
  Target,
  FileText,
  Rocket,
  Timer,
  Hourglass,
  Wind,
  HelpCircle,
  Code,
  Settings,
  GripVertical
} from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, to }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(to)}
      className="flex-1 min-w-[140px] glass-dark rounded-2xl p-4 border border-white/10 text-left relative overflow-hidden group"
    >
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-30 ${color}`} />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color} bg-opacity-20`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</div>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
    </motion.button>
  );
};

const FeatureCardItem = ({ id, title, desc, icon: Icon, color, to, badge }) => {
  const navigate = useNavigate();
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={id}
      id={id}
      dragListener={false} // Users must grab the handle to drag
      dragControls={dragControls}
      className="w-full glass-dark rounded-[1.5rem] p-5 border border-white/10 text-left relative overflow-hidden group mb-3 cursor-default shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`} />
      <div className="flex items-center justify-between relative z-10">
        
        {/* Left Side: Drag Handle & Info */}
        <div className="flex items-center gap-3 w-full">
          {/* Drag Handle */}
          <div 
            className="p-1 -ml-2 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white transition-colors"
            onPointerDown={(e) => {
              e.preventDefault(); // Prevent touch scrolling while dragging
              dragControls.start(e);
            }}
            style={{ touchAction: 'none' }} // Crucial for mobile dragging
          >
            <GripVertical className="w-5 h-5" />
          </div>

          <div 
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${color} bg-opacity-20 border border-white/10 text-white cursor-pointer`}
            onClick={() => navigate(to)}
          >
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(to)}>
            <div className="font-bold text-white text-base truncate">{title}</div>
            <div className="text-xs text-gray-400 mt-0.5 truncate">{desc}</div>
          </div>
        </div>

        {/* Right Side: Badge & Arrow */}
        <div className="flex items-center gap-2 pl-2 shrink-0 cursor-pointer" onClick={() => navigate(to)}>
          {badge !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color} bg-opacity-20 text-white border border-white/10`}>
              {badge}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
      </div>
    </Reorder.Item>
  );
};

export default function HomePage() {
  const storeData = useStore();
  const { todos, habits, finance, goals, learnedCards, vocabulary, notes, projects, countdowns, homeFeatureOrder, setHomeFeatureOrder } = storeData;
  const todayStr = new Date().toISOString().split('T')[0];

  const activeTodos = todos.filter(t => !t.completed).length;
  const habitsToday = habits.filter(h => (h.history || []).includes(todayStr)).length;
  const totalExpense = finance
    .filter(t => { const d = new Date(t.date); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear() && t.type === 'expense'; })
    .reduce((s, t) => s + t.amount, 0);
  const learnedPct = vocabulary.length > 0 ? Math.round((learnedCards.length / vocabulary.length) * 100) : 0;

  const FEATURES_CONFIG = {
    flashcard: { title: "Flashcards", getDesc: () => `${learnedCards.length} / ${vocabulary.length} คำ`, icon: BookOpen, color: "bg-blue-500", to: "/flashcard", getBadge: () => learnedCards.length },
    todo: { title: "To-Do List", getDesc: () => `${activeTodos} รายการที่ยังค้าง`, icon: CheckSquare, color: "bg-emerald-500", to: "/todo", getBadge: () => activeTodos },
    habit: { title: "Habit Tracker", getDesc: () => `${habits.length} นิสัย`, icon: Flame, color: "bg-orange-500", to: "/habit", getBadge: () => habitsToday },
    finance: { title: "Finance", desc: "รายรับ-รายจ่าย", icon: Wallet, color: "bg-pink-500", to: "/finance", getBadge: () => finance.length },
    goals: { title: "Savings Goals", getDesc: () => `${goals.length} เป้าหมาย`, icon: Target, color: "bg-violet-500", to: "/goals", getBadge: () => goals.length },
    notes: { title: "โน้ต & ไดอารี่", getDesc: () => `${notes.length} รายการ`, icon: FileText, color: "bg-amber-500", to: "/notes", getBadge: () => notes.length },
    projects: { title: "Projects", getDesc: () => `${projects.length} โปรเจกต์`, icon: Rocket, color: "bg-indigo-500", to: "/projects", getBadge: () => projects.length },
    pomodoro: { title: "Pomodoro", desc: "จับเวลาโฟกัส 25 นาที", icon: Timer, color: "bg-red-500", to: "/pomodoro" },
    countdown: { title: "Countdown", getDesc: () => `${countdowns.length} กำหนดการ`, icon: Hourglass, color: "bg-purple-500", to: "/countdown", getBadge: () => countdowns.length },
    breathing: { title: "ฝึกหายใจ Wim Hof", desc: "3 รอบ · 30 ครั้ง", icon: Wind, color: "bg-teal-500", to: "/breathing" },
    quiz: { title: "ทดสอบคำศัพท์ (Quiz)", desc: "ทดสอบความจำ 3 รูปแบบ", icon: HelpCircle, color: "bg-fuchsia-500", to: "/quiz" },
    code_reading: { title: "ฝึกอ่านโค้ด (Code Reading)", desc: "HTML, CSS, JS, SQL", icon: Code, color: "bg-cyan-500", to: "/code-reading" },
    settings: { title: "ตั้งค่า & สถิติ", desc: "ธีมแอป, งบประมาณ, Streak", icon: Settings, color: "bg-gray-500", to: "/settings" }
  };

  // Fallback missing features
  const safeFeatureOrder = homeFeatureOrder || [];
  const missingFeatures = Object.keys(FEATURES_CONFIG).filter(id => !safeFeatureOrder.includes(id));
  const finalFeatureOrder = [...safeFeatureOrder, ...missingFeatures];

  // Update store only if missing features were added
  const handleReorder = (newOrder) => {
    setHomeFeatureOrder(newOrder);
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-2">
            <img src="/logo.png" alt="MyFee Logo" className="w-4 h-4 object-contain rounded-sm" />
            <span className="text-[10px] font-bold text-blue-200 tracking-widest uppercase">My Fee</span>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            สวัสดี!
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="เรียนรู้แล้ว" value={`${learnedPct}%`} icon={BookOpen} color="bg-blue-500" to="/flashcard" />
        <StatCard label="งานที่ค้าง" value={activeTodos} icon={CheckSquare} color="bg-emerald-500" to="/todo" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Habit วันนี้" value={`${habitsToday}/${habits.length}`} icon={Flame} color="bg-orange-500" to="/habit" />
        <StatCard label="ค่าใช้จ่ายเดือนนี้" value={`฿${totalExpense.toLocaleString()}`} icon={Wallet} color="bg-pink-500" to="/finance" />
      </div>

      {/* Feature List (Draggable) */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            เมนูหลัก
          </h2>
          <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/10 flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> ลากเพื่อจัดเรียง
          </span>
        </div>
        
        <Reorder.Group 
          axis="y" 
          values={finalFeatureOrder} 
          onReorder={handleReorder} 
          className="flex flex-col list-none p-0 m-0"
        >
          {finalFeatureOrder.map((id) => {
            const config = FEATURES_CONFIG[id];
            if (!config) return null;
            return (
              <FeatureCardItem
                key={id}
                id={id}
                title={config.title}
                desc={config.getDesc ? config.getDesc() : config.desc}
                icon={config.icon}
                color={config.color}
                to={config.to}
                badge={config.getBadge ? config.getBadge() : undefined}
              />
            );
          })}
        </Reorder.Group>
      </div>
    </div>
  );
}
