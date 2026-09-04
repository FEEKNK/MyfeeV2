import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

export default function PinLockScreen({ onUnlock }) {
  const { verifyPin: storeVerifyPin } = useStore();
  
  const [enteredPin, setEnteredPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(() => {
    return parseInt(localStorage.getItem('myfee_pin_attempts') || '0', 10);
  });
  const [lockoutTimer, setLockoutTimer] = useState(() => {
    const lockUntil = parseInt(localStorage.getItem('myfee_pin_lock_until') || '0', 10);
    const now = Date.now();
    return lockUntil > now ? Math.ceil((lockUntil - now) / 1000) : 0;
  });

  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setFailedAttempts(0);
            localStorage.setItem('myfee_pin_attempts', '0');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTimer]);

  const checkPin = useCallback(async (pin) => {
    setIsVerifying(true);
    try {
      const isValid = await storeVerifyPin(pin);
      if (isValid) {
        setFailedAttempts(0);
        localStorage.removeItem('myfee_pin_attempts');
        localStorage.removeItem('myfee_pin_lock_until');
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('myfee_pin_attempts', newAttempts.toString());
        
        if (newAttempts >= 5) {
          const lockUntil = Date.now() + 30000; // 30 seconds
          localStorage.setItem('myfee_pin_lock_until', lockUntil.toString());
          setLockoutTimer(30);
        }

        setTimeout(() => {
          setIsError(true);
          setShakeKey(prev => prev + 1);
          setEnteredPin('');
          setIsVerifying(false);
        }, 200);
      }
    } catch {
      setIsError(true);
      setShakeKey(prev => prev + 1);
      setEnteredPin('');
      setIsVerifying(false);
    }
  }, [storeVerifyPin, onUnlock, failedAttempts]);

  const handleDigit = useCallback((digit) => {
    if (isVerifying || lockoutTimer > 0) return;
    setEnteredPin(prev => {
      if (prev.length >= 4) return prev;
      const nextPin = prev + digit;
      setIsError(false);
      if (nextPin.length === 4) {
        checkPin(nextPin);
      }
      return nextPin;
    });
  }, [isVerifying, checkPin, lockoutTimer]);

  const handleDelete = useCallback(() => {
    setEnteredPin(prev => prev.slice(0, -1));
    setIsError(false);
  }, []);

  const handleClear = useCallback(() => {
    setEnteredPin('');
    setIsError(false);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  const KEYPAD_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-2xl px-6 select-none"
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* App Logo & Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-blue-500/10 border border-blue-100">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
            <div className="absolute -inset-1 bg-blue-400 rounded-2xl blur-xl opacity-20 -z-10 animate-pulse" />
          </div>

          <h2 className="text-xl font-black text-gray-900 tracking-wide flex items-center gap-1.5">
            My Fee <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Security</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">กรุณาใส่รหัส PIN 4 หลักเพื่อเข้าใช้งาน</p>
        </motion.div>

        {/* PIN Indicators (4 Dots) */}
        <motion.div
          key={shakeKey}
          animate={isError ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-5 mb-4"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = enteredPin.length > index;
            return (
              <motion.div
                key={index}
                animate={{
                  scale: isFilled ? 1.2 : 1,
                  borderColor: isError ? 'rgba(239, 68, 68, 0.9)' : isFilled ? 'rgba(59, 130, 246, 1)' : 'rgba(0, 0, 0, 0.15)',
                  backgroundColor: isError
                    ? 'rgba(239, 68, 68, 0.7)'
                    : isFilled
                    ? 'rgba(59, 130, 246, 1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 shadow-sm ${
                  isFilled ? 'shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
                } ${isError ? 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' : ''}`}
              />
            );
          })}
        </motion.div>

        {/* Error message / Hint */}
        <div className="h-6 flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            {lockoutTimer > 0 ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-orange-500 font-bold"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ถูกระงับชั่วคราว กรุณารอ {lockoutTimer} วินาที</span>
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-400 font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>รหัส PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง</span>
              </motion.div>
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-gray-500"
              >
                กดปุ่มตัวเลขหรือพิมพ์จากแป้นพิมพ์
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keypad Grid (3 x 4) */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {KEYPAD_NUMS.map((num) => (
            <motion.button
              key={num}
              disabled={lockoutTimer > 0}
              whileHover={lockoutTimer > 0 ? {} : { scale: 1.05 }}
              whileTap={lockoutTimer > 0 ? {} : { scale: 0.9 }}
              onClick={() => handleDigit(num)}
              className={`h-16 rounded-2xl backdrop-blur-lg border flex items-center justify-center text-xl font-black text-gray-800 shadow-sm transition-colors ${
                lockoutTimer > 0 ? 'bg-white/30 border-white/40 opacity-50 cursor-not-allowed' : 'bg-white/60 border-white/80 hover:bg-white/80 active:bg-white/40'
              }`}
            >
              {num}
            </motion.button>
          ))}

          {/* Clear Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            className="h-16 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white/60 active:bg-white/20 transition-colors"
          >
            ล้าง
          </motion.button>

          {/* Zero Button */}
          <motion.button
            disabled={lockoutTimer > 0}
            whileHover={lockoutTimer > 0 ? {} : { scale: 1.05 }}
            whileTap={lockoutTimer > 0 ? {} : { scale: 0.9 }}
            onClick={() => handleDigit('0')}
            className={`h-16 rounded-2xl backdrop-blur-lg border flex items-center justify-center text-xl font-black text-gray-800 shadow-sm transition-colors ${
              lockoutTimer > 0 ? 'bg-white/30 border-white/40 opacity-50 cursor-not-allowed' : 'bg-white/60 border-white/80 hover:bg-white/80 active:bg-white/40'
            }`}
          >
            0
          </motion.button>

          {/* Backspace Button */}
          <motion.button
            disabled={lockoutTimer > 0}
            whileHover={lockoutTimer > 0 ? {} : { scale: 1.05 }}
            whileTap={lockoutTimer > 0 ? {} : { scale: 0.9 }}
            onClick={handleDelete}
            className={`h-16 rounded-2xl border flex items-center justify-center text-gray-600 transition-colors ${
              lockoutTimer > 0 ? 'bg-white/20 border-white/30 opacity-50 cursor-not-allowed' : 'bg-white/40 border-white/60 hover:bg-gray-100 active:bg-white/20'
            }`}
          >
            <Delete className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
