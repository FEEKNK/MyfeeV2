import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  HelpCircle,
  Code,
  Target,
  FileText,
  Clock,
  Briefcase,
  Calendar,
  Wind,
  Settings,
  ChevronRight,
  MessageSquareQuote,
  Trophy,
} from 'lucide-react';

const CATEGORIES = [
  {
    title: 'การเรียนรู้และพัฒนาตนเอง',
    items: [
      { title: 'ฝึกพูดจากประโยค (Sentence Flow)', desc: 'จีน & อังกฤษ แบบ Chunking ไม่ต้องคิดแปล', icon: MessageSquareQuote, color: 'from-rose-500 to-pink-600', to: '/sentences' },
      { title: 'Flashcards', desc: 'คำศัพท์ Oxford 3000', icon: BookOpen, color: 'from-blue-500 to-indigo-600', to: '/flashcard' },
      { title: 'ทดสอบคำศัพท์ (Quiz)', desc: 'ฝึกจำ ฟัง และสะกดคำ', icon: HelpCircle, color: 'from-fuchsia-500 to-pink-600', to: '/quiz' },
      { title: 'ฝึกอ่านโค้ด (Code Reading)', desc: 'HTML, CSS, JS, SQL', icon: Code, color: 'from-cyan-500 to-blue-600', to: '/code-reading' },
    ],
  },
  {
    title: 'การจัดการ & การทำงาน',
    items: [
      { title: 'เป้าหมายการออม (Goals)', desc: 'วางแผนเก็บเงินสร้างฝัน', icon: Target, color: 'from-violet-500 to-purple-600', to: '/goals' },
      { title: 'โปรเจกต์ (Projects)', desc: 'ติดตามงานและเป้าหมายระยะยาว', icon: Briefcase, color: 'from-indigo-500 to-violet-600', to: '/projects' },
      { title: 'Pomodoro Timer', desc: 'จับเวลาโฟกัสและพักสมอง', icon: Clock, color: 'from-red-500 to-rose-600', to: '/pomodoro' },
      { title: 'โน้ต & ไดอารี่ (Notes)', desc: 'บันทึกเรื่องราวและความรู้สึก', icon: FileText, color: 'from-amber-500 to-orange-600', to: '/notes' },
      { title: 'นับถอยหลัง (Countdown)', desc: 'นับถอยหลังวันสำคัญ', icon: Calendar, color: 'from-purple-500 to-indigo-600', to: '/countdown' },
      { title: 'ทีมชาติไทย (Football)', desc: 'ตารางแข่งขันและอัปเดตด้วย AI', icon: Trophy, color: 'from-blue-600 to-red-500', to: '/football' },
    ],
  },
  {
    title: 'สุขภาพ & การตั้งค่า',
    items: [
      { title: 'ฝึกหายใจ (Breathing)', desc: 'Wim Hof Method เติมพลัง', icon: Wind, color: 'from-teal-500 to-emerald-600', to: '/breathing' },
      { title: 'ตั้งค่า & ข้อมูล (Settings)', desc: 'สำรองข้อมูล, คลาวด์, ธีม, สถิติ, งบประมาณ', icon: Settings, color: 'from-gray-500 to-slate-600', to: '/settings' },
    ],
  },
];

export default function MorePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-2">
            <img src="/logo.png" alt="MyFee Logo" className="w-4 h-4 object-contain rounded-sm" />
            <span className="text-[10px] font-bold text-blue-200 tracking-widest uppercase">All Features</span>
          </div>
          <h1 className="text-2xl font-black text-white">เมนูเพิ่มเติม</h1>
          <p className="text-xs text-gray-400 mt-0.5">รวมเครื่องมือและฟีเจอร์ทั้งหมดใน MyFee</p>
        </div>
      </div>

      <div className="space-y-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.title} className="space-y-2.5">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
              {cat.title}
            </h2>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.to}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.to)}
                    className="w-full glass-dark rounded-2xl p-3.5 border border-white/10 text-left flex items-center justify-between group hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
