import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_EXPENSE_CATEGORIES = ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'ความบันเทิง', 'สุขภาพ', 'บิล', 'อื่นๆ'];
const DEFAULT_INCOME_CATEGORIES = ['เงินเดือน/รายได้', 'ฟรีแลนซ์', 'ลงทุน', 'อื่นๆ'];
const DEFAULT_FEATURE_ORDER = [
  'flashcard', 'todo', 'habit', 'finance', 'goals', 'notes', 
  'projects', 'pomodoro', 'countdown', 'breathing', 'quiz', 'code_reading', 'settings'
];

export const SINGLE_USER_ID = 'single_user';

/**
 * Helper to parse raw database record into store shape
 */
export const parseCloudData = (data) => {
  if (!data) return null;

  const appSettings = data.app_settings || {
    darkMode: true,
    autoPlay: true,
    dailyBudget: 0,
    monthlyBudget: 0,
    pinCode: '3804',
    isPinEnabled: true,
  };

  return {
    learnedCards: Array.isArray(data.learned_cards) ? data.learned_cards : [],
    favCards: Array.isArray(data.fav_cards) ? data.fav_cards : [],
    todos: Array.isArray(data.todos) ? data.todos : [],
    habits: Array.isArray(data.habits) ? data.habits : [],
    finance: Array.isArray(data.finance) ? data.finance : [],
    expenseCategories: Array.isArray(appSettings.expenseCategories) ? appSettings.expenseCategories : DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: Array.isArray(appSettings.incomeCategories) ? appSettings.incomeCategories : DEFAULT_INCOME_CATEGORIES,
    goals: Array.isArray(data.goals) ? data.goals : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    countdowns: Array.isArray(data.countdowns) ? data.countdowns : [],
    settings: appSettings,
    streak: data.streak_data || { count: 0, lastDate: null, cardsFlippedToday: 0 },
    codeReadingProgress: data.code_reading_progress || { mode: 'code', levelIndex: 0, questionIndex: 0 },
    homeFeatureOrder: Array.isArray(data.home_feature_order) ? data.home_feature_order : DEFAULT_FEATURE_ORDER,
    updatedAt: data.updated_at,
  };
};

/**
 * Fetch all sync data from Supabase (Single-User Mode / No Login)
 */
export const fetchCloudUserData = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    // 1. Try fetching from public app_sync_data
    const { data, error } = await supabase
      .from('app_sync_data')
      .select('*')
      .eq('id', SINGLE_USER_ID)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { data: null, error: null };
    }

    return { data: parseCloudData(data), error: null };
  } catch (err) {
    console.error('Error fetching cloud data:', err);
    return { data: null, error: err };
  }
};

/**
 * Save / Upsert user state into Supabase (Single-User Mode / No Login)
 */
export const saveCloudUserData = async (stateData) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: new Error('Supabase not configured') };
  }

  try {
    const payload = {
      id: SINGLE_USER_ID,
      learned_cards: stateData.learnedCards || [],
      fav_cards: stateData.favCards || [],
      todos: stateData.todos || [],
      habits: stateData.habits || [],
      finance: stateData.finance || [],
      goals: stateData.goals || [],
      notes: stateData.notes || [],
      projects: stateData.projects || [],
      countdowns: stateData.countdowns || [],
      app_settings: {
        ...(stateData.settings || { darkMode: true, autoPlay: true, dailyBudget: 0, monthlyBudget: 0 }),
        expenseCategories: stateData.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
        incomeCategories: stateData.incomeCategories || DEFAULT_INCOME_CATEGORIES,
      },
      streak_data: stateData.streak || { count: 0, lastDate: null, cardsFlippedToday: 0 },
      code_reading_progress: stateData.codeReadingProgress || { mode: 'code', levelIndex: 0, questionIndex: 0 },
      home_feature_order: stateData.homeFeatureOrder || DEFAULT_FEATURE_ORDER,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('app_sync_data')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Error saving cloud data:', err);
    return { success: false, error: err };
  }
};

/**
 * Subscribe to realtime updates from other devices (e.g. phone -> computer)
 */
export const subscribeToCloudChanges = (onUpdate) => {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:app_sync_data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_sync_data',
          filter: `id=eq.${SINGLE_USER_ID}`,
        },
        (payload) => {
          if (payload.new) {
            const parsed = parseCloudData(payload.new);
            if (parsed) {
              onUpdate(parsed);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Error subscribing to realtime changes:', err);
    return () => {};
  }
};
