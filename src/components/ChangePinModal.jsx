import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, X, AlertCircle, CheckCircle2, Delete } from 'lucide-react';
import useStore from '../store/useStore';

function ChangePinModalContent({ onClose }) {
  const { settings, verifyPin: storeVerifyPin, updatePinHash } = useStore();
  const hasExistingPin = Boolean(settings?.pinCode);

  const [step, setStep] = useState(hasExistingPin ? 'current' : 'new'); // 'current' | 'new' | 'confirm' | 'success'
  const [currentInput, setCurrentInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  const scheduleStep = (fn, delayMs) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fn();
    }, delayMs);
  };

  const currentInputValue = step === 'current' ? currentInput : step === 'new' ? newPin : confirmPin;

  const handleDigit = (digit) => {
    if (step === 'success') return;
    setErrorMsg('');

    if (step === 'current') {
      if (currentInput.length < 4) {
        const next = currentInput + digit;
        setCurrentInput(next);
        if (next.length === 4) {
          storeVerifyPin(next).then((isValid) => {
            if (isValid) {
              scheduleStep(() => {
                setStep('new');
                setCurrentInput('');
              }, 150);
            } else {
              scheduleStep(() => {
                setErrorMsg('รหัส PIN เดิมไม่ถูกต้อง');
                setShakeKey((prev) => prev + 1);
                setCurrentInput('');
              }, 200);
            }
          });
        }
      }
    } else if (step === 'new') {
      if (newPin.length < 4) {
        const next = newPin + digit;
        setNewPin(next);
        if (next.length === 4) {
          scheduleStep(() => {
            setStep('confirm');
          }, 150);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === newPin) {
            updatePinHash(next);
            scheduleStep(() => {
              setStep('success');
            }, 150);
          } else {
            scheduleStep(() => {
              setErrorMsg('รหัส PIN ยืนยันไม่ตรงกัน กรุณาตั้งใหม่');
              setShakeKey((prev) => prev + 1);
              setNewPin('');
              setConfirmPin('');
              setStep('new');
            }, 200);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (step === 'current' && currentInput.length > 0) {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (step === 'new' && newPin.length > 0) {
      setNewPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm' && confirmPin.length > 0) {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setErrorMsg('');
    if (step === 'current') setCurrentInput('');
    else if (step === 'new') setNewPin('');
    else if (step === 'confirm') setConfirmPin('');
  };

  const KEYPAD_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-pin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm glass-dark border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center z-10"
      >
        <button
          type="button"
          aria-label="ปิดหน้าต่างตั้งค่ารหัส PIN"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'success' ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 id="change-pin-modal-title" className="text-xl font-bold text-white mb-1">
              {hasExistingPin ? 'เปลี่ยนรหัส PIN สำเร็จ!' : 'ตั้งรหัส PIN สำเร็จ!'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">รหัส PIN 4 หลักของคุณได้รับการบันทึกแล้ว</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-md"
            >
              ตกลง
            </button>
          </motion.div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 id="change-pin-modal-title" className="text-lg font-bold text-white">
                {step === 'current' && 'ใส่รหัส PIN ปัจจุบัน'}
                {step === 'new' && 'ตั้งรหัส PIN ใหม่ 4 หลัก'}
                {step === 'confirm' && 'ยืนยันรหัส PIN ใหม่อีกครั้ง'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 'current' && 'ยืนยันตัวตนก่อนเปลี่ยนรหัสผ่าน'}
                {step === 'new' && 'กรอกตัวเลข 4 หลักที่ต้องการ'}
                {step === 'confirm' && 'กรอกรหัสเดิมอีกครั้งเพื่อความถูกต้อง'}
              </p>
            </div>

            <motion.div
              key={shakeKey}
              animate={errorMsg ? { x: [-10, 10, -6, 6, 0] } : {}}
              className="flex gap-4 my-3"
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = currentInputValue.length > index;
                return (
                  <motion.div
                    key={index}
                    animate={{
                      scale: isFilled ? 1.2 : 1,
                      borderColor: errorMsg
                        ? 'rgba(239, 68, 68, 0.9)'
                        : isFilled
                        ? 'rgba(99, 102, 241, 1)'
                        : 'rgba(255, 255, 255, 0.2)',
                      backgroundColor: errorMsg
                        ? 'rgba(239, 68, 68, 0.7)'
                        : isFilled
                        ? 'rgba(99, 102, 241, 1)'
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isFilled ? 'shadow-[0_0_8px_rgba(99,102,241,0.8)]' : ''
                    }`}
                  />
                );
              })}
            </motion.div>

            <div className="h-5 flex items-center justify-center mb-3">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-xs text-red-400 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
              {KEYPAD_NUMS.map((num) => (
                <motion.button
                  key={num}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDigit(num)}
                  className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-sm"
                >
                  {num}
                </motion.button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs text-gray-400"
              >
                ล้าง
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDigit('0')}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-sm"
              >
                0
              </motion.button>
              <button
                type="button"
                aria-label="ลบตัวเลขล่าสุด"
                onClick={handleDelete}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function ChangePinModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && <ChangePinModalContent key="pin-modal" onClose={onClose} />}
    </AnimatePresence>
  );
}
