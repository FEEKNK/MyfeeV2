import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_EXPENSE_CATEGORIES = ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'ความบันเทิง', 'สุขภาพ', 'บิล', 'อื่นๆ'];
const DEFAULT_INCOME_CATEGORIES = ['เงินเดือน/รายได้', 'ฟรีแลนซ์', 'ลงทุน', 'อื่นๆ'];

/**
 * Fetch all user sync data from Supabase
 */
export const fetchCloudUserData = async (userId) => {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { data: null, error: new Error('Supabase not configured or no user') };
  }

  try {
    const { data, error } = await supabase
      .from('user_sync_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { data: null, error: null };
    }

    const appSettings = data.app_settings || { darkMode: true, autoPlay: true, dailyBudget: 0, monthlyBudget: 0 };

    const parsed = {
      learnedCards: data.learned_cards || [],
      favCards: data.fav_cards || [],
      todos: data.todos || [],
      habits: data.habits || [],
      finance: data.finance || [],
      expenseCategories: appSettings.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: appSettings.incomeCategories || DEFAULT_INCOME_CATEGORIES,
      goals: data.goals || [],
      notes: data.notes || [],
      projects: data.projects || [],
      countdowns: data.countdowns || [],
      settings: appSettings,
      streak: data.streak_data || { count: 0, lastDate: null, cardsFlippedToday: 0 },
      codeReadingProgress: data.code_reading_progress || { mode: 'code', levelIndex: 0, questionIndex: 0 },
      updatedAt: data.updated_at,
    };

    return { data: parsed, error: null };
  } catch (err) {
    console.error('Error fetching cloud data:', err);
    return { data: null, error: err };
  }
};

/**
 * Save / Upsert user state into Supabase
 */
export const saveCloudUserData = async (userId, stateData, email = '') => {
  if (!isSupabaseConfigured() || !supabase || !userId) {
    return { success: false, error: new Error('Supabase not configured or no user') };
  }

  try {
    const payload = {
      user_id: userId,
      email: email || undefined,
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
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_sync_data')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Error saving cloud data:', err);
    return { success: false, error: err };
  }
};
