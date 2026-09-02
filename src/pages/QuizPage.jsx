import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, Trophy, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function QuizPage() {
  const navigate = useNavigate();
  const { vocabulary, flashcardFilter, markLearned, settings, learnedCards } = useStore();
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState(null); // { type, correct, options, error }
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [testLearnedOnly, setTestLearnedOnly] = useState(true); // Default to test learned words
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const filteredVocab = flashcardFilter === 'All' 
    ? vocabulary 
    : vocabulary.filter(w => w.level === flashcardFilter || w.tags?.includes(flashcardFilter));

  const generateQuiz = () => {
    setFeedback(null);
    setInputVal('');
    
    let dataPool = testLearnedOnly 
      ? filteredVocab.filter(w => learnedCards.includes(w.id))
      : filteredVocab;

    // Fallback if not enough words
    if (dataPool.length === 0) {
      setQuizState({ error: testLearnedOnly ? 'ยังไม่มีคำศัพท์ที่จำได้ในหมวดนี้' : 'ไม่มีคำศัพท์ในหมวดนี้' });
      return;
    }

    const correct = dataPool[Math.floor(Math.random() * dataPool.length)];
    const type = Math.floor(Math.random() * 3); // 0: Meaning, 1: Listening, 2: Spelling

    if (type === 1 && settings.autoPlay) {
      const u = new SpeechSynthesisUtterance(correct.word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }

    if (type === 2) {
      setQuizState({ type, correct, options: [] });
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    // Generate distractors
    const fallbackPool = filteredVocab; // Use all vocab for distractors if needed
    const distractors = [];
    const maxDistractors = Math.min(3, fallbackPool.length - 1);
    let attempts = 0;
    while (distractors.length < maxDistractors && attempts < 50) {
      attempts++;
      const r = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      if (r.id !== correct.id && !distractors.some(d => d.id === r.id)) distractors.push(r);
    }
    const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
    setQuizState({ type, correct, options });
  };

  useEffect(() => {
    generateQuiz();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [testLearnedOnly, flashcardFilter]);

  const handleAnswer = (answer) => {
    if (feedback !== null) return;
    
    let isCorrect = false;
    if (quizState.type === 2) {
      isCorrect = answer.toLowerCase().trim() === quizState.correct.word.toLowerCase();
    } else {
      isCorrect = answer.id === quizState.correct.id;
    }

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      if (!testLearnedOnly) markLearned(quizState.correct.id);
      timeoutRef.current = setTimeout(generateQuiz, 1000);
    } else {
      setFeedback('wrong');
      // Wait longer before next question so user can see the correct answer
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        if (quizState.type === 2) {
          setInputVal('');
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            generateQuiz();
        }
      }, 3000);
    }
  };

  const playSound = () => {
    if (quizState?.correct) {
      const u = new SpeechSynthesisUtterance(quizState.correct.word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };

  if (!quizState) return null;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full font-bold">
          <Trophy className="w-4 h-4" /> Score: {score}
        </div>

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => setTestLearnedOnly(!testLearnedOnly)}
          className={`p-2.5 rounded-xl border transition-colors ${testLearnedOnly ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'glass border-white/10 text-gray-400'}`}
          title={testLearnedOnly ? 'Testing Learned Words' : 'Testing All Words'}
        >
          <BookOpen className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {quizState.error ? (
          <div className="text-center text-gray-400 p-8 glass rounded-2xl">
            <p className="text-lg">{quizState.error}</p>
            {testLearnedOnly && (
              <button 
                onClick={() => setTestLearnedOnly(false)}
                className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl"
              >
                ทดสอบคำศัพท์ทั้งหมดแทน
              </button>
            )}
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div 
                key={quizState.correct.id + quizState.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="w-full text-center relative"
              >
                {quizState.type === 0 && (
                  <h2 className="text-4xl font-black text-white dark-invert mb-2">{quizState.correct.word}</h2>
                )}
                
                {quizState.type === 1 && (
                  <div className="flex flex-col items-center gap-4">
                    <button onClick={playSound} className="p-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/20">
                      <Volume2 className="w-12 h-12" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-300">ฟังแล้วเลือกคำแปล</h2>
                  </div>
                )}

                {quizState.type === 2 && (
                  <>
                    <h2 className="text-3xl font-bold text-white dark-invert mb-2">{quizState.correct.thai}</h2>
                    <p className="text-sm text-gray-400">พิมพ์คำศัพท์ภาษาอังกฤษ</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="w-full max-w-sm space-y-3 relative z-10">
              {(quizState.type === 0 || quizState.type === 1) ? (
                quizState.options.map(opt => {
                  const isCorrectAnswer = feedback === 'wrong' && opt.id === quizState.correct.id;
                  
                  return (
                    <motion.button 
                      key={opt.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(opt)}
                      disabled={feedback !== null}
                      className={`w-full p-4 rounded-2xl border text-lg font-bold transition-all
                        ${isCorrectAnswer ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                        : feedback === 'wrong' ? 'border-red-500/50 bg-red-500/10 text-red-400 opacity-50' 
                        : 'glass border-white/10 text-white dark-invert hover:bg-white/10'}`}
                    >
                      {quizState.type === 0 ? opt.thai : opt.word}
                    </motion.button>
                  );
                })
              ) : (
                <form onSubmit={e => { e.preventDefault(); handleAnswer(inputVal); }} className="w-full flex flex-col gap-4">
                  <motion.input 
                    ref={inputRef}
                    animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    disabled={feedback !== null}
                    placeholder="Type here..."
                    className={`w-full text-center text-2xl p-4 rounded-2xl glass-dark border outline-none transition-colors
                      ${feedback === 'wrong' ? 'border-red-500/50 text-red-400' : feedback === 'correct' ? 'border-emerald-500/50 text-emerald-400' : 'border-white/10 text-white dark-invert focus:border-blue-500/50'}`}
                  />
                  {feedback === 'wrong' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                    >
                      <p className="text-sm text-emerald-500 font-bold mb-1">คำตอบที่ถูกต้องคือ:</p>
                      <p className="text-xl text-emerald-400 font-black">{quizState.correct.word}</p>
                    </motion.div>
                  )}
                  <button type="submit" disabled={feedback !== null} className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-colors">
                    ตรวจคำตอบ
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Feedback Overlay - Reduced scale to be less intrusive when showing answers */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute top-1/4 left-0 right-0 z-0 pointer-events-none flex items-center justify-center opacity-40"
          >
            {feedback === 'correct' ? (
              <CheckCircle2 className="w-32 h-32 text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.8)] opacity-60" />
            ) : (
              <XCircle className="w-32 h-32 text-red-400 drop-shadow-[0_0_25px_rgba(248,113,113,0.8)] opacity-20" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

