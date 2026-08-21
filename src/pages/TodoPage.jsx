import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { ArrowLeft, Plus, Trash2, Circle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TodoPage() {
  const navigate = useNavigate();
  const { todos, addTodo, toggleTodo, deleteTodo } = useStore();
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | done

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const doneCount = todos.filter(t => t.completed).length;

  const handleAdd = (e) => {
    e.preventDefault();
    addTodo(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}
          className="p-2.5 glass rounded-xl border border-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <h1 className="font-black text-white text-lg">To-Do List</h1>
          <p className="text-xs text-gray-400">{doneCount} / {todos.length} เสร็จแล้ว</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Add Input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="เพิ่มงานใหม่..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-colors"
        />
        <motion.button whileTap={{ scale: 0.9 }} type="submit"
          className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
          <Plus className="w-5 h-5" />
        </motion.button>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[['all','ทั้งหมด'],['active','ค้าง'],['done','เสร็จ']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${filter === val ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-500">
              <CheckCircle className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
              <p className="text-sm font-medium">ไม่มีงานค้าง จัดการครบแล้ว!</p>
            </motion.div>
          ) : filtered.map(todo => (
            <motion.div key={todo.id} layout
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 p-4 glass-dark rounded-2xl border border-white/10 group"
            >
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleTodo(todo.id)}>
                {todo.completed
                  ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                  : <Circle className="w-5 h-5 text-gray-500" />}
              </motion.button>
              <span className={`flex-1 text-sm font-medium transition-all ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                {todo.text}
              </span>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
