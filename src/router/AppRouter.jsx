import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AppRouter() {
  const location = useLocation();

  return (
    <div className="relative z-10 w-full max-w-md h-full flex flex-col">
      {/* Page Content */}
      <div className="flex-1 overflow-y-auto pb-6 px-5 pt-10">
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
    </div>
  );
}
