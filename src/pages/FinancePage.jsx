import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Settings2, Check, X, Calendar, Folder, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function FinancePage() {
  const navigate = useNavigate();
  const {
    finance,
    expenseCategories,
    incomeCategories,
    addCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction,
    settings,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(expenseCategories[0] || 'อาหาร');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [viewFilter, setViewFilter] = useState('thisMonth'); // 'thisMonth' | 'all'

  // Category management state
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const now = new Date();
  const displayedList = viewFilter === 'thisMonth'
    ? finance.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
    : finance;

  const income = displayedList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = displayedList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const handleAdd = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) return;
    addTransaction(type, category, amount, note, null);
    setAmount('');
    setNote('');
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
      if (remaining.length > 0) {
        setCategory(remaining[0]);
      }
    }
  };

  const fmt = (n) => n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="font-black text-white text-lg">Finance</h1>
          <p className="text-xs text-gray-400">{finance.length} รายการทั้งหมด</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(!showForm)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showForm
              ? 'bg-pink-500/20 border-pink-500/30 text-pink-400'
              : 'glass border-white/10 text-white'
          }`}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'รายรับ', val: income, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'รายจ่าย', val: expense, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'คงเหลือ', val: balance, color: balance >= 0 ? 'text-blue-400' : 'text-red-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`rounded-2xl p-3 border text-center ${bg}`}>
            <div className={`text-base font-black ${color}`}>฿{fmt(Math.abs(val || 0))}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Budget Progress */}
      {settings?.monthlyBudget > 0 && viewFilter === 'thisMonth' && (
        <div className="glass-dark rounded-2xl border border-white/10 p-3">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-gray-400 font-bold">งบประมาณเดือนนี้</span>
            <span className={expense > settings.monthlyBudget ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
              ฿{fmt(expense)} / ฿{fmt(settings.monthlyBudget)}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${expense > settings.monthlyBudget ? 'bg-red-500' : 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (expense / settings.monthlyBudget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewFilter('thisMonth')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            viewFilter === 'thisMonth'
              ? 'bg-pink-500/20 border-pink-500/30 text-pink-400'
              : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>เดือนนี้ ({THAI_MONTHS[now.getMonth()]})</span>
        </button>
        <button
          onClick={() => setViewFilter('all')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            viewFilter === 'all'
              ? 'bg-pink-500/20 border-pink-500/30 text-pink-400'
              : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>ทั้งหมด ({finance.length})</span>
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleAdd}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden glass-dark rounded-2xl border border-white/10 p-4 flex flex-col gap-3"
          >
            {/* Type Toggle */}
            <div className="flex gap-2">
              {[
                ['expense', 'รายจ่าย', 'bg-red-500/20 border-red-500/30 text-red-400'],
                ['income', 'รายรับ', 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'],
              ].map(([val, label, cls]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setType(val);
                    const cats = val === 'expense' ? expenseCategories : incomeCategories;
                    setCategory(cats[0] || (val === 'expense' ? 'อาหาร' : 'เงินเดือน/รายได้'));
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    type === val ? cls : 'bg-white/5 border-white/10 text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category Header & Management Controls */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                หมวดหมู่ {type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsManagingCategories(!isManagingCategories)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                    isManagingCategories
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Settings2 className="w-3 h-3" />
                  {isManagingCategories ? 'เสร็จสิ้น' : 'จัดการ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-500/30 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  เพิ่มหมวดหมู่
                </button>
              </div>
            </div>

            {/* Add Custom Category Inline Form */}
            <AnimatePresence>
              {showAddCategoryInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-2 items-center"
                >
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="ชื่อหมวดหมู่ใหม่ (เช่น ค่ากาแฟ, ขายของ)..."
                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(false)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category List Pills */}
            <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto pr-0.5">
              {currentCategories.map((c) => {
                const isSelected = category === c;
                const activeColor =
                  type === 'expense'
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';

                return (
                  <div key={c} className="relative group">
                    <button
                      type="button"
                      onClick={() => !isManagingCategories && setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                        isSelected ? activeColor : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span>{c}</span>
                      {/* Delete button in management mode */}
                      {isManagingCategories && (
                        <span
                          onClick={(e) => handleDeleteCategory(c, e)}
                          className="p-0.5 rounded-full bg-red-500/30 text-red-300 hover:bg-red-500 hover:text-white transition-colors cursor-pointer ml-0.5"
                          title={`ลบหมวดหมู่ ${c}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              placeholder="จำนวนเงิน (บาท)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-pink-500/50"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุ (เช่น grab, ค่าเน็ต)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none"
            />

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className={`py-2.5 rounded-xl font-bold text-sm border ${
                type === 'expense'
                  ? 'bg-red-500/20 border-red-500/30 text-red-400'
                  : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}
            >
              + บันทึก
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {displayedList.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
              <Wallet className="w-12 h-12 text-pink-400/40 mx-auto mb-3" />
              <p className="text-sm">ยังไม่มีรายการ</p>
            </motion.div>
          ) : (
            displayedList.map((tx) => {
              const d = new Date(tx.date);
              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="flex items-center gap-3 p-3.5 glass-dark rounded-2xl border border-white/10 group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {tx.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{tx.category}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span>{d.getDate()} {THAI_MONTHS[d.getMonth()]}</span>
                      {tx.note && <span className="text-gray-500">· {tx.note}</span>}
                    </div>
                  </div>
                  <div className={`font-black text-sm ${tx.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {tx.type === 'expense' ? '-' : '+'}฿{fmt(tx.amount)}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => deleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
