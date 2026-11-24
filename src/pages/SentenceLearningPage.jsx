import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Volume2,
  Mic,
  MicOff,
  Star,
  CheckCircle,
  Sparkles,
  Layers,
  Lightbulb,
  RotateCcw,
  Check,
  X,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Smile,
  Coffee,
  ShoppingBag,
  Compass,
  Briefcase,
  ShieldAlert,
  UserCheck,
  Hash,
  AlertCircle,
} from 'lucide-react';
import useStore from '../store/useStore';
import {
  sentenceCategories,
  chineseSentences,
  englishSentences,
} from '../data/sentenceLearningData';

const createShuffledChunks = (chunks) => {
  const items = (chunks || []).map((text, idx) => ({ id: `${idx}-${text}`, text }));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const evaluateSpeechAccuracy = (target, spoken, lang) => {
  const stripPunct = (str) =>
    String(str || '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?？。，！'"\s]+/g, lang === 'zh' ? '' : ' ')
      .trim()
      .toLowerCase();

  const cleanTarget = stripPunct(target);
  const cleanSpoken = stripPunct(spoken);
  if (!cleanTarget || !cleanSpoken) return 'close';
  if (cleanTarget === cleanSpoken) return 'perfect';

  const targetTokens = lang === 'zh' ? Array.from(cleanTarget) : cleanTarget.split(/\s+/).filter(Boolean);
  const spokenTokens = lang === 'zh' ? Array.from(cleanSpoken) : cleanSpoken.split(/\s+/).filter(Boolean);
  if (targetTokens.length === 0) return 'close';

  const spokenSet = new Set(spokenTokens);
  const matched = targetTokens.filter((tok) => spokenSet.has(tok)).length;
  const ratio = matched / targetTokens.length;

  return ratio >= 0.75 ? 'perfect' : 'close';
};

const CATEGORY_ICONS = {
  Sparkles,
  UserCheck,
  Hash,
  Smile,
  Coffee,
  ShoppingBag,
  Compass,
  Briefcase,
  ShieldAlert,
};

function SentenceBuilderGame({ currentSentence, onComplete, playSpeech }) {
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState(null);
  const [available, setAvailable] = useState(() => createShuffledChunks(currentSentence?.builderChunks));

  const handleReset = () => {
    setSelected([]);
    setStatus(null);
    setAvailable(createShuffledChunks(currentSentence?.builderChunks));
  };

  const handleSelectChunk = (item) => {
    if (status === 'correct') return;
    const nextSelected = [...selected, item];
    const nextAvailable = available.filter((a) => a.id !== item.id);

    setSelected(nextSelected);
    setAvailable(nextAvailable);
    setStatus(null);

    if (nextSelected.length === (currentSentence?.builderChunks || []).length) {
      const correctJoined = (currentSentence.builderChunks || []).join('').replace(/\s+/g, '');
      const selectedJoined = nextSelected.map((s) => s.text).join('').replace(/\s+/g, '');

      if (correctJoined === selectedJoined) {
        setStatus('correct');
        playSpeech(currentSentence.sentence, false);
        onComplete();
      } else {
        setStatus('wrong');
      }
    }
  };

  const handleRemoveSelected = (item) => {
    if (status === 'correct') return;
    setSelected((prev) => prev.filter((s) => s.id !== item.id));
    setAvailable((prev) => [...prev, item]);
    setStatus(null);
  };

  return (
    <div className="relative z-10 flex flex-col justify-between gap-4 py-2 flex-1">
      <div className="text-center">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          แตะเรียงชิ้นส่วนให้ถูกต้องตามประโยคภาษาเป้าหมาย
        </span>
        <p className="text-xs text-gray-300 font-bold mt-1">
          ความหมาย: "{currentSentence.thai}"
        </p>
      </div>

      <div className="min-h-[72px] p-4 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-wrap items-center justify-center gap-2">
        {selected.length === 0 ? (
          <span className="text-xs text-gray-500 italic">แตะคำด้านล่างเพื่อเริ่มเรียง...</span>
        ) : (
          selected.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleRemoveSelected(item)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-sm"
            >
              {item.text}
            </motion.button>
          ))
        )}
      </div>

      {status === 'correct' && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>ถูกต้อง! สมองกำลังจำ Pattern ประโยคนี้โดยอัตโนมัติ</span>
        </div>
      )}

      {status === 'wrong' && (
        <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
          <X className="w-4 h-4" />
          <span>ยังไม่ถูกต้อง แตะคำด้านบนเพื่อนำออก หรือกดรีเซ็ตได้เลย</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {available.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelectChunk(item)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 shadow-sm transition-all"
          >
            {item.text}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center mt-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-gray-400 hover:text-white flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ตชิ้นส่วน</span>
        </button>
      </div>
    </div>
  );
}

export default function SentenceLearningPage() {
  const navigate = useNavigate();
  const {
    sentenceLanguage,
    setSentenceLanguage,
    learnedSentences,
    toggleLearnedSentence,
    favSentences,
    toggleFavSentence,
    sentenceCategory,
    setSentenceCategory,
    incrementSentencePractice,
  } = useStore();

  const [activeTab, setActiveTab] = useState('pattern');
  const [activeVariationIndex, setActiveVariationIndex] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speechAccuracy, setSpeechAccuracy] = useState(null);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore unmount abort errors
        }
      }
    };
  }, []);

  const allSentences = useMemo(() => {
    return sentenceLanguage === 'zh' ? chineseSentences : englishSentences;
  }, [sentenceLanguage]);

  const filteredSentences = useMemo(() => {
    if (sentenceCategory === 'all') return allSentences;
    return allSentences.filter((s) => s.category === sentenceCategory);
  }, [allSentences, sentenceCategory]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLanguageChange = (lang) => {
    setSentenceLanguage(lang);
    setCurrentIndex(0);
    setActiveVariationIndex(null);
    setSpokenTranscript('');
    setSpeechAccuracy(null);
    setSpeechError('');
  };

  const handleCategoryChange = (catId) => {
    setSentenceCategory(catId);
    setCurrentIndex(0);
    setActiveVariationIndex(null);
    setSpokenTranscript('');
    setSpeechAccuracy(null);
    setSpeechError('');
  };

  const currentSentence = filteredSentences[currentIndex] || filteredSentences[0] || allSentences[0];

  const displaySentence = useMemo(() => {
    if (!currentSentence) return null;
    if (activeVariationIndex !== null && currentSentence.variations && currentSentence.variations[activeVariationIndex]) {
      const v = currentSentence.variations[activeVariationIndex];
      return {
        ...currentSentence,
        sentence: v.text,
        pinyin: v.pinyin,
        thai: v.thai,
        isVariation: true,
      };
    }
    return currentSentence;
  }, [currentSentence, activeVariationIndex]);

  const handleNext = () => {
    if (filteredSentences.length === 0) return;
    setActiveVariationIndex(null);
    setSpokenTranscript('');
    setSpeechAccuracy(null);
    setSpeechError('');
    setCurrentIndex((prev) => (prev + 1) % filteredSentences.length);
    incrementSentencePractice();
  };

  const handlePrev = () => {
    if (filteredSentences.length === 0) return;
    setActiveVariationIndex(null);
    setSpokenTranscript('');
    setSpeechAccuracy(null);
    setSpeechError('');
    setCurrentIndex((prev) => (prev - 1 + filteredSentences.length) % filteredSentences.length);
  };

  const playSpeech = (text, slow = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSlowMode(slow);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = sentenceLanguage === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = slow ? 0.72 : 0.98;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    setSpeechError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('เบราว์เซอร์นี้ไม่รองรับการรับเสียงผ่านไมโครโฟน กรุณาเปิดฟังเสียงแล้วฝึกพูดตามได้เลยครับ');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = sentenceLanguage === 'zh' ? 'zh-CN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenTranscript('');
        setSpeechAccuracy(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setSpokenTranscript(transcript);
        const accuracy = evaluateSpeechAccuracy(displaySentence?.sentence, transcript, sentenceLanguage);
        setSpeechAccuracy(accuracy);
        if (accuracy === 'perfect') {
          incrementSentencePractice();
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        const reason = event?.error === 'not-allowed'
          ? 'กรุณาอนุญาตสิทธิ์การใช้ไมโครโฟนในเบราว์เซอร์'
          : 'ไม่สามารถรับเสียงได้ กรุณาลองพูดใหม่อีกครั้ง';
        setSpeechError(reason);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError('ไม่สามารถเริ่มบันทึกเสียงได้ในขณะนี้');
    }
  };

  const isMastered = displaySentence && learnedSentences.includes(displaySentence.id);
  const isFav = displaySentence && favSentences.includes(displaySentence.id);
  const totalMastered = allSentences.filter((s) => learnedSentences.includes(s.id)).length;
  const progressPercent = allSentences.length > 0 ? Math.round((totalMastered / allSentences.length) * 100) : 0;

  if (!displaySentence) return null;

  return (
    <div className="flex flex-col h-full gap-4 pb-12">
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          aria-label="กลับหน้าหลัก"
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-white">ฝึกพูดจากประโยค</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Chunking
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {totalMastered} / {allSentences.length} ประโยค · {progressPercent}%
          </span>
        </div>

        <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => handleLanguageChange('zh')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              sentenceLanguage === 'zh' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🇨🇳 จีน
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              sentenceLanguage === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🇬🇧 อังกฤษ
          </button>
        </div>
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden -mt-2">
        <motion.div
          className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1 glass-dark rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('pattern')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pattern'
              ? 'bg-gradient-to-r from-rose-500/80 to-pink-600/80 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>โครงสร้างประโยค</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shadowing')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'shadowing'
              ? 'bg-gradient-to-r from-purple-500/80 to-indigo-600/80 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>ฝึกพูดตาม</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'builder'
              ? 'bg-gradient-to-r from-emerald-500/80 to-teal-600/80 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>เรียงประโยค</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
        {sentenceCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon] || Sparkles;
          const isSelected = sentenceCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                isSelected
                  ? 'bg-white/20 border-white/30 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${displaySentence.id}_${activeVariationIndex}_${activeTab}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col justify-between glass-dark rounded-[2rem] p-6 border border-white/10 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/10">
                {displaySentence.situation}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                #{currentIndex + 1}/{filteredSentences.length}
              </span>
            </div>

            <motion.button
              type="button"
              aria-label={isFav ? 'นำออกจากประโยคโปรด' : 'บันทึกเป็นประโยคโปรด'}
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleFavSentence(displaySentence.id)}
              className={`p-2 rounded-full transition-colors ${
                isFav ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Star className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
            </motion.button>
          </div>

          {activeTab === 'pattern' && (
            <div className="relative z-10 flex flex-col gap-4 my-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Pattern โครงสร้างจำง่าย (พูดได้ทันที)</span>
                </div>
                <div className="text-sm font-black text-white/90">{displaySentence.pattern}</div>
                <div className="text-xs text-gray-400">{displaySentence.patternThai}</div>
              </div>

              <div className="text-center py-2">
                {sentenceLanguage === 'zh' ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide leading-tight">
                      {displaySentence.sentence}
                    </h2>
                    <p className="text-rose-300 font-medium text-sm md:text-base tracking-wider font-mono">
                      {displaySentence.pinyin}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                      "{displaySentence.sentence}"
                    </h2>
                    <p className="text-blue-300 font-mono text-xs md:text-sm">
                      {displaySentence.pinyin}
                    </p>
                  </div>
                )}
                <p className="text-base font-bold text-gray-200 mt-2">{displaySentence.thai}</p>
              </div>

              {displaySentence.breakdown && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    ถอดรหัสชิ้นส่วนในประโยค (Word Chunks):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {displaySentence.breakdown.map((item, idx) => (
                      <div
                        key={`${item.word}-${idx}`}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center"
                      >
                        <span className="text-xs font-bold text-white">{item.word}</span>
                        {item.pinyin && (
                          <span className="text-[9px] text-rose-300/80 font-mono leading-none mt-0.5">
                            {item.pinyin}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                          {item.thai}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSentence.variations && currentSentence.variations.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                    <Shuffle className="w-3 h-3" />
                    <span>ลองเปลี่ยนคำในประโยค (Substitution):</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveVariationIndex(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        activeVariationIndex === null
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      ต้นแบบเดิม
                    </button>
                    {currentSentence.variations.map((v, vIdx) => (
                      <button
                        key={v.replace}
                        type="button"
                        onClick={() => {
                          setActiveVariationIndex(vIdx);
                          playSpeech(v.text, false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          activeVariationIndex === vIdx
                            ? 'bg-rose-500 border-rose-400 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        + {v.replace}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {displaySentence.tip && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {displaySentence.tip}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shadowing' && (
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 py-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shadow-lg">
                <Mic className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-xs">
                <h3 className="text-2xl font-black text-white">{displaySentence.sentence}</h3>
                <p className="text-sm font-mono text-purple-300">{displaySentence.pinyin}</p>
                <p className="text-xs text-gray-400 font-medium">"{displaySentence.thai}"</p>
              </div>

              {speechError && (
                <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 max-w-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}

              {spokenTranscript && (
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10 w-full max-w-sm">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">สิ่งที่คุณพูด:</div>
                  <div className="text-sm font-bold text-white mt-0.5">"{spokenTranscript}"</div>
                  {speechAccuracy === 'perfect' && (
                    <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ออกเสียงได้ยอดเยี่ยม! สำเนียงตรงมาก
                    </div>
                  )}
                  {speechAccuracy === 'close' && (
                    <div className="text-xs font-bold text-amber-300 mt-1">
                      ใกล้เคียงแล้ว! ลองเปิดเสียง 0.75x แล้วพูดตามอีกรอบนะครับ
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={startListening}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 border transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse border-rose-400'
                      : 'bg-purple-600 text-white border-purple-400 hover:bg-purple-500 shadow-lg'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'กำลังฟังเสียงคุณ...' : 'กดแล้วพูดทดสอบ'}</span>
                </motion.button>
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <SentenceBuilderGame
              key={`${currentSentence.id}_${activeTab}`}
              currentSentence={currentSentence}
              onComplete={incrementSentencePractice}
              playSpeech={playSpeech}
            />
          )}

          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                aria-label="ฟังเสียงความเร็วปกติ 1.0x"
                whileTap={{ scale: 0.9 }}
                onClick={() => playSpeech(displaySentence.sentence, false)}
                className={`p-3 rounded-2xl border flex items-center gap-1.5 transition-all ${
                  isPlayingAudio && !isSlowMode
                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
                title="ฟังความเร็วปกติ"
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-[11px] font-bold">1.0x</span>
              </motion.button>

              <motion.button
                type="button"
                aria-label="ฟังเสียงช้า 0.75x"
                whileTap={{ scale: 0.9 }}
                onClick={() => playSpeech(displaySentence.sentence, true)}
                className={`p-3 rounded-2xl border flex items-center gap-1 transition-all ${
                  isPlayingAudio && isSlowMode
                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="ฟังช้าเพื่อแกะเสียงพินอิน/วรรณยุกต์"
              >
                <span className="text-[11px] font-bold">🐢 0.75x</span>
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                aria-label="ประโยคก่อนหน้า"
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
                title="ประโยคก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <motion.button
                type="button"
                aria-label="ประโยคถัดไป"
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 flex items-center gap-1"
                title="ประโยคถัดไป"
              >
                <span className="text-xs font-bold">ถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            toggleLearnedSentence(displaySentence.id);
            incrementSentencePractice();
          }}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
            isMastered
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          <span>{isMastered ? 'พูดประโยคนี้คล่องแล้ว (Mastered)' : 'ทำเครื่องหมายว่าพูดคล่องแล้ว'}</span>
        </motion.button>
      </div>
    </div>
  );
}
