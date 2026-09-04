import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Hourglass,
  Wind,
  HelpCircle,
  Code,
  Settings,
  LayoutGrid
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

const GridFeatureCard = ({ title, desc, icon: Icon, color, to, badge }) => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.93 }}
      onClick={() => navigate(to)}
      className="flex flex-col items-center justify-between p-3 glass-dark rounded-2xl border border-white/10 text-center relative overflow-hidden group shadow-sm min-h-[108px] transition-all hover:border-white/20"
    >
      {/* Background glow */}
      <div className={`absolute -bottom-5 -right-5 w-14 h-14 rounded-full blur-xl opacity-20 ${color}`} />

      {/* Badge in top right */}
      {badge !== undefined && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 leading-none">
          {badge}
        </span>
      )}

      {/* Icon container */}
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color} bg-opacity-20 text-white border border-white/10 group-hover:scale-110 transition-transform duration-200 mt-1 shadow-sm`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Title & Desc */}
      <div className="w-full mt-1.5">
        <div className="font-bold text-white text-xs leading-tight truncate">{title}</div>
        {desc && (
          <div className="text-[10px] text-gray-400 mt-0.5 truncate leading-tight">{desc}</div>
        )}
      </div>
    </motion.button>
  );
};

export default function HomePage() {
  const storeData = useStore();
  const { todos, habits, finance, goals, learnedCards, vocabulary, notes, projects, countdowns } = storeData;
  const todayStr = new Date().toISOString().split('T')[0];

  const activeTodos = todos.filter(t => !t.completed).length;
  const habitsToday = habits.filter(h => (h.history || []).includes(todayStr)).length;
  const totalExpense = finance
    .filter(t => { const d = new Date(t.date); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear() && t.type === 'expense'; })
    .reduce((s, t) => s + t.amount, 0);
  const learnedPct = vocabulary.length > 0 ? Math.round((learnedCards.length / vocabulary.length) * 100) : 0;

  const FEATURES = [
    { id: 'flashcard', title: "Flashcards", getDesc: () => `${learnedCards.length}/${vocabulary.length} คำ`, icon: BookOpen, color: "bg-blue-500", to: "/flashcard", getBadge: () => learnedCards.length },
    { id: 'todo', title: "To-Do List", getDesc: () => `${activeTodos} งานค้าง`, icon: CheckSquare, color: "bg-emerald-500", to: "/todo", getBadge: () => activeTodos },
    { id: 'habit', title: "Habit Tracker", getDesc: () => `${habitsToday}/${habits.length} วันนี้`, icon: Flame, color: "bg-orange-500", to: "/habit", getBadge: () => habitsToday },
    { id: 'finance', title: "การเงิน", desc: "รายรับ-รายจ่าย", icon: Wallet, color: "bg-pink-500", to: "/finance", getBadge: () => finance.length },
    { id: 'goals', title: "เป้าหมายออม", getDesc: () => `${goals.length} เป้าหมาย`, icon: Target, color: "bg-violet-500", to: "/goals", getBadge: () => goals.length },
    { id: 'notes', title: "โน้ต & ไดอารี่", getDesc: () => `${notes.length} รายการ`, icon: FileText, color: "bg-amber-500", to: "/notes", getBadge: () => notes.length },
    { id: 'projects', title: "Projects", getDesc: () => `${projects.length} โปรเจกต์`, icon: Rocket, color: "bg-indigo-500", to: "/projects", getBadge: () => projects.length },
    { id: 'countdown', title: "Countdown", getDesc: () => `${countdowns.length} กำหนดการ`, icon: Hourglass, color: "bg-purple-500", to: "/countdown", getBadge: () => countdowns.length },
    { id: 'breathing', title: "ฝึกหายใจ", desc: "Wim Hof 3 รอบ", icon: Wind, color: "bg-teal-500", to: "/breathing" },
    { id: 'quiz', title: "ทดสอบศัพท์", desc: "Quiz 3 รูปแบบ", icon: HelpCircle, color: "bg-fuchsia-500", to: "/quiz" },
    { id: 'code_reading', title: "ฝึกอ่านโค้ด", desc: "HTML, JS, SQL", icon: Code, color: "bg-cyan-500", to: "/code-reading" },
    { id: 'settings', title: "ตั้งค่า & สถิติ", desc: "ธีม, PIN, งบ", icon: Settings, color: "bg-gray-500", to: "/settings" }
  ];

  return (
    <div className="flex flex-col gap-5 pb-6">
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

      {/* 3-Column Grid Feature Menu */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <span>เมนูหลัก</span>
          </h2>
          <span className="text-[10px] text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            12 ฟังก์ชัน
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {FEATURES.map((item) => (
            <GridFeatureCard
              key={item.id}
              title={item.title}
              desc={item.getDesc ? item.getDesc() : item.desc}
              icon={item.icon}
              color={item.color}
              to={item.to}
              badge={item.getBadge ? item.getBadge() : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
