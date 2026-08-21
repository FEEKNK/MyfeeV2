import React from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LayoutList, Flame, Wallet, MoreHorizontal } from 'lucide-react';

import HomePage from '../pages/HomePage';
import FlashcardPage from '../pages/FlashcardPage';
import TodoPage from '../pages/TodoPage';
import HabitPage from '../pages/HabitPage';
import FinancePage from '../pages/FinancePage';
import GoalsPage from '../pages/GoalsPage';
import NotesPage from '../pages/NotesPage';
import PomodoroPage from '../pages/PomodoroPage';
import ProjectsPage from '../pages/ProjectsPage';
import CountdownPage from '../pages/CountdownPage';
import BreathingPage from '../pages/BreathingPage';
import QuizPage from '../pages/QuizPage';
import CodeReadingPage from '../pages/CodeReadingPage';
import SettingsPage from '../pages/SettingsPage';
import MorePage from '../pages/MorePage';

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -24 },
};

const NAV_ITEMS = [
  { icon: Home, to: '/', label: 'หน้าหลัก' },
  { icon: LayoutList, to: '/todo', label: 'งาน' },
  { icon: Flame, to: '/habit', label: 'นิสัย' },
  { icon: Wallet, to: '/finance', label: 'การเงิน' },
  { icon: MoreHorizontal, to: '/more', label: 'เพิ่มเติม' },
];

const MORE_PAGES = ['/more', '/goals', '/notes', '/pomodoro', '/projects', '/countdown', '/breathing', '/flashcard', '/quiz', '/code-reading', '/settings'];

export default function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeNav = NAV_ITEMS.find(n => {
    if (n.to === '/') return location.pathname === '/';
    if (n.to === '/more') return MORE_PAGES.some(p => location.pathname.startsWith(p));
    return location.pathname.startsWith(n.to);
  });

  return (
    <div className="relative z-10 w-full max-w-md h-full flex flex-col">
      {/* Page Content */}
      <div className="flex-1 overflow-y-auto pb-28 px-5 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/flashcard" element={<FlashcardPage />} />
              <Route path="/todo" element={<TodoPage />} />
              <Route path="/habit" element={<HabitPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/countdown" element={<CountdownPage />} />
              <Route path="/breathing" element={<BreathingPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/code-reading" element={<CodeReadingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Glass Bottom Nav */}
      <div className="absolute bottom-6 left-5 right-5 h-16 glass rounded-full flex justify-around items-center px-4 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {NAV_ITEMS.map(({ icon: Icon, to, label }) => {
          const isActive = activeNav?.to === to;
          return (
            <motion.button
              key={to}
              whileTap={{ scale: 0.75 }}
              onClick={() => navigate(to)}
              title={label}
              className="flex flex-col items-center gap-1 relative"
            >
              <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'text-gray-500'}`} />
              {isActive && (
                <motion.div layoutId="nav-dot" className="w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
