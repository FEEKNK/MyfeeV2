import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw, SkipForward, Flame, Coffee, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const MODES = {
  FOCUS: { id: 'focus', name: 'โฟกัส', duration: 25 * 60, color: '#f43f5e', gradient: 'from-rose-500 to-red-600' },
  SHORT_BREAK: { id: 'short', name: 'พักสั้น', duration: 5 * 60, color: '#10b981', gradient: 'from-emerald-400 to-teal-500' },
  LONG_BREAK: { id: 'long', name: 'พักยาว', duration: 15 * 60, color: '#0ea5e9', gradient: 'from-sky-400 to-blue-500' },
};

// Simple web audio chime
const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // 2-tone pleasant bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 1.6);
  } catch {}
};

export default function PomodoroPage() {
  const navigate = useNavigate();
  const { pomodoroStats, addPomodoroSession } = useStore();

  const [activeMode, setActiveMode] = useState(MODES.FOCUS);
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.duration);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const clearCurrentTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const switchMode = useCallback((mode) => {
    clearCurrentTimer();
    setIsRunning(false);
    setActiveMode(mode);
    setTimeLeft(mode.duration);
  }, [clearCurrentTimer]);

  const handleComplete = useCallback(() => {
    clearCurrentTimer();
    setIsRunning(false);
    playChime();

    if (activeMode.id === 'focus') {
      addPomodoroSession();
      // Auto transition to short break
      switchMode(MODES.SHORT_BREAK);
    } else {
      switchMode(MODES.FOCUS);
    }
  }, [activeMode, addPomodoroSession, switchMode, clearCurrentTimer]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearCurrentTimer();
    }
    return clearCurrentTimer;
  }, [isRunning, handleComplete, clearCurrentTimer]);

  const toggleTimer = () => setIsRunning((prev) => !prev);

  const resetTimer = () => {
    clearCurrentTimer();
    setIsRunning(false);
    setTimeLeft(activeMode.duration);
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const progress = ((activeMode.duration - timeLeft) / activeMode.duration) * 100;
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col h-full gap-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="text-xl font-black text-white dark-invert">Pomodoro Timer</h1>
          <p className="text-[10px] text-gray-400">โฟกัส 25 นาที พัก 5 นาที</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        {Object.values(MODES).map((m) => {
          const isSelected = activeMode.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isSelected
                  ? `bg-gradient-to-r ${m.gradient} text-white shadow-lg`
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Main Countdown Circle */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
            style={{ backgroundColor: activeMode.color }}
          />

          {/* SVG Progress Circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              stroke={activeMode.color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-300"
            />
          </svg>

          {/* Timer Display Inside */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              {activeMode.name}
            </span>
            <div className="text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
              {minutes}:{seconds}
            </div>
            <div className="mt-2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300">
              {activeMode.id === 'focus' ? (
                <Flame className="w-3 h-3 text-rose-400" />
              ) : (
                <Coffee className="w-3 h-3 text-emerald-400" />
              )}
              <span>{isRunning ? 'กำลังจับเวลา' : 'พร้อมโฟกัส'}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={resetTimer}
            className="p-3.5 rounded-2xl glass border border-white/10 text-gray-300 hover:text-white"
            title="รีเซ็ตเวลา"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-2xl font-black text-base flex items-center gap-2.5 shadow-xl transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : `bg-gradient-to-r ${activeMode.gradient} text-white shadow-${activeMode.id}-500/25`
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> พักชั่วคราว
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" /> เริ่มจับเวลา
              </>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleComplete}
            className="p-3.5 rounded-2xl glass border border-white/10 text-gray-300 hover:text-white"
            title="ข้ามรอบนี้"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="glass-dark rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {pomodoroStats?.todaySessions || 0}
            </div>
            <div className="text-[10px] text-gray-400 font-medium">รอบที่สำเร็จวันนี้</div>
          </div>
        </div>

        <div className="glass-dark rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {pomodoroStats?.totalSessions || 0}
            </div>
            <div className="text-[10px] text-gray-400 font-medium">รอบสำเร็จทั้งหมด</div>
          </div>
        </div>
      </div>
    </div>
  );
}
