import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { Volume2, Star, CheckCircle, RefreshCw } from 'lucide-react';

const getUnlearnedCard = (vocab, learned) => {
  if (!vocab || vocab.length === 0) return null;
  const unlearned = vocab.filter(c => !learned.includes(c.id));
  const pool = unlearned.length > 0 ? unlearned : vocab;
  return pool[Math.floor(Math.random() * pool.length)] || null;
};

const FlashcardWidget = () => {
  const { vocabulary, learnedCards, favCards, toggleLearned, toggleFav, incrementCardsFlipped } = useStore();
  const [selectedCard, setSelectedCard] = useState(() => getUnlearnedCard(vocabulary, learnedCards));
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!isFlipped) {
      incrementCardsFlipped();
    }
    setIsFlipped(!isFlipped);
  };

  const pickRandomCard = React.useCallback(() => {
    const nextCard = getUnlearnedCard(vocabulary, learnedCards);
    if (nextCard) {
      setSelectedCard(nextCard);
      setIsFlipped(false);
    }
  }, [vocabulary, learnedCards]);

  const currentCard = selectedCard || getUnlearnedCard(vocabulary, learnedCards);
  if (!currentCard) return null;

  const isFav = favCards.includes(currentCard.id);
  const isLearned = learnedCards.includes(currentCard.id);

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    synth.speak(utter);
  };

  return (
    <div className="w-full relative h-[300px]" style={{ perspective: "1500px" }}>
      <motion.div
        className="w-full h-full relative cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleFlip}
      >
        {/* FRONT */}
        <div 
          className="absolute inset-0 glass-dark rounded-[2rem] p-6 flex flex-col justify-between border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Subtle animated background glow */}
          <div className="absolute -inset-4 opacity-30 blur-[40px] rounded-full bg-blue-500/20 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-300">
              {currentCard.level || 'A1'}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFav(currentCard.id); }}
              className={`p-2 rounded-full transition-colors ${isFav ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 bg-white/5'}`}
            >
              <Star className="w-5 h-5" fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
              {currentCard.word}
            </h2>
            <p className="text-blue-300/80 font-mono text-sm">{currentCard.ipa}</p>
            <span className="mt-2 text-xs font-bold px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/20">
              {currentCard.pos}
            </span>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <button 
              onClick={(e) => handleSpeak(e, currentCard.word)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tap to flip</p>
          </div>
        </div>

        {/* BACK */}
        <div 
          className="absolute inset-0 glass-dark rounded-[2rem] p-6 flex flex-col justify-between border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute -inset-4 opacity-30 blur-[40px] rounded-full bg-pink-500/20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-center items-center text-center gap-4">
            <h3 className="text-3xl font-bold text-white font-sans">{currentCard.thai}</h3>
            
            <div className="w-full max-w-[80%] h-px bg-white/10 my-2" />
            
            <div className="space-y-1">
              <p className="text-sm text-gray-300 italic">"{currentCard.example}"</p>
              <p className="text-xs text-gray-500">{currentCard.example_meaning}</p>
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-center w-full">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLearned(currentCard.id); }}
              className={`flex-1 mr-2 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors ${
                isLearned 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isLearned ? 'Learned' : 'Mark Learned'}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); pickRandomCard(); }}
              className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-500/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardWidget;
