import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, RefreshCw, CalendarDays, History, CalendarRange } from 'lucide-react';
import { analyzeSpending } from '../services/geminiService';
import { FULL_THAI_MONTHS } from '../constants/appConstants';

const renderInlineBold = (lineText) => {
  const parts = lineText.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

const renderFormattedText = (text) => {
  if (typeof text !== 'string' || !text) return null;

  return text.split('\n').map((line, i) => {
    if (line.trim() === '') {
      return <br key={i} />;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={i} className="ml-4 list-disc my-1">
          {renderInlineBold(line.slice(2))}
        </li>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      return (
        <div key={i} className="my-2 font-medium">
          {renderInlineBold(line)}
        </div>
      );
    }
    return (
      <p key={i} className="my-1">
        {renderInlineBold(line)}
      </p>
    );
  });
};

export default function AiAnalysisModal({ isOpen, onClose, financeData, selectedMonth, selectedYear }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('month'); // 'month' | 'past3months' | 'year'
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClose = useCallback(() => {
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    Promise.resolve().then(() => {
      if (!isCancelled) {
        setLoading(true);
        setError(null);
        setResult(null);
      }
    });

    analyzeSpending(financeData, selectedMonth, selectedYear, range)
      .then((analysisResult) => {
        if (!isCancelled) {
          setResult(analysisResult);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, range, financeData, selectedMonth, selectedYear, refreshKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-analysis-modal-title"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-4 top-[8%] bottom-[8%] z-[101] max-w-md mx-auto flex flex-col"
          >
            <div className="flex-1 glass-dark rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-pink-500/10 to-purple-500/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="ai-analysis-modal-title" className="font-black text-white text-lg">AI วิเคราะห์</h2>
                    <p className="text-[10px] text-pink-300 font-bold uppercase tracking-widest">
                      ที่ปรึกษาการเงินส่วนตัว
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="ปิดหน้าต่างวิเคราะห์ AI"
                  onClick={handleClose}
                  className="p-2 glass rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Range Tabs */}
              <div className="flex p-3 gap-2 border-b border-white/10 shrink-0 bg-black/20 overflow-x-auto no-scrollbar">
                {[
                  { id: 'month', label: `เดือน${FULL_THAI_MONTHS[selectedMonth]}`, icon: CalendarDays },
                  { id: 'past3months', label: '3 เดือนย้อนหลัง', icon: History },
                  { id: 'year', label: `รายปี (${selectedYear + 543})`, icon: CalendarRange },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (range !== tab.id && !loading) {
                        setRange(tab.id);
                      }
                    }}
                    disabled={loading}
                    className={`flex-none px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      range === tab.id
                        ? 'bg-pink-500/20 border-pink-500/30 text-pink-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 disabled:opacity-50'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 bg-black/40 backdrop-blur-sm z-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-16 h-16 rounded-full border-4 border-white/10 border-t-pink-500"
                    />
                    <div className="space-y-1">
                      <p className="font-bold text-white text-lg">กำลังวิเคราะห์ข้อมูล...</p>
                      <p className="text-xs text-gray-400">Gemini กำลังประมวลผลข้อมูลของคุณ</p>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-red-400 mb-2">ไม่สามารถวิเคราะห์ได้</p>
                      <p className="text-sm text-gray-400">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="mt-4 px-6 py-2.5 glass-dark border border-white/10 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-white/5 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> ลองใหม่
                    </button>
                  </div>
                ) : result ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-white text-sm leading-relaxed space-y-2 pb-6 ${loading ? 'opacity-30' : ''}`}
                  >
                    {renderFormattedText(result)}
                  </motion.div>
                ) : null}
              </div>

              {/* Footer */}
              {!error && result && (
                <div className="p-4 border-t border-white/10 shrink-0 flex justify-between items-center bg-black/20">
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Powered by Gemini
                  </div>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold flex items-center gap-1.5 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> วิเคราะห์ใหม่
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
