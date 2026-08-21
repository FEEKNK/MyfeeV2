import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { Volume2, Star, CheckCircle, RefreshCw, ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function FlashcardPage() {
  const navigate = useNavigate();
  const { vocabulary, learnedCards, favCards, toggleLearned, toggleFav, flashcardFilter, setFlashcardFilter } = useStore();
  const [currentCard, setCurrentCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showLearned, setShowLearned] = useState(false);

  const filteredVocab = flashcardFilter === 'All' 
    ? vocabulary 
    : vocabulary.filter(w => w.level === flashcardFilter || w.tags?.includes(flashcardFilter));

  function pickRandom(vocab, learned) {
    if (!vocab || vocab.length === 0) return null;
    const pool = vocab.filter(c => !learned.includes(c.id));
    const src = pool.length > 0 ? pool : vocab;
    return src[Math.floor(Math.random() * src.length)];
  }

  useEffect(() => {
    setCurrentCard(pickRandom(filteredVocab, learnedCards));
  }, [flashcardFilter, vocabulary]);

  const next = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentCard(pickRandom(filteredVocab, learnedCards)), 150);
  };

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  if (!currentCard) return null;

  const isFav = favCards.includes(currentCard.id);
  const isLearned = learnedCards.includes(currentCard.id);
  
  // Calculate stats for current filter
  const filterLearned = learnedCards.filter(id => filteredVocab.some(v => v.id === id)).length;
  const learnedPct = filteredVocab.length > 0 ? Math.round((filterLearned / filteredVocab.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex bg-white/10 p-1 rounded-xl">
          <select 
            value={flashcardFilter} 
            onChange={e => setFlashcardFilter(e.target.value)}
            className="bg-transparent text-white dark-invert text-sm font-bold outline-none appearance-none px-4 py-1.5"
          >
            {LEVELS.map(lvl => (
              <option key={lvl} value={lvl} className="bg-gray-800 text-white">{lvl === 'All' ? 'ทุกหมวด' : `ระดับ ${lvl}`}</option>
            ))}
          </select>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowLearned(!showLearned)}
          className={`p-2.5 rounded-xl border transition-colors ${showLearned ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'glass border-white/10 text-white dark-invert'}`}>
          <BookOpen className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="text-center mt-[-8px]">
        <p className="text-xs text-gray-400">{filterLearned} / {filteredVocab.length} · {learnedPct}%</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${learnedPct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full relative" style={{ perspective: '1500px', height: '340px' }}>
          <motion.div
            className="w-full h-full relative cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.55, type: 'spring', stiffness: 280, damping: 22 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div className="absolute inset-0 glass-dark rounded-[2rem] p-7 flex flex-col justify-between border border-white/10"
              style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10 flex justify-between">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-300">{currentCard.level || 'A1'}</span>
                <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); toggleFav(currentCard.id); }}
                  className={`p-2 rounded-full transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-600'}`}>
                  <Star className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
                </motion.button>
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">{currentCard.word}</h2>
                <p className="text-blue-300/80 font-mono text-sm">{currentCard.ipa}</p>
                <span className="text-xs font-bold px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/20">{currentCard.pos}</span>
              </div>
              <div className="relative z-10 flex justify-between items-center">
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => handleSpeak(e, currentCard.word)}
                  className="p-3 bg-white/5 rounded-xl border border-white/10 text-white">
                  <Volume2 className="w-5 h-5" />
                </motion.button>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tap to flip</span>
                <div className="w-11 h-11" />
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 glass-dark rounded-[2rem] p-7 flex flex-col justify-between border border-white/10"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-pink-500/10 to-transparent pointer-events-none" />
              <div />
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <h3 className="text-3xl font-bold text-white">{currentCard.thai}</h3>
                <div className="w-3/4 h-px bg-white/10" />
                <div>
                  <p className="text-sm text-gray-300 italic">"{currentCard.example}"</p>
                  <p className="text-xs text-gray-500 mt-1">{currentCard.example_meaning}</p>
                </div>
              </div>
              <div className="relative z-10 flex gap-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); toggleLearned(currentCard.id); next(); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${isLearned ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4" />{isLearned ? 'จำได้แล้ว' : 'ทำเครื่องหมายว่าจำได้'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); next(); }}
                  className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <RefreshCw className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap justify-center">
        {(currentCard.tags || []).map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">{tag}</span>
        ))}
      </div>
    </div>
  );
}
