import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { CheckCircle, Circle, ListTodo } from 'lucide-react';

const TodoWidget = () => {
  const { todos, toggleTodo } = useStore();

  // Filter uncompleted tasks and take top 3
  const activeTodos = todos
    .filter(t => !t.completed)
    .slice(0, 3);

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="w-full rounded-[2rem] p-6 glass-dark border border-white/10 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -inset-10 opacity-20 blur-[50px] rounded-full bg-emerald-500/20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Tasks</h3>
            <p className="text-[10px] text-gray-400 font-medium">
              {completedCount} / {totalCount} completed
            </p>
          </div>
        </div>
        
        {/* Tiny Circular Progress */}
        <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center relative">
           <svg className="absolute inset-0 w-full h-full -rotate-90">
             <circle 
               cx="14" cy="14" r="14" 
               fill="none" 
               stroke="rgba(52, 211, 153, 0.5)" 
               strokeWidth="2"
               strokeDasharray={`${(progress / 100) * 88} 88`} 
               className="transition-all duration-1000 ease-out"
             />
           </svg>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        <AnimatePresence>
          {activeTodos.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-sm text-gray-400 text-center py-4"
            >
              All caught up for today! 🎉
            </motion.p>
          ) : (
            activeTodos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => toggleTodo(todo.id)}
              >
                <motion.div whileTap={{ scale: 0.8 }}>
                  {todo.completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                </motion.div>
                <span className={`text-sm font-medium transition-all duration-300 ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {todo.text}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TodoWidget;
