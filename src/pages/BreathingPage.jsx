import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wind, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PHASES = {
  INTRO: 'intro',
  BREATHING: 'breathing',
  RETENTION: 'retention',
  RECOVERY: 'recovery',
  DONE: 'done',
};

const MAX_ROUNDS = 3;
const MAX_BREATHS = 30;

export default function BreathingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [round, setRound] = useState(1);
  const [breathCount, setBreathCount] = useState(0);
  const [inhale, setInhale] = useState(true);
  const [retentionSecs, setRetentionSecs] = useState(0);
  const [recoverySecs, setRecoverySecs] = useState(15);
  const timerRef = useRef(null);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  // Breathing phase
  useEffect(() => {
    if (phase === PHASES.BREATHING) {
      timerRef.current = setInterval(() => {
        setInhale(prev => {
          if (!prev) {
            setBreathCount(bc => {
              const next = bc + 1;
              if (next >= MAX_BREATHS) {
                clearTimer();
                setRetentionSecs(0);
                setPhase(PHASES.RETENTION);
                return 0;
              }
              return next;
            });
          }
          return !prev;
        });
      }, 1400);
    }
    return clearTimer;
  }, [phase]);

  // Retention phase timer
  useEffect(() => {
    if (phase === PHASES.RETENTION) {
      timerRef.current = setInterval(() => {
        setRetentionSecs(s => s + 1);
      }, 1000);
    }
    return clearTimer;
  }, [phase]);

  // Recovery phase timer
  useEffect(() => {
    if (phase === PHASES.RECOVERY) {
      timerRef.current = setInterval(() => {
        setRecoverySecs(s => {
          if (s <= 1) {
            clearTimer();
            if (round >= MAX_ROUNDS) {
              setPhase(PHASES.DONE);
            } else {
              setRound(r => r + 1);
              setPhase(PHASES.INTRO);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [phase, round]);

  const startBreathing = () => {
    setBreathCount(0);
    setInhale(true);
    setPhase(PHASES.BREATHING);
  };

  const endRetention = () => {
    clearTimer();
    setRecoverySecs(15);
    setPhase(PHASES.RECOVERY);
  };

  const reset = () => {
    clearTimer();
    setPhase(PHASES.INTRO);
    setRound(1);
    setBreathCount(0);
    setRetentionSecs(0);
    setRecoverySecs(15);
  };

  const circleScale = phase === PHASES.BREATHING ? (inhale ? 1.3 : 1) : phase === PHASES.RETENTION ? 1.3 : 1;
  const circleColor = phase === PHASES.BREATHING ? '#22d3ee' : phase === PHASES.RETENTION ? '#a78bfa' : '#34d399';

  const centerText = () => {
    if (phase === PHASES.INTRO) return { icon: Wind, main: 'พร้อมไหม?', sub: 'กดปุ่มด้านล่างเพื่อเริ่ม' };
    if (phase === PHASES.BREATHING) return { icon: null, main: inhale ? 'หายใจเข้า' : 'หายใจออก', sub: `${breathCount} / ${MAX_BREATHS}` };
    if (phase === PHASES.RETENTION) return { icon: null, main: `${retentionSecs}s`, sub: 'กลั้นหายใจ' };
    if (phase === PHASES.RECOVERY) return { icon: null, main: `${recoverySecs}s`, sub: 'หายใจปกติ' };
    if (phase === PHASES.DONE) return { icon: CheckCircle2, main: 'เสร็จสิ้น!', sub: 'สำเร็จ 3 รอบ' };
  };

  const ct = centerText();
  const CenterIcon = ct?.icon;

  const handleAction = () => {
    if (phase === PHASES.INTRO) startBreathing();
    else if (phase === PHASES.RETENTION) endRetention();
    else if (phase === PHASES.DONE) reset();
  };

  const btnLabel = () => {
    if (phase === PHASES.INTRO) return `เริ่มรอบที่ ${round}`;
    if (phase === PHASES.BREATHING) return 'กำลังหายใจ...';
    if (phase === PHASES.RETENTION) return 'กลั้นพอแล้ว → หายใจเข้า';
    if (phase === PHASES.RECOVERY) return `พักหายใจ... ${recoverySecs}s`;
    return 'เริ่มใหม่';
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { clearTimer(); navigate('/'); }}
          className="p-2.5 glass rounded-xl border border-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="font-black text-white text-lg">ฝึกหายใจ Wim Hof</h1>
          <p className="text-xs text-gray-400">รอบที่ {round} จาก {MAX_ROUNDS}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Round indicators */}
      <div className="flex gap-2 justify-center">
        {Array.from({ length: MAX_ROUNDS }, (_, i) => (
          <div key={i} className={`w-8 h-1.5 rounded-full transition-colors ${i < round ? 'bg-cyan-400' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Main Circle */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Outer pulse */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: `${circleColor}20` }}
            animate={{ scale: circleScale * 1.15 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          />
          {/* Main circle */}
          <motion.div
            className="w-48 h-48 rounded-full flex flex-col items-center justify-center border-4"
            style={{ borderColor: circleColor, backgroundColor: `${circleColor}15` }}
            animate={{ scale: circleScale }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          >
            {CenterIcon && <CenterIcon className="w-8 h-8 text-cyan-300 mb-1" />}
            <div className="text-2xl font-black text-white text-center px-4">{ct?.main}</div>
            <div className="text-xs text-gray-300 mt-1">{ct?.sub}</div>
          </motion.div>
        </div>

        <motion.button whileTap={{ scale: 0.95 }}
          onClick={handleAction}
          disabled={phase === PHASES.BREATHING || phase === PHASES.RECOVERY}
          className={`w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg border transition-all
            ${phase === PHASES.BREATHING || phase === PHASES.RECOVERY
              ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-teal-500 border-transparent shadow-xl shadow-cyan-500/20'}`}>
          {btnLabel()}
        </motion.button>
      </div>
    </div>
  );
}
