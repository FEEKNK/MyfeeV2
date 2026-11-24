import { create } from 'zustand';
import { initialUserData } from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchCloudUserData, saveCloudUserData, subscribeToCloudChanges } from '../services/supabaseSync';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_FEATURE_ORDER,
  DEFAULT_HABITS,
  DAILY_STREAK_TARGET,
} from '../constants/appConstants';
import { generateId } from '../utils/idUtils';
import {
  getLocalDateKey,
  getYesterdayLocalDateKey,
  getDaysInMonth,
  normalizeToLocalDateKey,
} from '../utils/dateUtils';
import { clampNonNegativeNumber, fromSatang, toSatang, addMoney } from '../utils/moneyUtils';

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
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const hashPinLegacy = async (pin) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'myfee_salt_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// ── Habit Streak Calculator (Local Timezone) ─────────────────
const calculateStreak = (history) => {
  if (!Array.isArray(history) || history.length === 0) return 0;
  const uniqueDates = Array.from(
    new Set(history.map((h) => normalizeToLocalDateKey(h)).filter(Boolean))
  ).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  if (uniqueDates.length === 0) return 0;
  const today = getLocalDateKey();
  const yesterday = getYesterdayLocalDateKey();

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const [cy, cm, cd] = uniqueDates[i].split('-').map(Number);
    const [py, pm, pd] = uniqueDates[i + 1].split('-').map(Number);
    const curr = new Date(cy, cm - 1, cd);
    const prev = new Date(py, pm - 1, pd);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// ── LocalStorage Helpers ─────────────────────────────────────
const STORAGE_KEYS = [
  'learnedCards',
  'favCards',
  'learnedSentences',
  'favSentences',
  'sentenceLanguage',
  'todoData',
  'habitData',
  'financeData',
  'expenseCategories',
  'incomeCategories',
  'recurringTransactions',
  'goalsData',
  'notesData',
  'projectsData',
  'countdownData',
  'footballMatches',
  'appSettings',
  'streakData',
  'pomodoroStats',
  'myfee_cr_progress',
  'homeFeatureOrder',
  'myfee_pin_attempts',
  'myfee_pin_lock_until',
];

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

const isPlainObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const asValidArray = (value, predicate, fallback = []) => {
  if (!Array.isArray(value)) return fallback;
  return predicate ? value.filter(predicate) : value;
};

const applyCloudDataToStore = (set, get, cloudData) => {
  if (!cloudData) return;

  const state = get();
  if (cloudData.updatedAt && state.cloudVersionAt) {
    const cloudTime = new Date(cloudData.updatedAt).getTime();
    const localVersionTime = new Date(state.cloudVersionAt).getTime();
    if (Number.isFinite(cloudTime) && Number.isFinite(localVersionTime) && cloudTime <= localVersionTime) {
      return;
    }
  }

  const learnedCards = Array.isArray(cloudData.learnedCards) ? cloudData.learnedCards : [];
  const favCards = Array.isArray(cloudData.favCards) ? cloudData.favCards : [];
  const todos = Array.isArray(cloudData.todos) ? cloudData.todos : [];
  const habits = Array.isArray(cloudData.habits) ? cloudData.habits : [];
  const finance = Array.isArray(cloudData.finance) ? cloudData.finance : [];
  const expenseCategories = Array.isArray(cloudData.expenseCategories)
    ? cloudData.expenseCategories
    : DEFAULT_EXPENSE_CATEGORIES;
  const incomeCategories = Array.isArray(cloudData.incomeCategories)
    ? cloudData.incomeCategories
    : DEFAULT_INCOME_CATEGORIES;
  const currentLocalRecurring = loadFromStorage('recurringTransactions', []);
  const recurringTransactions =
    Array.isArray(cloudData.recurringTransactions) && cloudData.recurringTransactions.length > 0
      ? cloudData.recurringTransactions
      : (currentLocalRecurring.length > 0 ? currentLocalRecurring : []);
  const goals = Array.isArray(cloudData.goals) ? cloudData.goals : [];
  const notes = Array.isArray(cloudData.notes) ? cloudData.notes : [];
  const projects = Array.isArray(cloudData.projects) ? cloudData.projects : [];
  const countdowns = Array.isArray(cloudData.countdowns) ? cloudData.countdowns : [];
  const footballMatches = Array.isArray(cloudData.footballMatches) ? cloudData.footballMatches : [];
  const settings = cloudData.settings || initialUserData.appSettings;
  const streak = cloudData.streak || initialUserData.streakData;
  const pomodoroStats = cloudData.pomodoroStats || initialUserData.pomodoroStats;
  const codeReadingProgress = cloudData.codeReadingProgress || initialUserData.myfee_cr_progress;
  const homeFeatureOrder = Array.isArray(cloudData.homeFeatureOrder)
    ? cloudData.homeFeatureOrder
    : DEFAULT_FEATURE_ORDER;
  const learnedSentences = Array.isArray(cloudData.learnedSentences) ? cloudData.learnedSentences : [];
  const favSentences = Array.isArray(cloudData.favSentences) ? cloudData.favSentences : [];
  const sentenceLanguage = cloudData.sentenceLanguage || 'zh';

  saveToStorage('learnedCards', learnedCards);
  saveToStorage('favCards', favCards);
  saveToStorage('learnedSentences', learnedSentences);
  saveToStorage('favSentences', favSentences);
  saveToStorage('sentenceLanguage', sentenceLanguage);
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
  saveToStorage('pomodoroStats', pomodoroStats);
  saveToStorage('myfee_cr_progress', codeReadingProgress);
  saveToStorage('homeFeatureOrder', homeFeatureOrder);

  set({
    learnedCards,
    favCards,
    learnedSentences,
    favSentences,
    sentenceLanguage,
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
    pomodoroStats,
    codeReadingProgress,
    homeFeatureOrder,
    cloudVersionAt: cloudData.updatedAt || state.cloudVersionAt,
    lastSyncedAt: new Date().toISOString(),
    cloudSyncError: null,
  });
};

let syncTimeout = null;
const debounceSyncToCloud = (get) => {
  const state = get();
  if (!isSupabaseConfigured() || !state.user?.id) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    get().pushStateToCloud();
  }, 600);
};

let cloudUnsubscribe = null;
let authUnsubscribe = null;
let vocabPromise = null;

const useStore = create((set, get) => ({
  // ── Supabase Authentication & Cloud Sync ─────────────────────
  user: null,
  isSyncing: false,
  lastSyncedAt: null,
  cloudVersionAt: null,
  cloudSyncError: null,
  isCloudConnected: isSupabaseConfigured(),

  setUser: (user) => set({ user: user || null }),

  resetLocalSessionData: () => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
    if (cloudUnsubscribe) {
      cloudUnsubscribe();
      cloudUnsubscribe = null;
    }
    STORAGE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignore storage removal errors
      }
    });

    set({
      user: null,
      lastSyncedAt: null,
      cloudVersionAt: null,
      cloudSyncError: null,
      learnedCards: [],
      favCards: [],
      learnedSentences: [],
      favSentences: [],
      sentenceLanguage: 'zh',
      todos: [],
      habits: DEFAULT_HABITS,
      finance: [],
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      recurringTransactions: [],
      goals: [],
      notes: [],
      projects: [],
      countdowns: [],
      footballMatches: [],
      pomodoroStats: initialUserData.pomodoroStats,
      settings: initialUserData.appSettings,
      streak: initialUserData.streakData,
      codeReadingProgress: initialUserData.myfee_cr_progress,
      homeFeatureOrder: DEFAULT_FEATURE_ORDER,
    });
  },

  initSync: async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    if (!authUnsubscribe) {
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        const nextUser = session?.user || null;
        set({ user: nextUser });

        if (event === 'SIGNED_IN' && nextUser) {
          if (cloudUnsubscribe) {
            cloudUnsubscribe();
            cloudUnsubscribe = null;
          }
          get().syncCloudData();
          cloudUnsubscribe = subscribeToCloudChanges(nextUser.id, (incomingData) => {
            applyCloudDataToStore(set, get, incomingData);
          });
        } else if (event === 'SIGNED_OUT') {
          if (cloudUnsubscribe) {
            cloudUnsubscribe();
            cloudUnsubscribe = null;
          }
        }
      });
      authUnsubscribe = () => listener?.subscription?.unsubscribe();
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user || null;
    set({ user: currentUser });

    if (!currentUser) return;

    if (cloudUnsubscribe) {
      cloudUnsubscribe();
      cloudUnsubscribe = null;
    }

    await get().syncCloudData();

    cloudUnsubscribe = subscribeToCloudChanges(currentUser.id, (incomingData) => {
      applyCloudDataToStore(set, get, incomingData);
    });
  },

  syncCloudData: async () => {
    const userId = get().user?.id;
    if (!isSupabaseConfigured() || !userId) return;

    set({ isSyncing: true, cloudSyncError: null });
    try {
      const { data: cloudData, error } = await fetchCloudUserData(userId);
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
          set({ cloudVersionAt: cloudData.updatedAt || null });
          await get().pushStateToCloud();
        } else if (
          (!cloudData.recurringTransactions || cloudData.recurringTransactions.length === 0) &&
          (state.recurringTransactions && state.recurringTransactions.length > 0)
        ) {
          cloudData.recurringTransactions = state.recurringTransactions;
          applyCloudDataToStore(set, get, cloudData);
          await get().pushStateToCloud();
        } else {
          applyCloudDataToStore(set, get, cloudData);
        }
      } else {
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
    const userId = state.user?.id;
    if (!isSupabaseConfigured() || !userId) return;

    set({ isSyncing: true });
    try {
      const { success, conflict, updatedAt, error } = await saveCloudUserData(
        state,
        userId,
        state.cloudVersionAt
      );
      if (conflict) {
        // Re-fetch newer remote state instead of overwriting blind
        const { data: latest } = await fetchCloudUserData(userId);
        if (latest) {
          applyCloudDataToStore(set, get, latest);
        }
        return;
      }
      if (success) {
        set({
          cloudVersionAt: updatedAt || state.cloudVersionAt,
          lastSyncedAt: new Date().toISOString(),
          cloudSyncError: null,
        });
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

  // ── Flashcards (Lazy-loaded Vocabulary Chunk) ──────────────
  vocabulary: [],
  vocabularyLoaded: false,
  loadVocabulary: async () => {
    if (get().vocabularyLoaded) return get().vocabulary;
    if (!vocabPromise) {
      vocabPromise = import('../data/vocabulary').then((mod) => {
        const list = Array.isArray(mod.flashcardsData) ? mod.flashcardsData : [];
        set({ vocabulary: list, vocabularyLoaded: true });
        return list;
      });
    }
    return vocabPromise;
  },

  learnedCards: loadFromStorage('learnedCards', initialUserData.learnedCards),
  favCards: loadFromStorage('favCards', initialUserData.favCards),
  flashcardFilter: 'All',
  setFlashcardFilter: (filter) => set({ flashcardFilter: filter }),

  toggleLearned: (id) => {
    set((state) => {
      const next = state.learnedCards.includes(id)
        ? state.learnedCards.filter((c) => c !== id)
        : [...state.learnedCards, id];
      saveToStorage('learnedCards', next);
      return { learnedCards: next };
    });
    debounceSyncToCloud(get);
  },

  markLearned: (wordId) => {
    set((state) => {
      if (state.learnedCards.includes(wordId)) return state;
      const next = [...state.learnedCards, wordId];
      saveToStorage('learnedCards', next);
      return { learnedCards: next };
    });
    debounceSyncToCloud(get);
  },

  toggleFav: (id) => {
    set((state) => {
      const next = state.favCards.includes(id)
        ? state.favCards.filter((c) => c !== id)
        : [...state.favCards, id];
      saveToStorage('favCards', next);
      return { favCards: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Sentence Learning ───────────────────────────────────────
  sentenceLanguage: loadFromStorage('sentenceLanguage', 'zh'),
  learnedSentences: loadFromStorage('learnedSentences', []),
  favSentences: loadFromStorage('favSentences', []),
  sentenceCategory: 'all',

  setSentenceLanguage: (lang) => {
    set({ sentenceLanguage: lang });
    saveToStorage('sentenceLanguage', lang);
    debounceSyncToCloud(get);
  },

  setSentenceCategory: (category) => set({ sentenceCategory: category }),

  toggleLearnedSentence: (id) => {
    set((state) => {
      const next = state.learnedSentences.includes(id)
        ? state.learnedSentences.filter((sId) => sId !== id)
        : [...state.learnedSentences, id];
      saveToStorage('learnedSentences', next);
      return { learnedSentences: next };
    });
    debounceSyncToCloud(get);
  },

  toggleFavSentence: (id) => {
    set((state) => {
      const next = state.favSentences.includes(id)
        ? state.favSentences.filter((sId) => sId !== id)
        : [...state.favSentences, id];
      saveToStorage('favSentences', next);
      return { favSentences: next };
    });
    debounceSyncToCloud(get);
  },

  incrementSentencePractice: () => {
    const today = getLocalDateKey();
    set((state) => {
      const nextStreak = { ...state.streak };
      const lastActive = normalizeToLocalDateKey(nextStreak.lastActiveDate);
      const lastCompleted = normalizeToLocalDateKey(nextStreak.lastDate);
      if (lastActive !== today) {
        nextStreak.cardsFlippedToday = 0;
        nextStreak.lastActiveDate = today;
      }
      nextStreak.cardsFlippedToday = (nextStreak.cardsFlippedToday || 0) + 1;
      if (nextStreak.cardsFlippedToday >= DAILY_STREAK_TARGET && lastCompleted !== today) {
        nextStreak.count = (nextStreak.count || 0) + 1;
        nextStreak.lastDate = today;
      }
      saveToStorage('streakData', nextStreak);
      return { streak: nextStreak };
    });
    debounceSyncToCloud(get);
  },

  // ── Todo ─────────────────────────────────────────────────────
  todos: loadFromStorage('todoData', initialUserData.todoData),

  addTodo: (text) => {
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean) return;
    set((state) => {
      const newTodo = {
        id: generateId(),
        text: clean,
        completed: false,
        repeat: 'none',
        createdAt: new Date().toISOString(),
      };
      const next = [newTodo, ...state.todos];
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  editTodo: (id, newText) => {
    const clean = typeof newText === 'string' ? newText.trim() : '';
    if (!clean) return;
    set((state) => {
      const next = state.todos.map((t) => (t.id === id ? { ...t, text: clean } : t));
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  toggleTodo: (id) => {
    set((state) => {
      const todayStr = getLocalDateKey();
      const next = state.todos.map((todo) => {
        if (todo.id !== id) return todo;
        const isDaily = todo.repeat === 'daily' || todo.repeat === 'days';
        if (isDaily) {
          const isDoneToday = normalizeToLocalDateKey(todo.lastCompletedDate) === todayStr;
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
      const next = state.todos.filter((t) => t.id !== id);
      saveToStorage('todoData', next);
      return { todos: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Habits ───────────────────────────────────────────────────
  habits: loadFromStorage(
    'habitData',
    initialUserData.habitData.length > 0 ? initialUserData.habitData : DEFAULT_HABITS
  ),

  addHabit: (name, routine, icon) => {
    const clean = typeof name === 'string' ? name.trim() : '';
    if (!clean) return;
    set((state) => {
      const habit = {
        id: generateId(),
        name: clean,
        icon: icon || 'zap',
        routine: routine || 'morning',
        streak: 0,
        history: [],
        lastCompleted: null,
      };
      const next = [...state.habits, habit];
      saveToStorage('habitData', next);
      return { habits: next };
    });
    debounceSyncToCloud(get);
  },

  toggleHabit: (id) => {
    set((state) => {
      const todayStr = getLocalDateKey();
      const next = state.habits.map((h) => {
        if (h.id !== id) return h;
        const history = Array.isArray(h.history) ? h.history : [];
        const isDone = history.includes(todayStr);
        const newHistory = isDone ? history.filter((d) => d !== todayStr) : [...history, todayStr];
        return {
          ...h,
          history: newHistory,
          streak: calculateStreak(newHistory),
          lastCompleted: isDone ? null : todayStr,
        };
      });
      saveToStorage('habitData', next);
      return { habits: next };
    });
    debounceSyncToCloud(get);
  },

  deleteHabit: (id) => {
    set((state) => {
      const next = state.habits.filter((h) => h.id !== id);
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
    const trimmed = typeof name === 'string' ? name.trim() : '';
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
        const next = state.expenseCategories.filter((c) => c !== name);
        saveToStorage('expenseCategories', next);
        return { expenseCategories: next };
      } else {
        if (state.incomeCategories.length <= 1) return {};
        const next = state.incomeCategories.filter((c) => c !== name);
        saveToStorage('incomeCategories', next);
        return { incomeCategories: next };
      }
    });
    debounceSyncToCloud(get);
  },

  addTransaction: (type, category, amount, note, dateStr) => {
    const satang = toSatang(amount);
    if (satang <= 0) return;
    const cleanAmount = fromSatang(satang);

    let finalDate;
    if (dateStr) {
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const now = new Date();
        finalDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
      } else {
        const parsed = new Date(dateStr);
        finalDate = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      }
    } else {
      finalDate = new Date().toISOString();
    }

    set((state) => {
      const tx = {
        id: generateId(),
        type,
        category: category || 'ทั่วไป',
        amount: cleanAmount,
        note: typeof note === 'string' ? note.trim() : '',
        date: finalDate,
      };
      const next = [tx, ...state.finance].sort((a, b) => new Date(b.date) - new Date(a.date));
      saveToStorage('financeData', next);
      return { finance: next };
    });
    debounceSyncToCloud(get);
  },

  editTransaction: (id, updates) => {
    set((state) => {
      const next = state.finance
        .map((t) => {
          if (t.id !== id) return t;
          let newDate = t.date;
          if (updates.date) {
            if (typeof updates.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
              const [y, m, d] = updates.date.split('-').map(Number);
              const orig = new Date(t.date);
              newDate = new Date(
                y,
                m - 1,
                d,
                isNaN(orig.getTime()) ? 12 : orig.getHours(),
                isNaN(orig.getTime()) ? 0 : orig.getMinutes(),
                isNaN(orig.getTime()) ? 0 : orig.getSeconds()
              ).toISOString();
            } else {
              const parsed = new Date(updates.date);
              if (!isNaN(parsed.getTime())) newDate = parsed.toISOString();
            }
          }
          const updatedSatang = updates.amount !== undefined ? toSatang(updates.amount) : 0;
          const nextAmount = updatedSatang > 0 ? fromSatang(updatedSatang) : t.amount;
          return {
            ...t,
            amount: nextAmount,
            ...(updates.category !== undefined ? { category: updates.category } : {}),
            ...(updates.note !== undefined ? { note: String(updates.note) } : {}),
            ...(updates.type !== undefined ? { type: updates.type } : {}),
            date: newDate,
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      saveToStorage('financeData', next);
      return { finance: next };
    });
    debounceSyncToCloud(get);
  },

  deleteTransaction: (id) => {
    set((state) => {
      const next = state.finance.filter((t) => t.id !== id);
      saveToStorage('financeData', next);
      return { finance: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Recurring Transactions ─────────────────────────────────
  recurringTransactions: loadFromStorage('recurringTransactions', []),

  addRecurringTransaction: (type, category, amount, note, dayOfMonth) => {
    const satang = toSatang(amount);
    if (satang <= 0) return;
    const cleanDay = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));

    set((state) => {
      const item = {
        id: generateId(),
        type,
        category: category || 'ทั่วไป',
        amount: fromSatang(satang),
        note: typeof note === 'string' ? note.trim() : '',
        dayOfMonth: cleanDay,
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
      const next = state.recurringTransactions.filter((r) => r.id !== id);
      saveToStorage('recurringTransactions', next);
      return { recurringTransactions: next };
    });
    debounceSyncToCloud(get);
  },

  toggleRecurringTransaction: (id) => {
    set((state) => {
      const next = state.recurringTransactions.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      );
      saveToStorage('recurringTransactions', next);
      return { recurringTransactions: next };
    });
    debounceSyncToCloud(get);
  },

  processRecurringTransactions: () => {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const currentMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const daysInThisMonth = getDaysInMonth(year, monthIndex);

    let hasNewTx = false;
    set((state) => {
      const newTransactions = [];
      const nextRecurring = state.recurringTransactions.map((r) => {
        if (!r.isActive || r.lastProcessed === currentMonth) return r;
        const requestedDay = Math.max(1, Math.min(31, Number(r.dayOfMonth) || 1));
        const effectiveDay = Math.min(requestedDay, daysInThisMonth);

        if (now.getDate() >= effectiveDay) {
          hasNewTx = true;
          newTransactions.push({
            id: generateId(),
            type: r.type,
            category: r.category || 'ทั่วไป',
            amount: fromSatang(toSatang(r.amount)),
            note: `🔄 ${r.note || r.category} (รายการประจำ)`,
            date: new Date(year, monthIndex, effectiveDay, 9, 0, 0).toISOString(),
          });
          return { ...r, lastProcessed: currentMonth };
        }
        return r;
      });

      if (!hasNewTx) return {};

      const nextFinance = [...newTransactions, ...state.finance].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      saveToStorage('financeData', nextFinance);
      saveToStorage('recurringTransactions', nextRecurring);
      return { finance: nextFinance, recurringTransactions: nextRecurring };
    });

    if (hasNewTx) {
      debounceSyncToCloud(get);
    }
  },

  // ── Goals ─────────────────────────────────────────────────────
  goals: loadFromStorage('goalsData', initialUserData.goalsData),

  addGoal: (name, target) => {
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const satang = toSatang(target);
    if (!cleanName || satang <= 0) return;

    set((state) => {
      const goal = {
        id: generateId(),
        name: cleanName,
        target: fromSatang(satang),
        current: 0,
      };
      const next = [goal, ...state.goals];
      saveToStorage('goalsData', next);
      return { goals: next };
    });
    debounceSyncToCloud(get);
  },

  depositGoal: (id, amount) => {
    const satang = toSatang(amount);
    if (satang <= 0) return;
    const depositVal = fromSatang(satang);

    set((state) => {
      const next = state.goals.map((g) => {
        if (g.id !== id) return g;
        const nextCurrent = Math.min(addMoney(g.current, depositVal), Number(g.target) || 0);
        return { ...g, current: nextCurrent };
      });
      saveToStorage('goalsData', next);
      return { goals: next };
    });
    debounceSyncToCloud(get);
  },

  deleteGoal: (id) => {
    set((state) => {
      const next = state.goals.filter((g) => g.id !== id);
      saveToStorage('goalsData', next);
      return { goals: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Notes ─────────────────────────────────────────────────────
  notes: loadFromStorage('notesData', initialUserData.notesData),

  addNote: (content, mood = 'neutral') => {
    const clean = typeof content === 'string' ? content.trim() : '';
    if (!clean) return;
    set((state) => {
      const next = [
        { id: generateId(), content: clean, mood, date: new Date().toISOString(), isPinned: false },
        ...state.notes,
      ];
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  editNote: (id, newContent, newMood) => {
    set((state) => {
      const next = state.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              content: newContent !== undefined ? String(newContent) : n.content,
              mood: newMood !== undefined ? newMood : n.mood,
            }
          : n
      );
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  deleteNote: (id) => {
    set((state) => {
      const next = state.notes.filter((n) => n.id !== id);
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  togglePinNote: (id) => {
    set((state) => {
      const next = state.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
      saveToStorage('notesData', next);
      return { notes: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Projects ──────────────────────────────────────────────────
  projects: loadFromStorage('projectsData', initialUserData.projectsData),

  addProject: (name, category, targetDate) => {
    const clean = typeof name === 'string' ? name.trim() : '';
    if (!clean) return;
    set((state) => {
      const p = {
        id: generateId(),
        name: clean,
        category: category || 'ทั่วไป',
        status: 'in_progress',
        targetDate: targetDate || '',
        subtasks: [],
      };
      const next = [p, ...state.projects];
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  deleteProject: (id) => {
    set((state) => {
      const next = state.projects.filter((p) => p.id !== id);
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  changeProjectStatus: (id, newStatus) => {
    set((state) => {
      const next = state.projects.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  addSubtask: (projectId, text) => {
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean) return;
    set((state) => {
      const next = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          subtasks: [...(p.subtasks || []), { id: generateId(), text: clean, completed: false }],
        };
      });
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  toggleSubtask: (projectId, subtaskId) => {
    set((state) => {
      const next = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          subtasks: (p.subtasks || []).map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          ),
        };
      });
      saveToStorage('projectsData', next);
      return { projects: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Countdowns ────────────────────────────────────────────────
  countdowns: loadFromStorage('countdownData', initialUserData.countdownData),

  addCountdown: (name, dateStr) => {
    const clean = typeof name === 'string' ? name.trim() : '';
    if (!clean || !dateStr) return;
    set((state) => {
      const item = { id: generateId(), name: clean, date: dateStr };
      const next = [...state.countdowns, item].sort((a, b) => new Date(a.date) - new Date(b.date));
      saveToStorage('countdownData', next);
      return { countdowns: next };
    });
    debounceSyncToCloud(get);
  },

  deleteCountdown: (id) => {
    set((state) => {
      const next = state.countdowns.filter((c) => c.id !== id);
      saveToStorage('countdownData', next);
      return { countdowns: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Football Matches ──────────────────────────────────────────
  footballMatches: loadFromStorage('footballMatches', []),

  addFootballMatch: (dateStr, timeStr, opponent, competition, squad) => {
    const cleanOpponent = typeof opponent === 'string' ? opponent.trim() : '';
    if (!cleanOpponent || !dateStr) return;
    set((state) => {
      const item = {
        id: generateId(),
        date: dateStr,
        time: timeStr || '',
        opponent: cleanOpponent,
        competition: competition || '',
        squad: squad || 'ชุดใหญ่',
        result: '',
        status: 'upcoming',
      };
      const next = [...state.footballMatches, item].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      saveToStorage('footballMatches', next);
      return { footballMatches: next };
    });
    debounceSyncToCloud(get);
  },

  editFootballMatch: (id, updates) => {
    set((state) => {
      const next = state.footballMatches
        .map((m) => (m.id === id ? { ...m, ...updates } : m))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      saveToStorage('footballMatches', next);
      return { footballMatches: next };
    });
    debounceSyncToCloud(get);
  },

  deleteFootballMatch: (id) => {
    set((state) => {
      const next = state.footballMatches.filter((m) => m.id !== id);
      saveToStorage('footballMatches', next);
      return { footballMatches: next };
    });
    debounceSyncToCloud(get);
  },

  // ── Pomodoro Stats (persisted & synced) ───────────────────────
  pomodoroStats: loadFromStorage('pomodoroStats', initialUserData.pomodoroStats),

  addPomodoroSession: () => {
    set((state) => {
      const today = getLocalDateKey();
      const stats = { ...state.pomodoroStats };
      if (normalizeToLocalDateKey(stats.lastSessionDate) !== today) {
        stats.todaySessions = 0;
        stats.lastSessionDate = today;
      }
      stats.totalSessions = (stats.totalSessions || 0) + 1;
      stats.todaySessions = (stats.todaySessions || 0) + 1;
      saveToStorage('pomodoroStats', stats);
      return { pomodoroStats: stats };
    });
    debounceSyncToCloud(get);
  },

  // ── Settings & Streak ─────────────────────────────────────────
  settings: {
    ...initialUserData.appSettings,
    ...loadFromStorage('appSettings', initialUserData.appSettings),
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const sanitized = { ...newSettings };
      if (sanitized.dailyBudget !== undefined) {
        sanitized.dailyBudget = clampNonNegativeNumber(sanitized.dailyBudget);
      }
      if (sanitized.monthlyBudget !== undefined) {
        sanitized.monthlyBudget = clampNonNegativeNumber(sanitized.monthlyBudget);
      }
      const next = { ...state.settings, ...sanitized };
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
    if (typeof inputPin !== 'string' || !/^\d{4}$/.test(inputPin)) return false;
    const state = get();
    const stored = state.settings?.pinCode;
    if (!stored || typeof stored !== 'string') {
      return false; // Fail-Closed: never fall back to a hardcoded default PIN
    }

    if (state.settings?.pinIsHashed === true) {
      const inputHash = await hashPin(inputPin);
      if (inputHash === stored) return true;

      const legacyHash = await hashPinLegacy(inputPin);
      if (legacyHash === stored) {
        await state.updatePinHash(inputPin);
        return true;
      }
      return false;
    }

    // Legacy plain text migration only when stored value exists
    if (inputPin === stored) {
      await state.updatePinHash(inputPin);
      return true;
    }
    return false;
  },

  streak: loadFromStorage('streakData', initialUserData.streakData),

  incrementCardsFlipped: () => {
    set((state) => {
      const today = getLocalDateKey();
      const nextStreak = { ...state.streak };
      const lastActive = normalizeToLocalDateKey(nextStreak.lastActiveDate);
      const lastCompleted = normalizeToLocalDateKey(nextStreak.lastDate);
      if (lastActive !== today) {
        nextStreak.cardsFlippedToday = 0;
        nextStreak.lastActiveDate = today;
      }
      nextStreak.cardsFlippedToday = (nextStreak.cardsFlippedToday || 0) + 1;
      if (nextStreak.cardsFlippedToday >= DAILY_STREAK_TARGET && lastCompleted !== today) {
        nextStreak.count = (nextStreak.count || 0) + 1;
        nextStreak.lastDate = today;
      }
      saveToStorage('streakData', nextStreak);
      return { streak: nextStreak };
    });
    debounceSyncToCloud(get);
  },

  checkStreak: () =>
    set((state) => {
      const today = getLocalDateKey();
      const yesterday = getYesterdayLocalDateKey();
      const nextStreak = { ...state.streak };
      const lastActive = normalizeToLocalDateKey(nextStreak.lastActiveDate);
      const lastCompleted = normalizeToLocalDateKey(nextStreak.lastDate);

      if (lastActive !== today) {
        nextStreak.cardsFlippedToday = 0;
        nextStreak.lastActiveDate = today;
      }
      if (lastCompleted !== today && lastCompleted !== yesterday && lastCompleted !== null) {
        nextStreak.count = 0;
      }
      saveToStorage('streakData', nextStreak);
      return { streak: nextStreak };
    }),

  // ── Code Reading ──────────────────────────────────────────────
  codeReadingProgress: loadFromStorage('myfee_cr_progress', initialUserData.myfee_cr_progress),
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
      learnedSentences: state.learnedSentences || [],
      favSentences: state.favSentences || [],
      sentenceLanguage: state.sentenceLanguage || 'zh',
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
      pomodoroStats: state.pomodoroStats || initialUserData.pomodoroStats,
      appSettings: state.settings || initialUserData.appSettings,
      streakData: state.streak || initialUserData.streakData,
      myfee_cr_progress: state.codeReadingProgress || initialUserData.myfee_cr_progress,
      homeFeatureOrder: state.homeFeatureOrder || DEFAULT_FEATURE_ORDER,
    };
  },

  importAllData: (data) => {
    const raw = isPlainObject(data) && isPlainObject(data.data) ? data.data : data;
    if (!isPlainObject(raw)) return false;

    const todos = asValidArray(raw.todoData ?? raw.todos, (t) => isPlainObject(t) && typeof t.text === 'string');
    const habits = asValidArray(raw.habitData ?? raw.habits, (h) => isPlainObject(h) && typeof h.name === 'string', DEFAULT_HABITS);
    const finance = asValidArray(
      raw.financeData ?? raw.finance,
      (tx) => isPlainObject(tx) && Number.isFinite(Number(tx.amount)) && Number(tx.amount) > 0
    );
    const recurringTransactions = asValidArray(
      raw.recurringTransactions ?? raw.recurring_transactions,
      (r) => isPlainObject(r) && Number.isFinite(Number(r.amount)) && Number(r.amount) > 0
    );
    const learnedCards = asValidArray(raw.learnedCards, (id) => typeof id === 'number' || typeof id === 'string');
    const favCards = asValidArray(raw.favCards, (id) => typeof id === 'number' || typeof id === 'string');
    const learnedSentences = asValidArray(raw.learnedSentences, (id) => typeof id === 'string' || typeof id === 'number');
    const favSentences = asValidArray(raw.favSentences, (id) => typeof id === 'string' || typeof id === 'number');
    const sentenceLanguage = raw.sentenceLanguage === 'en' ? 'en' : 'zh';
    const expenseCategories = asValidArray(
      raw.expenseCategories,
      (c) => typeof c === 'string' && c.trim().length > 0,
      DEFAULT_EXPENSE_CATEGORIES
    );
    const incomeCategories = asValidArray(
      raw.incomeCategories,
      (c) => typeof c === 'string' && c.trim().length > 0,
      DEFAULT_INCOME_CATEGORIES
    );
    const goals = asValidArray(
      raw.goalsData ?? raw.goals,
      (g) => isPlainObject(g) && typeof g.name === 'string' && Number.isFinite(Number(g.target))
    );
    const notes = asValidArray(raw.notesData ?? raw.notes, (n) => isPlainObject(n) && typeof n.content === 'string');
    const projects = asValidArray(raw.projectsData ?? raw.projects, (p) => isPlainObject(p) && typeof p.name === 'string');
    const countdowns = asValidArray(
      raw.countdownData ?? raw.countdowns,
      (c) => isPlainObject(c) && typeof c.name === 'string' && typeof c.date === 'string'
    );
    const footballMatches = asValidArray(
      raw.footballMatches ?? raw.football_matches,
      (m) => isPlainObject(m) && typeof m.opponent === 'string' && typeof m.date === 'string'
    );
    const rawSettings = isPlainObject(raw.appSettings ?? raw.settings) ? (raw.appSettings ?? raw.settings) : {};
    const settings = {
      ...initialUserData.appSettings,
      ...rawSettings,
      dailyBudget: clampNonNegativeNumber(rawSettings.dailyBudget),
      monthlyBudget: clampNonNegativeNumber(rawSettings.monthlyBudget),
      isPinEnabled: Boolean(rawSettings.isPinEnabled && rawSettings.pinCode),
    };
    const streak = isPlainObject(raw.streakData ?? raw.streak)
      ? (raw.streakData ?? raw.streak)
      : initialUserData.streakData;
    const pomodoroStats = isPlainObject(raw.pomodoroStats)
      ? raw.pomodoroStats
      : initialUserData.pomodoroStats;
    const codeReadingProgress = isPlainObject(raw.myfee_cr_progress ?? raw.codeReadingProgress)
      ? (raw.myfee_cr_progress ?? raw.codeReadingProgress)
      : initialUserData.myfee_cr_progress;
    const homeFeatureOrder = asValidArray(
      raw.homeFeatureOrder,
      (id) => typeof id === 'string',
      DEFAULT_FEATURE_ORDER
    );

    saveToStorage('learnedCards', learnedCards);
    saveToStorage('favCards', favCards);
    saveToStorage('learnedSentences', learnedSentences);
    saveToStorage('favSentences', favSentences);
    saveToStorage('sentenceLanguage', sentenceLanguage);
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
    saveToStorage('pomodoroStats', pomodoroStats);
    saveToStorage('myfee_cr_progress', codeReadingProgress);
    saveToStorage('homeFeatureOrder', homeFeatureOrder);

    set({
      learnedCards,
      favCards,
      learnedSentences,
      favSentences,
      sentenceLanguage,
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
      pomodoroStats,
      codeReadingProgress,
      homeFeatureOrder,
    });

    debounceSyncToCloud(get);
    return true;
  },
}));

export default useStore;
