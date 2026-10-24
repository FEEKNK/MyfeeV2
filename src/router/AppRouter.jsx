import React, { lazy, Suspense, useRef, useEffect, Component } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-loaded pages for optimized bundle splitting & faster startup
const HomePage = lazy(() => import('../pages/HomePage'));
const FlashcardPage = lazy(() => import('../pages/FlashcardPage'));
const TodoPage = lazy(() => import('../pages/TodoPage'));
const HabitPage = lazy(() => import('../pages/HabitPage'));
const FinancePage = lazy(() => import('../pages/FinancePage'));
const GoalsPage = lazy(() => import('../pages/GoalsPage'));
const NotesPage = lazy(() => import('../pages/NotesPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const CountdownPage = lazy(() => import('../pages/CountdownPage'));
const BreathingPage = lazy(() => import('../pages/BreathingPage'));
const QuizPage = lazy(() => import('../pages/QuizPage'));
const CodeReadingPage = lazy(() => import('../pages/CodeReadingPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const MorePage = lazy(() => import('../pages/MorePage'));
const PomodoroPage = lazy(() => import('../pages/PomodoroPage'));
const FootballPage = lazy(() => import('../pages/FootballPage'));
const SentenceLearningPage = lazy(() => import('../pages/SentenceLearningPage'));

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

const PageLoader = () => (
  <div 
    className="w-full h-64 flex flex-col items-center justify-center gap-3"
    role="status"
    aria-live="polite"
  >
    <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" aria-hidden="true" />
    <span className="text-xs text-gray-400 font-medium tracking-wider">กำลังโหลด...</span>
  </div>
);

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Page error handled safely by AppRouter:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-72 text-center p-6 glass-dark rounded-3xl border border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white mb-1">เกิดข้อผิดพลาดในการแสดงผล</h2>
          <p className="text-xs text-gray-400 mb-5">ไม่สามารถโหลดเนื้อหาของหน้านี้ได้</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
          >
            รีเฟรชเพื่อลองใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppRouter() {
  const location = useLocation();
  const scrollRef = useRef(null);

  // Reset scroll position on route change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div className="relative z-10 w-full max-w-md h-full flex flex-col overflow-x-hidden">
      {/* Scrollable Page Content Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-6 px-5 pt-10"
      >
        <PageErrorBoundary key={location.pathname}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="h-full"
            >
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/more" element={<MorePage />} />
                  <Route path="/flashcard" element={<FlashcardPage />} />
                  <Route path="/sentences" element={<SentenceLearningPage />} />
                  <Route path="/todo" element={<TodoPage />} />
                  <Route path="/habit" element={<HabitPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/countdown" element={<CountdownPage />} />
                  <Route path="/pomodoro" element={<PomodoroPage />} />
                  <Route path="/breathing" element={<BreathingPage />} />
                  <Route path="/quiz" element={<QuizPage />} />
                  <Route path="/code-reading" element={<CodeReadingPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/football" element={<FootballPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </PageErrorBoundary>
      </div>
    </div>
  );
}
