import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, AlertCircle, Lightbulb, HelpCircle, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { codeReadingLevels, sqlReadingLevels } from '../data/codeReadingData';

export default function CodeReadingPage() {
  const navigate = useNavigate();
  const { codeReadingProgress, saveCodeReadingProgress } = useStore();
  const [isFlipped, setIsFlipped] = useState(false);

  const { mode = 'code', levelIndex = 0, questionIndex = 0 } = codeReadingProgress || {};
  const data = mode === 'code' ? codeReadingLevels : sqlReadingLevels;

  const safeLevelIndex = Math.max(0, Math.min(levelIndex, data.length - 1));
  const currentLevel = data[safeLevelIndex] || { title: '', questions: [] };
  const safeQuestionIndex = Math.max(0, Math.min(questionIndex, Math.max(0, currentLevel.questions.length - 1)));
  const currentQuestion = currentLevel.questions[safeQuestionIndex];

  if (!currentQuestion) return null;

  const handleModeChange = (newMode) => {
    saveCodeReadingProgress({ mode: newMode, levelIndex: 0, questionIndex: 0 });
    setIsFlipped(false);
  };

  const handleLevelChange = (lvlIdx) => {
    saveCodeReadingProgress({ levelIndex: lvlIdx, questionIndex: 0 });
    setIsFlipped(false);
  };

  const nextQuestion = () => {
    if (safeQuestionIndex < currentLevel.questions.length - 1) {
      saveCodeReadingProgress({ levelIndex: safeLevelIndex, questionIndex: safeQuestionIndex + 1 });
    } else if (safeLevelIndex < data.length - 1) {
      saveCodeReadingProgress({ levelIndex: safeLevelIndex + 1, questionIndex: 0 });
    }
    setIsFlipped(false);
  };

  const prevQuestion = () => {
    if (safeQuestionIndex > 0) {
      saveCodeReadingProgress({ levelIndex: safeLevelIndex, questionIndex: safeQuestionIndex - 1 });
    } else if (safeLevelIndex > 0) {
      const prevLvl = data[safeLevelIndex - 1];
      saveCodeReadingProgress({ levelIndex: safeLevelIndex - 1, questionIndex: Math.max(0, prevLvl.questions.length - 1) });
    }
    setIsFlipped(false);
  };

  const langLabel = (currentQuestion.codeLanguage || currentQuestion.language || 'Code').toUpperCase();

  return (
    <div className="flex flex-col h-full gap-4 pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <motion.button
          type="button"
          aria-label="กลับหน้าหลัก"
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="font-black text-white text-lg">Code Reading</h1>
        <div className="w-10" />
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 glass rounded-2xl border border-white/10 z-10">
        <button
          type="button"
          onClick={() => handleModeChange('code')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'code' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          Frontend (HTML/JS)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('sql')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'sql' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          Database (SQL)
        </button>
      </div>

      {/* Level Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none z-10 -mx-2 px-2">
        {data.map((lvl, idx) => (
          <button
            key={`${mode}-${lvl.title}-${idx}`}
            type="button"
            onClick={() => handleLevelChange(idx)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              safeLevelIndex === idx
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Level {lvl.level || idx + 1}
          </button>
        ))}
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 w-full relative z-0 mt-1 mb-2" style={{ perspective: 1000 }}>
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front Side: Code & Question */}
          <div
            className="absolute inset-0 w-full h-full glass-dark rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500 pb-2 border-b border-white/10">
                <span className="text-blue-400">{langLabel}</span>
                <span>ข้อ {safeQuestionIndex + 1}/{currentLevel.questions.length}</span>
              </div>

              <div className="bg-[#0f111a] border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-2 opacity-30 text-[10px] font-mono text-gray-500">
                  {currentQuestion.id}
                </div>
                <pre className="text-gray-300 font-mono text-xs md:text-sm overflow-x-auto leading-relaxed scrollbar-thin">
                  <code>{currentQuestion.code}</code>
                </pre>
              </div>

              <div className="space-y-3 mt-4">
                <p className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> คำถาม:
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion.question}</p>

                {currentQuestion.hint && (
                  <div className="mt-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200/90 leading-relaxed">{currentQuestion.hint}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFlipped(true)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Repeat className="w-4 h-4" /> แตะเพื่อดูเฉลย
              </motion.button>
            </div>
          </div>

          {/* Back Side: Answer */}
          <div
            className="absolute inset-0 w-full h-full glass-dark rounded-3xl border border-emerald-500/30 flex flex-col overflow-hidden shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-emerald-500 pb-2 border-b border-emerald-500/20">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> เฉลย</span>
                <span>ข้อ {safeQuestionIndex + 1}/{currentLevel.questions.length}</span>
              </div>

              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {currentQuestion.answer}
              </div>

              {currentQuestion.whatIf && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <p className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> ลองคิดต่อ... (What if?)
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                    {currentQuestion.whatIf}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-emerald-500/20 bg-emerald-900/10 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFlipped(false)}
                className="w-full py-3.5 glass border-emerald-500/30 rounded-xl text-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/10 transition-colors"
              >
                <Repeat className="w-4 h-4" /> แตะเพื่อดูโจทย์อีกครั้ง
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Nav Controls */}
      <div className="absolute bottom-4 left-5 right-5 flex gap-3 z-10">
        <button
          type="button"
          onClick={prevQuestion}
          disabled={safeLevelIndex === 0 && safeQuestionIndex === 0}
          className="flex-1 py-3.5 glass rounded-2xl text-white font-bold disabled:opacity-30 transition-opacity text-sm border-white/10"
        >
          ก่อนหน้า
        </button>
        <button
          type="button"
          onClick={nextQuestion}
          disabled={safeLevelIndex === data.length - 1 && safeQuestionIndex === currentLevel.questions.length - 1}
          className="flex-1 py-3.5 bg-blue-600 rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-40 text-sm"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
