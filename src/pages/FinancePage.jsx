import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import {
  ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Check, X, Calendar, Folder, Wallet,
  PieChart as PieChartIcon, BarChart3, Pencil, Repeat, Settings2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const FULL_THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'];

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function FinancePage() {
  const navigate = useNavigate();
  const {
    finance, expenseCategories, incomeCategories,
    addCategory, deleteCategory, addTransaction, deleteTransaction, editTransaction,
    recurringTransactions, processRecurringTransactions, addRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction
  } = useStore();

  const now = new Date();
  const [viewFilter, setViewFilter] = useState('thisMonth'); // 'thisMonth' | 'all' | 'charts' | 'recurring'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(expenseCategories[0] || 'อาหาร');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayStr());
  
  // Category management state
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Editing & Deleting states
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState(getTodayStr());

  // Recurring form
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recType, setRecType] = useState('expense');
  const [recCategory, setRecCategory] = useState(expenseCategories[0] || 'อาหาร');
  const [recAmount, setRecAmount] = useState('');
  const [recNote, setRecNote] = useState('');
  const [recDay, setRecDay] = useState('1');

  // Process recurring transactions on load
  useEffect(() => {
    processRecurringTransactions();
  }, [processRecurringTransactions]);

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const cur = new Date();
    setSelectedMonth(cur.getMonth());
    setSelectedYear(cur.getFullYear());
  };

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  // Filter lists
  const monthList = finance.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const displayedList = viewFilter === 'thisMonth' ? monthList : finance;

  // Summaries for selected month
  const income = monthList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const formatTxDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const todayStr = getTodayStr();
    const yesterdayStr = getYesterdayStr();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const txDateOnly = `${y}-${m}-${day}`;
    
    const thaiYear = y + 543;
    if (txDateOnly === todayStr) {
      return `วันนี้ (${d.getDate()} ${THAI_MONTHS[d.getMonth()]})`;
    }
    if (txDateOnly === yesterdayStr) {
      return `เมื่อวาน (${d.getDate()} ${THAI_MONTHS[d.getMonth()]})`;
    }
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${thaiYear}`;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) return;
    addTransaction(type, category, amount, note, date || getTodayStr());
    setAmount('');
    setNote('');
    setDate(getTodayStr());
    setShowForm(false);
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const added = addCategory(type, newCategoryName.trim());
    if (added) {
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategoryInput(false);
    }
  };

  const handleDeleteCategory = (catName, e) => {
    e.stopPropagation();
    deleteCategory(type, catName);
    if (category === catName) {
      const remaining = currentCategories.filter(c => c !== catName);
      if (remaining.length > 0) setCategory(remaining[0]);
    }
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) {
      deleteTransaction(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const startEdit = (tx) => {
    const d = new Date(tx.date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setEditingId(tx.id);
    setEditType(tx.type || 'expense');
    setEditAmount(tx.amount.toString());
    setEditNote(tx.note || '');
    setEditCategory(tx.category || '');
    setEditDate(`${y}-${m}-${day}`);
  };

  const saveEdit = () => {
    const num = parseFloat(editAmount);
    if (!editAmount || isNaN(num) || num <= 0) return;
    editTransaction(editingId, {
      type: editType,
      amount: editAmount,
      note: editNote,
      category: editCategory,
      date: editDate
    });
    setEditingId(null);
  };

  const handleAddRecurring = (e) => {
    e.preventDefault();
    const num = parseFloat(recAmount);
    const day = parseInt(recDay);
    if (!recAmount || isNaN(num) || num <= 0 || isNaN(day) || day < 1 || day > 31) return;
    addRecurringTransaction(recType, recCategory, num, recNote, day);
    setRecAmount(''); setRecNote(''); setShowRecurringForm(false);
  };

  const fmt = (n) => n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // ── Chart Data Calculation ───────────────────────────
  const getDonutData = () => {
    const expenses = monthList.filter(t => t.type === 'expense');
    if (expenses.length === 0) return [];
    
    const sums = {};
    expenses.forEach(t => sums[t.category] = (sums[t.category] || 0) + t.amount);
    
    return Object.entries(sums)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val], i) => ({ 
        cat, val, 
        pct: (val / (expense || 1)) * 100, 
        color: COLORS[i % COLORS.length] 
      }));
  };

  const getBarChartData = () => {
    const days = [];
    let maxVal = 0;
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const sum = finance
        .filter(t => {
          if (t.type !== 'expense') return false;
          const td = new Date(t.date);
          const tds = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}`;
          return tds === ds;
        })
        .reduce((s, t) => s + t.amount, 0);
      maxVal = Math.max(maxVal, sum);
      days.push({ day: d.getDate(), month: THAI_MONTHS[d.getMonth()], sum });
    }
    return { days, maxVal: maxVal || 1 }; // prevent div by zero
  };

  const renderDonutChart = () => {
    const data = getDonutData();
    if (data.length === 0) return <div className="text-gray-500 text-sm text-center py-8">ไม่มีข้อมูลรายจ่ายประจำเดือนนี้</div>;

    let cumulativePct = 0;
    return (
      <div className="flex items-center gap-6 p-4">
        <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
          {data.map((d) => {
            const strokeDasharray = `${d.pct} 100`;
            const strokeDashoffset = -cumulativePct;
            cumulativePct += d.pct;
            return (
              <circle key={d.cat} cx="50" cy="50" r="40" fill="transparent"
                stroke={d.color} strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500" />
            );
          })}
        </svg>
        <div className="flex-1 space-y-2">
          {data.slice(0, 4).map(d => (
            <div key={d.cat} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                {d.cat}
              </div>
              <div className="font-bold text-white dark-invert">฿{fmt(d.val)}</div>
            </div>
          ))}
          {data.length > 4 && <div className="text-xs text-gray-500 italic">และอื่นๆ...</div>}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const { days, maxVal } = getBarChartData();
    return (
      <div className="h-32 flex items-end justify-between gap-1 p-2">
        {days.map((d, i) => {
          const height = Math.max(5, (d.sum / maxVal) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-white/5 rounded-t-sm flex items-end overflow-hidden h-24">
                <motion.div 
                  initial={{ height: 0 }} animate={{ height: `${height}%` }}
                  className="w-full bg-pink-500/50 hover:bg-pink-400 transition-colors rounded-t-sm" 
                  title={`฿${fmt(d.sum)}`}
                />
              </div>
              <div className="text-[9px] text-gray-500 font-medium">{d.day}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full gap-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')} className="p-2.5 glass rounded-xl border border-white/10 text-white dark-invert">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="font-black text-white dark-invert text-lg">Finance</h1>
          <p className="text-xs text-gray-400">{finance.length} รายการทั้งหมด</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(!showForm)}
          className={`p-2.5 rounded-xl border transition-colors ${showForm ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' : 'glass border-white/10 text-white dark-invert'}`}>
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'thisMonth', icon: Calendar, label: 'รายเดือน' },
          { id: 'all', icon: Folder, label: 'ทั้งหมด' },
          { id: 'charts', icon: PieChartIcon, label: 'กราฟ' },
          { id: 'recurring', icon: Repeat, label: 'ประจำ' }
        ].map(t => (
          <button key={t.id} onClick={() => setViewFilter(t.id)}
            className={`flex-none px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              viewFilter === t.id ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Month Navigation for Month View */}
      {viewFilter === 'thisMonth' && (
        <div className="flex items-center justify-between px-3 py-2 glass-dark rounded-2xl border border-white/10">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white dark-invert text-sm">
              {FULL_THAI_MONTHS[selectedMonth]} {selectedYear + 543}
            </span>
            {!isCurrentMonth && (
              <button
                onClick={handleResetToCurrentMonth}
                className="text-[10px] font-bold bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-lg border border-pink-500/30 hover:bg-pink-500/30 transition-colors"
              >
                เดือนปัจจุบัน
              </button>
            )}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {(viewFilter === 'thisMonth' || viewFilter === 'charts') && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'รายรับ', val: income, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'รายจ่าย', val: expense, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'คงเหลือ', val: balance, color: balance >= 0 ? 'text-blue-400' : 'text-red-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className={`rounded-2xl p-3 border text-center ${bg}`}>
              <div className={`text-base font-black ${color}`}>฿{fmt(Math.abs(val || 0))}</div>
              <div className="text-[10px] text-gray-400 dark-invert mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleAdd} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => { setType('expense'); setCategory(expenseCategories[0] || 'อาหาร'); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex justify-center items-center gap-1.5 ${
                  type === 'expense' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'
                }`}>
                <TrendingDown className="w-4 h-4" /> รายจ่าย
              </button>
              <button type="button" onClick={() => { setType('income'); setCategory(incomeCategories[0] || 'เงินเดือน/รายได้'); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex justify-center items-center gap-1.5 ${
                  type === 'income' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400'
                }`}>
                <TrendingUp className="w-4 h-4" /> รายรับ
              </button>
            </div>

            {/* Date Picker with Quick Selectors */}
            <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-bold flex items-center gap-1.5 text-white dark-invert">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" /> วันที่ทำรายการ
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDate(getTodayStr())}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                      date === getTodayStr() ? 'bg-pink-500/30 text-pink-300 border border-pink-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(getYesterdayStr())}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                      date === getYesterdayStr() ? 'bg-pink-500/30 text-pink-300 border border-pink-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    เมื่อวาน
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white dark-invert text-sm outline-none focus:border-pink-500/50"
              />
            </div>
            
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">หมวดหมู่</span>
              <button type="button" onClick={() => setIsManagingCategories(!isManagingCategories)}
                className={`p-1.5 rounded-lg transition-colors ${isManagingCategories ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {currentCategories.map((c) => {
                const isSelected = category === c;
                return (
                  <button key={c} type="button" onClick={() => !isManagingCategories && setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      isSelected ? (type === 'expense' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400') : 'bg-white/5 border-white/10 text-gray-400'
                    }`}>
                    <span>{c}</span>
                    {isManagingCategories && (
                      <span onClick={(e) => handleDeleteCategory(c, e)} className="p-0.5 rounded-full bg-red-500/30 text-red-300 ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
              {isManagingCategories && (
                <button type="button" onClick={() => setShowAddCategoryInput(true)} className="px-3 py-1.5 rounded-full text-xs font-bold border bg-white/5 border-white/10 text-gray-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> เพิ่ม
                </button>
              )}
            </div>

            {showAddCategoryInput && isManagingCategories && (
              <div className="flex gap-2">
                <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white dark-invert text-sm outline-none" />
                <button type="button" onClick={handleCreateCategory} className="p-2 bg-pink-500/20 text-pink-400 rounded-xl">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            )}

            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="จำนวนเงิน (บาท)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white dark-invert text-sm outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (เช่น grab, ค่าเน็ต)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white dark-invert text-sm outline-none" />

            <motion.button whileTap={{ scale: 0.95 }} type="submit"
              className={`py-2.5 rounded-xl font-bold text-sm border ${type === 'expense' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>
              + บันทึก
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 space-y-2 pr-0.5">
        {viewFilter === 'charts' && (
          <div className="space-y-4">
            <div className="glass-dark border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <PieChartIcon className="w-3.5 h-3.5"/> สัดส่วนรายจ่าย ({FULL_THAI_MONTHS[selectedMonth]} {selectedYear + 543})
              </h3>
              {renderDonutChart()}
            </div>
            <div className="glass-dark border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5"/> รายจ่าย 7 วันล่าสุด</h3>
              {renderBarChart()}
            </div>
          </div>
        )}

        {viewFilter === 'recurring' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Repeat className="w-3.5 h-3.5"/> รายการประจำเดือน</h3>
              <button onClick={() => setShowRecurringForm(!showRecurringForm)} className="text-xs text-pink-400 bg-pink-500/20 px-2 py-1 rounded-lg">+ เพิ่มใหม่</button>
            </div>
            
            <AnimatePresence>
              {showRecurringForm && (
                <motion.form onSubmit={handleAddRecurring} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden glass-dark rounded-2xl border border-pink-500/30 p-4 flex flex-col gap-3">
                  <div className="text-xs text-gray-300 font-bold mb-1">สร้างรายการหัก/รับ อัตโนมัติทุกเดือน</div>
                  <select value={recType} onChange={e => { setRecType(e.target.value); setRecCategory(e.target.value === 'expense' ? expenseCategories[0] : incomeCategories[0]); }}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white dark-invert text-sm outline-none">
                    <option value="expense" className="text-black">รายจ่าย</option>
                    <option value="income" className="text-black">รายรับ</option>
                  </select>
                  <input value={recAmount} onChange={e => setRecAmount(e.target.value)} type="number" placeholder="จำนวนเงิน" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white dark-invert text-sm outline-none" />
                  <input value={recNote} onChange={e => setRecNote(e.target.value)} placeholder="รายละเอียด (เช่น ค่าเน็ต, ค่าห้อง)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white dark-invert text-sm outline-none" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">หักทุกวันที่:</span>
                    <input value={recDay} onChange={e => setRecDay(e.target.value)} type="number" min="1" max="31" className="w-16 bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-center text-white dark-invert text-sm outline-none" />
                  </div>
                  <button type="submit" className="mt-2 py-2 bg-pink-500/20 text-pink-400 font-bold rounded-xl border border-pink-500/30">บันทึกรายการประจำ</button>
                </motion.form>
              )}
            </AnimatePresence>

            {recurringTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">ยังไม่มีรายการประจำ</p>
              </div>
            ) : (
              recurringTransactions.map(r => (
                <div key={r.id} className={`flex items-center gap-3 p-3.5 glass-dark rounded-2xl border ${r.isActive ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
                  <button onClick={() => toggleRecurringTransaction(r.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.isActive ? (r.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400') : 'bg-gray-500/20 text-gray-400'}`}>
                    <Repeat className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white dark-invert text-sm truncate">{r.note || r.category}</div>
                    <div className="text-xs text-gray-400">หักวันที่ {r.dayOfMonth} ของทุกเดือน</div>
                  </div>
                  <div className={`font-black text-sm ${r.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {r.type === 'expense' ? '-' : '+'}฿{fmt(r.amount)}
                  </div>
                  <button onClick={() => deleteRecurringTransaction(r.id)} className="p-1.5 text-gray-500 hover:text-red-400 bg-white/5 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {(viewFilter === 'thisMonth' || viewFilter === 'all') && (
          <AnimatePresence>
            {displayedList.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
                <Wallet className="w-12 h-12 text-pink-400/40 mx-auto mb-3" />
                <p className="text-sm">ยังไม่มีรายการในเดือนนี้</p>
              </motion.div>
            ) : (
              displayedList.map((tx) => {
                const isEditing = editingId === tx.id;
                return (
                  <motion.div key={tx.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                    className="flex flex-col p-3.5 glass-dark rounded-2xl border border-white/10 group gap-2"
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2 p-1">
                        <div className="flex gap-2 items-center">
                          <select
                            value={editType}
                            onChange={(e) => {
                              const newT = e.target.value;
                              setEditType(newT);
                              const cats = newT === 'expense' ? expenseCategories : incomeCategories;
                              if (!cats.includes(editCategory)) {
                                setEditCategory(cats[0] || 'ทั่วไป');
                              }
                            }}
                            className="bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-white dark-invert text-xs outline-none"
                          >
                            <option value="expense" className="text-black">รายจ่าย</option>
                            <option value="income" className="text-black">รายรับ</option>
                          </select>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-white dark-invert text-xs outline-none"
                          >
                            {(editType === 'expense' ? expenseCategories : incomeCategories).map(c => (
                              <option key={c} value={c} className="text-black">{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-white dark-invert text-xs outline-none"
                          />
                          <input
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            type="number"
                            placeholder="จำนวนเงิน"
                            className="w-28 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-white dark-invert text-xs outline-none"
                          />
                        </div>

                        <input
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          placeholder="หมายเหตุ"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white dark-invert text-xs outline-none"
                        />

                        <div className="flex justify-end gap-2 pt-1">
                          <button onClick={saveEdit} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                            บันทึก
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/10 transition-colors">
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {tx.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white dark-invert text-sm truncate">{tx.category}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span>{formatTxDate(tx.date)}</span>
                            {tx.note && <span className="text-gray-500 truncate">· {tx.note}</span>}
                          </div>
                        </div>
                        <div className={`font-black text-sm ${tx.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {tx.type === 'expense' ? '-' : '+'}฿{fmt(tx.amount)}
                        </div>
                        <button onClick={() => startEdit(tx)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} 
                          className={`p-1.5 transition-all ${confirmDeleteId === tx.id ? 'text-red-400 bg-red-500/20 rounded-lg' : 'text-gray-500 hover:text-red-400'}`}>
                          {confirmDeleteId === tx.id ? <span className="text-[10px] font-bold">ยืนยัน</span> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
