import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw, Brain, Coffee, PauseCircle, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODES = [
  { key: 'work', label: 'โฟกัส', icon: Brain, seconds: 25 * 60, color: 'from-blue-500 to-violet-500' },
  { key: 'short', label: 'พัก 5 นาที', icon: Coffee, seconds: 5 * 60, color: 'from-emerald-500 to-teal-500' },
  { key: 'long', label: 'พัก 15 นาที', icon: PauseCircle, seconds: 15 * 60, color: 'from-orange-500 to-amber-500' },
];

export default function PomodoroPage() {
  const navigate = useNavigate();
  const { pomodoroStats, addPomodoroSession } = useStore();
  const [mode, setMode] = useState(MODES[0]);
  const [timeLeft, setTimeLeft] = useState(MODES[0].seconds);
  const [running, setRunning] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && endTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (mode.key === 'work') addPomodoroSession();
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        }
      }, 500);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, endTime]);

  const switchMode = (m) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setMode(m);
    setTimeLeft(m.seconds);
    setEndTime(null);
  };

  const toggle = () => {
    if (!running) {
      setEndTime(Date.now() + timeLeft * 1000);
      setRunning(true);
    } else {
      setRunning(false);
      setEndTime(null);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTimeLeft(mode.seconds);
    setEndTime(null);
  };

  const pct = ((mode.seconds - timeLeft) / mode.seconds) * 100;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 110;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { clearInterval(intervalRef.current); navigate('/'); }}
          className="p-2.5 glass rounded-xl border border-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="font-black text-white dark-invert text-lg">Pomodoro</h1>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Timer className="w-3.5 h-3.5 text-red-400" />
            วันนี้ทำสำเร็จ: {pomodoroStats.todaySessions || 0} รอบ
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2">
        {MODES.map(m => {
          const ModeIcon = m.icon;
          const isSelected = mode.key === m.key;
          return (
            <button key={m.key} onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                isSelected
                  ? `bg-gradient-to-r ${m.color} border-transparent text-white shadow-md`
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}>
              <ModeIcon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timer Ring */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="128" cy="128" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle
              cx="128" cy="128" r="110" fill="none"
              stroke="url(#timerGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={mode.key === 'work' ? '#6366f1' : mode.key === 'short' ? '#10b981' : '#f97316'} />
                <stop offset="100%" stopColor={mode.key === 'work' ? '#a855f7' : mode.key === 'short' ? '#14b8a6' : '#f59e0b'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center z-10">
            <div className="text-6xl font-black text-white tracking-tight">{mins}:{secs}</div>
            <div className="text-sm text-gray-400 mt-1">{mode.label}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.8 }} onClick={reset}
            className="p-4 glass rounded-2xl border border-white/10 text-gray-400 hover:text-white">
            <RotateCcw className="w-6 h-6" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggle}
            className={`p-5 rounded-2xl border font-bold text-white shadow-xl transition-all bg-gradient-to-br ${mode.color} border-transparent`}>
            {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
}
