import { create } from 'zustand';
import { flashcardsData } from '../data/vocabulary';
import { initialUserData } from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchCloudUserData, saveCloudUserData, subscribeToCloudChanges } from '../services/supabaseSync';

const DEFAULT_EXPENSE_CATEGORIES = ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'ความบันเทิง', 'สุขภาพ', 'บิล', 'อื่นๆ'];
const DEFAULT_INCOME_CATEGORIES = ['เงินเดือน/รายได้', 'ฟรีแลนซ์', 'ลงทุน', 'อื่นๆ'];

// ── PIN Hashing (PBKDF2) ─────────────────────────────────────
const PBKDF2_ITERATIONS = 100000;
const STATIC_SALT = new TextEncoder().encode('myfee_v2_secure_kdf_salt');

const hashPin = async (pin) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: STATIC_SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
};

const hashPinLegacy = async (pin) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'myfee_salt_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
// ── Habit Streak Calculator ──────────────────────────────────
const calculateStreak = (history) => {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => new Date(b) - new Date(a));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Must have done it today or yesterday for streak to count
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      console.error(`[Storage Full] Cannot persist key: ${key}. LocalStorage quota exceeded.`);
    }
  }
};

const DEFAULT_HABITS = [
  { id: 1, name: 'อ่านหนังสือ 15 นาที', icon: 'book', streak: 0, lastCompleted: null, routine: 'morning', history: [] },
  { id: 2, name: 'ออกกำลังกาย 20 นาที', icon: 'activity', streak: 0, lastCompleted: null, routine: 'afternoon', history: [] },
  { id: 3, name: 'นั่งสมาธิ 5 นาที', icon: 'brain', streak: 0, lastCompleted: null, routine: 'evening', history: [] },
];

const DEFAULT_FEATURE_ORDER = [
  'flashcard', 'todo', 'habit', 'finance', 'goals', 'notes', 
  'projects', 'pomodoro', 'countdown', 'breathing', 'quiz', 'code_reading', 'settings'
];

const applyCloudDataToStore = (set, get, cloudData) => {
  if (!cloudData) return;

  const state = get();
  if (cloudData.updatedAt && state.lastSyncedAt) {
    const cloudTime = new Date(cloudData.updatedAt).getTime();
    const localTime = new Date(state.lastSyncedAt).getTime();
    if (cloudTime <= localTime) return; // Prevent overwriting local active edits
  }

  const learnedCards = Array.isArray(cloudData.learnedCards) ? cloudData.learnedCards : [];
  const favCards = Array.isArray(cloudData.favCards) ? cloudData.favCards : [];
  const todos = Array.isArray(cloudData.todos) ? cloudData.todos : [];
  const habits = Array.isArray(cloudData.habits) ? cloudData.habits : [];
  const finance = Array.isArray(cloudData.finance) ? cloudData.finance : [];
  const expenseCategories = Array.isArray(cloudData.expenseCategories) ? cloudData.expenseCategories : DEFAULT_EXPENSE_CATEGORIES;
  const incomeCategories = Array.isArray(cloudData.incomeCategories) ? cloudData.incomeCategories : DEFAULT_INCOME_CATEGORIES;
  const currentLocalRecurring = loadFromStorage('recurringTransactions', []);
  const recurringTransactions = Array.isArray(cloudData.recurringTransactions) && cloudData.recurringTransactions.length > 0
    ? cloudData.recurringTransactions
    : (currentLocalRecurring.length > 0 ? currentLocalRecurring : []);
  const goals = Array.isArray(cloudData.goals) ? cloudData.goals : [];
  const notes = Array.isArray(cloudData.notes) ? cloudData.notes : [];
  const projects = Array.isArray(cloudData.projects) ? cloudData.projects : [];
  const countdowns = Array.isArray(cloudData.countdowns) ? cloudData.countdowns : [];
  const footballMatches = Array.isArray(cloudData.footballMatches) ? cloudData.footballMatches : [];
  const settings = cloudData.settings || { darkMode: true, autoPlay: true, dailyBudget: 0, monthlyBudget: 0 };
  const streak = cloudData.streak || { count: 0, lastDate: null, cardsFlippedToday: 0 };
  const codeReadingProgress = cloudData.codeReadingProgress || { mode: 'code', levelIndex: 0, questionIndex: 0 };
  const homeFeatureOrder = Array.isArray(cloudData.homeFeatureOrder) ? cloudData.homeFeatureOrder : DEFAULT_FEATURE_ORDER;

  saveToStorage('learnedCards', learnedCards);
  saveToStorage('favCards', favCards);
  saveToStorage('todoData', todos);
  saveToStorage('habitData', habits);
  saveToStorage('financeData', finance);
  saveToStorage('expenseCategories', expenseCategories);
  saveToStorage('incomeCategories', incomeCategories);
  saveToStorage('recurringTransactions', recurringTransactions);
  saveToStorage('goalsData', goals);
  saveToStorage('notesData', notes);
  saveToStorage('projectsData', projects);
  saveToStorage('countdownData', countdowns);
  saveToStorage('footballMatches', footballMatches);
  saveToStorage('appSettings', settings);
  saveToStorage('streakData', streak);
  saveToStorage('myfee_cr_progress', codeReadingProgress);
  saveToStorage('homeFeatureOrder', homeFeatureOrder);

  set({
    learnedCards,
    favCards,
    todos,
    habits,
    finance,
    expenseCategories,
    incomeCategories,
    recurringTransactions,
    goals,
    notes,
    projects,
    countdowns,
    footballMatches,
    settings,
    streak,
    codeReadingProgress,
    homeFeatureOrder,
    lastSyncedAt: new Date().toISOString(),
    cloudSyncError: null,
  });
};

let syncTimeout = null;
const debounceSyncToCloud = (get) => {
  const state = get();
  if (!isSupabaseConfigured()) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    state.pushStateToCloud();
  }, 600);
};

let cloudUnsubscribe = null;

const useStore = create((set, get) => ({
  // ── Supabase Cloud Sync (Single-User Mode / No Login) ─────────
  isSyncing: false,
  lastSyncedAt: null,
  cloudSyncError: null,
  isCloudConnected: isSupabaseConfigured(),

  initSync: async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    
    if (cloudUnsubscribe) {
      cloudUnsubscribe();
      cloudUnsubscribe = null;
    }
    
    // 1. Initial fetch from cloud
    await get().syncCloudData();

    // 2. Subscribe to realtime updates from phone/other devices
    cloudUnsubscribe = subscribeToCloudChanges((incomingData) => {
      applyCloudDataToStore(set, get, incomingData);
    });
  },

  syncCloudData: async () => {
    if (!isSupabaseConfigured()) return;

    set({ isSyncing: true, cloudSyncError: null });
    try {
      const { data: cloudData, error } = await fetchCloudUserData();
      if (error) {
        console.error('Fetch cloud data error:', error);
        set({ cloudSyncError: error.message });
      } else if (cloudData) {
        const state = get();
        const isCloudEmpty = 
          (!cloudData.learnedCards || cloudData.learnedCards.length === 0) &&
          (!cloudData.habits || cloudData.habits.length === 0) &&
          (!cloudData.todos || cloudData.todos.length === 0) &&
          (!cloudData.finance || cloudData.finance.length === 0) &&
          (!cloudData.notes || cloudData.notes.length === 0);

        const hasLocalData = 
          (state.learnedCards && state.learnedCards.length > 0) ||
          (state.habits && state.habits.length > 0) ||
          (state.todos && state.todos.length > 0) ||
          (state.finance && state.finance.length > 0) ||
          (state.notes && state.notes.length > 0) ||
          (state.recurringTransactions && state.recurringTransactions.length > 0);

        if (isCloudEmpty && hasLocalData) {
          // Cloud is newly initialized with empty data, preserve local data and push to cloud
          await state.pushStateToCloud();
        } else {
          // If cloud has data but its recurringTransactions is empty while local has items, preserve local and sync up
          if ((!cloudData.recurringTransactions || cloudData.recurringTransactions.length === 0) &&
              (state.recurringTransactions && state.recurringTransactions.length > 0)) {
            cloudData.recurringTransactions = state.recurringTransactions;
            applyCloudDataToStore(set, cloudData);
            await state.pushStateToCloud();
          } else {
            applyCloudDataToStore(set, cloudData);
          }
        }
      } else {
        // First time initialization on Supabase
        await get().pushStateToCloud();
      }
    } catch (err) {
      console.error('Sync cloud data exception:', err);
      set({ cloudSyncError: err.message });
    } finally {
      set({ isSyncing: false });
    }
  },

  pushStateToCloud: async () => {
    const state = get();
    if (!isSupabaseConfigured()) return;

    set({ isSyncing: true });
    try {
      const { success, error } = await saveCloudUserData(state);
      if (success) {
        set({ lastSyncedAt: new Date().toISOString(), cloudSyncError: null });
      } else if (error) {
        console.error('Push to cloud error:', error);
        set({ cloudSyncError: error.message });
      }
    } catch (err) {
      console.error('Push to cloud exception:', err);
      set({ cloudSyncError: err.message });
    } finally {
      set({ isSyncing: false });
    }
  },

  // ── Dashboard ──────────────────────────────────────────────
  homeFeatureOrder: loadFromStorage('homeFeatureOrder', DEFAULT_FEATURE_ORDER),
  setHomeFeatureOrder: (order) => {
    set({ homeFeatureOrder: order });
    saveToStorage('homeFeatureOrder', order);
    debounceSyncToCloud(get);
  },

  // ── Flashcards ──────────────────────────────────────────────
  vocabulary: flashcardsData,
  learnedCards: loadFromStorage('learnedCards', initialUserData.learnedCards),
  favCards: loadFromStorage('favCards', initialUserData.favCards),

  // Filters
  flashcardFilter: 'All',
  setFlashcardFilter: (filter) => set({ flashcardFilter: filter }),

  toggleLearned: (id) => {
    set((state) => {
      const next = state.learnedCards.includes(id)
        ? state.learnedCards.filter(c => c !== id)
        : [...state.learnedCards, id];
      saveToStorage('learnedCards', next);
      return { learnedCards: next };
    });
    debounceSyncToCloud(get);
  },

  markLearned: (wordId) => {
    set((state) => {
      const isLearned = state.learnedCards.includes(wordId);
      if (isLearned) return state;
      const next = [...state.learnedCards, wordId];
      saveToStorage('learnedCards', next);
      return { learnedCards: next };
    });
    debounceSyncToCloud(get);
  },

  toggleFav: (id) => {
    set((state) => {
      const next = state.favCards.includes(id)
        ? state.favCards.filter(c => c !== id)
        : [...state.favCards, id];
      saveToStorage('favCards', next);
      return { favCards: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Todo ─────────────────────────────────────────────────────
  todos: loadFromStorage('todoData', initialUserData.todoData),

  addTodo: (text) => {
    set((state) => {
      if (!text.trim()) return {};
      const newTodo = { id: Date.now(), text: text.trim(), completed: false, repeat: 'none', createdAt: new Date().toISOString() };
      const next = [newTodo, ...state.todos];
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  editTodo: (id, newText) => {
    set((state) => {
      if (!newText.trim()) return {};
      const next = state.todos.map(t => t.id === id ? { ...t, text: newText.trim() } : t);
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  toggleTodo: (id) => {
    set((state) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const next = state.todos.map(todo => {
        if (todo.id !== id) return todo;
        const isDaily = todo.repeat === 'daily' || todo.repeat === 'days';
        if (isDaily) {
          const isDoneToday = todo.lastCompletedDate === todayStr;
          return { ...todo, completed: !isDoneToday, lastCompletedDate: isDoneToday ? null : todayStr };
        }
        return { ...todo, completed: !todo.completed, lastCompletedDate: !todo.completed ? todayStr : null };
      });
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  deleteTodo: (id) => {
    set((state) => {
      const next = state.todos.filter(t => t.id !== id);
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Habits ───────────────────────────────────────────────────
  habits: loadFromStorage('habitData', initialUserData.habitData.length > 0 ? initialUserData.habitData : DEFAULT_HABITS),

  addHabit: (name, routine, icon) => {
    set((state) => {
      const habit = {
        id: Date.now(), name: name.trim(),
        icon: icon || 'zap', routine: routine || 'morning',
        streak: 0, history: [], lastCompleted: null
      };
      const next = [...state.habits, habit];
      saveToStorage('habitData', next);
      return { habits: next };
    });
    debounceSyncToCloud(get);
  },

  toggleHabit: (id) => {
    set((state) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const next = state.habits.map(h => {
        if (h.id !== id) return h;
        const history = h.history || [];
        const isDone = history.includes(todayStr);
        const newHistory = isDone ? history.filter(d => d !== todayStr) : [...history, todayStr];
        return {
          ...h,
          history: newHistory,
          streak: calculateStreak(newHistory),
          lastCompleted: isDone ? null : todayStr
        };
      });
      saveToStorage('habitData', next);
      return { habits: next };
    });
    debounceSyncToCloud(get);
  },

  deleteHabit: (id) => {
    set((state) => {
      const next = state.habits.filter(h => h.id !== id);
      saveToStorage('habitData', next);
      return { habits: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Finance ──────────────────────────────────────────────────
  finance: loadFromStorage('financeData', initialUserData.financeData),
  expenseCategories: loadFromStorage('expenseCategories', DEFAULT_EXPENSE_CATEGORIES),
  incomeCategories: loadFromStorage('incomeCategories', DEFAULT_INCOME_CATEGORIES),

  addCategory: (type, name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    let added = false;
    set((state) => {
      if (type === 'expense') {
        if (state.expenseCategories.includes(trimmed)) return {};
        const next = [...state.expenseCategories, trimmed];
        saveToStorage('expenseCategories', next);
        added = true;
        return { expenseCategories: next };
      } else {
        if (state.incomeCategories.includes(trimmed)) return {};
        const next = [...state.incomeCategories, trimmed];
        saveToStorage('incomeCategories', next);
        added = true;
        return { incomeCategories: next };
      }
    });
    if (added) debounceSyncToCloud(get);
    return added;
  },

  deleteCategory: (type, name) => {
    set((state) => {
      if (type === 'expense') {
        if (state.expenseCategories.length <= 1) return {};
        const next = state.expenseCategories.filter(c => c !== name);
        saveToStorage('expenseCategories', next);
        return { expenseCategories: next };
      } else {
        if (state.incomeCategories.length <= 1) return {};
        const next = state.incomeCategories.filter(c => c !== name);
        saveToStorage('incomeCategories', next);
        return { incomeCategories: next };
      }
    });
    debounceSyncToCloud(get);
  },

  addTransaction: (type, category, amount, note, dateStr) => {
    set((state) => {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return {};
      let finalDate;
      if (dateStr) {
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [y, m, d] = dateStr.split('-').map(Number);
          const now = new Date();
          finalDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
        } else {
          finalDate = new Date(dateStr).toISOString();
        }
      } else {
        finalDate = new Date().toISOString();
      }

      const tx = {
        id: Date.now(),
        type, category: category || 'ทั่วไป',
        amount: num, note: note || '',
        date: finalDate
      };
      const next = [tx, ...state.finance].sort((a, b) => new Date(b.date) - new Date(a.date));
      saveToStorage('financeData', next);
      return { finance: next };
    });
    debounceSyncToCloud(get);
  },

  editTransaction: (id, updates) => {
    set((state) => {
      const next = state.finance.map(t => {
        if (t.id !== id) return t;
        let newDate = t.date;
        if (updates.date !== undefined && updates.date) {
          if (typeof updates.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
            const [y, m, d] = updates.date.split('-').map(Number);
            const orig = new Date(t.date);
            newDate = new Date(y, m - 1, d, orig.getHours() || 12, orig.getMinutes() || 0, orig.getSeconds() || 0).toISOString();
          } else {
            newDate = new Date(updates.date).toISOString();
          }
        }
        return {
          ...t,
          ...(updates.amount !== undefined ? { amount: parseFloat(updates.amount) || t.amount } : {}),
          ...(updates.category !== undefined ? { category: updates.category } : {}),
          ...(updates.note !== undefined ? { note: updates.note } : {}),
          ...(updates.type !== undefined ? { type: updates.type } : {}),
          date: newDate,
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
      saveToStorage('financeData', next);
      return { finance: next };
    });
    debounceSyncToCloud(get);
  },

  deleteTransaction: (id) => {
    set((state) => {
      const next = state.finance.filter(t => t.id !== id);
      saveToStorage('financeData', next);
      return { finance: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Recurring Transactions ─────────────────────────────────
  recurringTransactions: loadFromStorage('recurringTransactions', []),

  addRecurringTransaction: (type, category, amount, note, dayOfMonth) => {
    set((state) => {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return {};
      const item = {
        id: Date.now(),
        type, category: category || 'ทั่วไป',
        amount: num, note: note || '',
        dayOfMonth: dayOfMonth || 1,
        isActive: true,
        lastProcessed: null,
      };
      const next = [item, ...state.recurringTransactions];
      saveToStorage('recurringTransactions', next);
      return { recurringTransactions: next };
    });
    debounceSyncToCloud(get);
  },

  deleteRecurringTransaction: (id) => {
    set((state) => {
      const next = state.recurringTransactions.filter(r => r.id !== id);
      saveToStorage('recurringTransactions', next);
      return { recurringTransactions: next };
    });
    debounceSyncToCloud(get);
  },

  toggleRecurringTransaction: (id) => {
    set((state) => {
      const next = state.recurringTransactions.map(r =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      );
      saveToStorage('recurringTransactions', next);
      return { recurringTransactions: next };
    });
    debounceSyncToCloud(get);
  },

  processRecurringTransactions: () => {
    const state = get();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let changed = false;

    state.recurringTransactions.forEach(r => {
      if (!r.isActive) return;
      if (r.lastProcessed === currentMonth) return;
      if (now.getDate() >= r.dayOfMonth) {
        // Add the transaction
        state.addTransaction(r.type, r.category, r.amount, `🔄 ${r.note || r.category} (รายการประจำ)`, null);
        changed = true;
      }
    });

    if (changed) {
      set((state) => {
        const next = state.recurringTransactions.map(r => {
          if (!r.isActive || r.lastProcessed === currentMonth) return r;
          if (now.getDate() >= r.dayOfMonth) {
            return { ...r, lastProcessed: currentMonth };
          }
          return r;
        });
        saveToStorage('recurringTransactions', next);
        return { recurringTransactions: next };
      });
      debounceSyncToCloud(get);
    }
  },

  // ── Goals ─────────────────────────────────────────────────────
  goals: loadFromStorage('goalsData', initialUserData.goalsData),

  addGoal: (name, target) => {
    set((state) => {
      const goal = { id: Date.now(), name: name.trim(), target: parseFloat(target), current: 0 };
      const next = [goal, ...state.goals];
      saveToStorage('goalsData', next);
      return { goals: next };
    });
    debounceSyncToCloud(get);
  },

  depositGoal: (id, amount) => {
    set((state) => {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return {};
      const next = state.goals.map(g => {
        if (g.id !== id) return g;
        return { ...g, current: Math.min(g.current + num, g.target) };
      });
      saveToStorage('goalsData', next);
      return { goals: next };
    });
    debounceSyncToCloud(get);
  },

  deleteGoal: (id) => {
    set((state) => {
      const next = state.goals.filter(g => g.id !== id);
      saveToStorage('goalsData', next);
      return { goals: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Notes ─────────────────────────────────────────────────────
  notes: loadFromStorage('notesData', initialUserData.notesData),

  addNote: (content, mood = 'neutral') => {
    set((state) => {
      const next = [{ id: Date.now(), content, mood, date: new Date().toISOString(), isPinned: false }, ...state.notes];
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  editNote: (id, newContent, newMood) => {
    set((state) => {
      const next = state.notes.map(n => 
        n.id === id ? { ...n, content: newContent !== undefined ? newContent : n.content, mood: newMood !== undefined ? newMood : n.mood } : n
      );
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  deleteNote: (id) => {
    set((state) => {
      const next = state.notes.filter(n => n.id !== id);
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  togglePinNote: (id) => {
    set((state) => {
      const next = state.notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Projects ──────────────────────────────────────────────────
  projects: loadFromStorage('projectsData', initialUserData.projectsData),

  addProject: (name, category, targetDate) => {
    set((state) => {
      const p = { id: Date.now(), name: name.trim(), category: category || 'ทั่วไป', status: 'in_progress', targetDate: targetDate || '', subtasks: [] };
      const next = [p, ...state.projects];
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  deleteProject: (id) => {
    set((state) => {
      const next = state.projects.filter(p => p.id !== id);
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  changeProjectStatus: (id, newStatus) => {
    set((state) => {
      const next = state.projects.map(p => p.id === id ? { ...p, status: newStatus } : p);
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  addSubtask: (projectId, text) => {
    set((state) => {
      const next = state.projects.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, subtasks: [...(p.subtasks || []), { id: Date.now(), text: text.trim(), completed: false }] };
      });
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  toggleSubtask: (projectId, subtaskId) => {
    set((state) => {
      const next = state.projects.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, subtasks: (p.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) };
      });
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Countdowns ────────────────────────────────────────────────
  countdowns: loadFromStorage('countdownData', initialUserData.countdownData),

  addCountdown: (name, dateStr) => {
    set((state) => {
      const item = { id: Date.now(), name: name.trim(), date: dateStr };
      const next = [...state.countdowns, item].sort((a, b) => new Date(a.date) - new Date(b.date));
      saveToStorage('countdownData', next);
      return { countdowns: next };
    });
    debounceSyncToCloud(get);
  },

  deleteCountdown: (id) => {
    set((state) => {
      const next = state.countdowns.filter(c => c.id !== id);
      saveToStorage('countdownData', next);
      return { countdowns: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Football Matches ──────────────────────────────────────────
  footballMatches: loadFromStorage('footballMatches', []),

  addFootballMatch: (dateStr, timeStr, opponent, competition, squad) => {
    set((state) => {
      // Use crypto.randomUUID for guaranteed unique IDs (no collision in rapid loops)
      const item = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        date: dateStr,
        time: timeStr || '',
        opponent: opponent.trim(),
        competition: competition || '',
        squad: squad || 'ชุดใหญ่',
        result: '', // "2-0", "1-1"
        status: 'upcoming' // 'upcoming', 'completed'
      };
      const next = [...state.footballMatches, item].sort((a, b) => new Date(a.date) - new Date(b.date));
      saveToStorage('footballMatches', next);
      return { footballMatches: next };
    });
    debounceSyncToCloud(get);
  },

  editFootballMatch: (id, updates) => {
    set((state) => {
      const next = state.footballMatches.map(m => m.id === id ? { ...m, ...updates } : m)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      saveToStorage('footballMatches', next);
      return { footballMatches: next };
    });
    debounceSyncToCloud(get);
  },

  deleteFootballMatch: (id) => {
    set((state) => {
      const next = state.footballMatches.filter(m => m.id !== id);
      saveToStorage('footballMatches', next);
      return { footballMatches: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Pomodoro Stats (persisted) ─────────────────────────────────
  pomodoroStats: loadFromStorage('pomodoroStats', { totalSessions: 0, todaySessions: 0, lastSessionDate: null }),

  addPomodoroSession: () => {
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const stats = { ...state.pomodoroStats };
      if (stats.lastSessionDate !== today) {
        stats.todaySessions = 0;
        stats.lastSessionDate = today;
      }
      stats.totalSessions++;
      stats.todaySessions++;
      saveToStorage('pomodoroStats', stats);
      return { pomodoroStats: stats };
    });
    debounceSyncToCloud(get);
  },

  // ── Settings & Streak ─────────────────────────────────────────
  settings: {
    ...initialUserData.appSettings,
    ...loadFromStorage('appSettings', initialUserData.appSettings)
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const next = { ...state.settings, ...newSettings };
      saveToStorage('appSettings', next);
      return { settings: next };
    });
    debounceSyncToCloud(get);
  },

  updatePinHash: async (newPin) => {
    const hashed = await hashPin(newPin);
    set((state) => {
      const next = { ...state.settings, pinCode: hashed, pinIsHashed: true, isPinEnabled: true };
      saveToStorage('appSettings', next);
      return { settings: next };
    });
    debounceSyncToCloud(get);
  },

  verifyPin: async (inputPin) => {
    const state = get();
    const stored = state.settings?.pinCode || '3804';
    const isHashed = state.settings?.pinIsHashed === true;
    
    if (isHashed) {
      const inputHash = await hashPin(inputPin);
      if (inputHash === stored) return true;
      
      const legacyHash = await hashPinLegacy(inputPin);
      if (legacyHash === stored) {
        state.updatePinHash(inputPin);
        return true;
      }
      
      return false;
    } else {
      // Legacy plain text — migrate to hashed on match
      if (inputPin === stored) {
        const hashed = await hashPin(inputPin);
        set((st) => {
          const next = { ...st.settings, pinCode: hashed, pinIsHashed: true };
          saveToStorage('appSettings', next);
          return { settings: next };
        });
        return true;
      }
      return false;
    }
  },

  streak: loadFromStorage('streakData', initialUserData.streakData),
  incrementCardsFlipped: () => {
    set((state) => {
      const today = new Date().toDateString();
      let nextStreak = { ...state.streak };
      if (nextStreak.lastActiveDate !== today) {
        nextStreak.cardsFlippedToday = 0;
        nextStreak.lastActiveDate = today;
      }
      if (nextStreak.lastDate !== today) {
        nextStreak.cardsFlippedToday++;
        if (nextStreak.cardsFlippedToday >= 10) {
          nextStreak.count++;
          nextStreak.lastDate = today;
        }
      }
      saveToStorage('streakData', nextStreak);
      return { streak: nextStreak };
    });
    debounceSyncToCloud(get);
  },
  checkStreak: () => set((state) => {
    const today = new Date().toDateString();
    let nextStreak = { ...state.streak };
    if (nextStreak.lastActiveDate !== today) {
      nextStreak.cardsFlippedToday = 0;
      nextStreak.lastActiveDate = today;
    }
    if (nextStreak.lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (nextStreak.lastDate !== yesterday.toDateString() && nextStreak.lastDate !== null) {
        nextStreak.count = 0; // Missed a day
      }
    }
    saveToStorage('streakData', nextStreak);
    return { streak: nextStreak };
  }),

  // ── Code Reading ──────────────────────────────────────────────
  codeReadingProgress: loadFromStorage('myfee_cr_progress', { mode: 'code', levelIndex: 0, questionIndex: 0 }),
  saveCodeReadingProgress: (progress) => {
    set((state) => {
      const next = { ...state.codeReadingProgress, ...progress };
      saveToStorage('myfee_cr_progress', next);
      return { codeReadingProgress: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Data Backup & Migration ───────────────────────────────────
  exportAllData: () => {
    const state = get();
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      learnedCards: state.learnedCards || [],
      favCards: state.favCards || [],
      todoData: state.todos || [],
      habitData: state.habits || [],
      financeData: state.finance || [],
      recurringTransactions: state.recurringTransactions || [],
      expenseCategories: state.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: state.incomeCategories || DEFAULT_INCOME_CATEGORIES,
      goalsData: state.goals || [],
      notesData: state.notes || [],
      projectsData: state.projects || [],
      countdownData: state.countdowns || [],
      footballMatches: state.footballMatches || [],
      appSettings: state.settings || { darkMode: true, autoPlay: true, dailyBudget: 0, monthlyBudget: 0 },
      streakData: state.streak || { count: 0, lastDate: null, cardsFlippedToday: 0 },
      myfee_cr_progress: state.codeReadingProgress || { mode: 'code', levelIndex: 0, questionIndex: 0 },
      homeFeatureOrder: state.homeFeatureOrder || DEFAULT_FEATURE_ORDER,
    };
  },

  importAllData: (data) => {
    const raw = (data && data.data) ? data.data : data;
    if (!raw || typeof raw !== 'object') return false;

    const todos = raw.todoData || raw.todos || [];
    const habits = raw.habitData || raw.habits || DEFAULT_HABITS;
    const finance = raw.financeData || raw.finance || [];
    const recurringTransactions = raw.recurringTransactions || raw.recurring_transactions || [];
    const learnedCards = raw.learnedCards || [];
    const favCards = raw.favCards || [];
    const expenseCategories = raw.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
    const incomeCategories = raw.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    const goals = raw.goalsData || raw.goals || [];
    const notes = raw.notesData || raw.notes || [];
    const projects = raw.projectsData || raw.projects || [];
    const countdowns = raw.countdownData || raw.countdowns || [];
    const footballMatches = raw.footballMatches || raw.football_matches || [];
    const settings = raw.appSettings || raw.settings || { darkMode: true, autoPlay: true, dailyBudget: 0, monthlyBudget: 0 };
    const streak = raw.streakData || raw.streak || { count: 0, lastDate: null, cardsFlippedToday: 0 };
    const codeReadingProgress = raw.myfee_cr_progress || raw.codeReadingProgress || { mode: 'code', levelIndex: 0, questionIndex: 0 };
    const homeFeatureOrder = raw.homeFeatureOrder || DEFAULT_FEATURE_ORDER;

    saveToStorage('learnedCards', learnedCards);
    saveToStorage('favCards', favCards);
    saveToStorage('todoData', todos);
    saveToStorage('habitData', habits);
    saveToStorage('financeData', finance);
    saveToStorage('recurringTransactions', recurringTransactions);
    saveToStorage('expenseCategories', expenseCategories);
    saveToStorage('incomeCategories', incomeCategories);
    saveToStorage('goalsData', goals);
    saveToStorage('notesData', notes);
    saveToStorage('projectsData', projects);
    saveToStorage('countdownData', countdowns);
    saveToStorage('footballMatches', footballMatches);
    saveToStorage('appSettings', settings);
    saveToStorage('streakData', streak);
    saveToStorage('myfee_cr_progress', codeReadingProgress);
    saveToStorage('homeFeatureOrder', homeFeatureOrder);

    set({
      learnedCards,
      favCards,
      todos,
      habits,
      finance,
      recurringTransactions,
      expenseCategories,
      incomeCategories,
      goals,
      notes,
      projects,
      countdowns,
      footballMatches,
      settings,
      streak,
      codeReadingProgress,
      homeFeatureOrder,
    });

    debounceSyncToCloud(get);
    return true;
  },
}));

export default useStore;
