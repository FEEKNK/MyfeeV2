import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_FEATURE_ORDER,
} from '../constants/appConstants';

const DEFAULT_POMODORO_STATS = { totalSessions: 0, todaySessions: 0, lastSessionDate: null };

/**
 * Helper to parse raw database record into store shape.
 */
export const parseCloudData = (data) => {
  if (!data) return null;

  const rawSettings = data.app_settings || {};
  const appSettings = {
    darkMode: rawSettings.darkMode !== undefined ? Boolean(rawSettings.darkMode) : true,
    autoPlay: rawSettings.autoPlay !== undefined ? Boolean(rawSettings.autoPlay) : true,
    dailyBudget: Number.isFinite(Number(rawSettings.dailyBudget)) ? Math.max(0, Number(rawSettings.dailyBudget)) : 0,
    monthlyBudget: Number.isFinite(Number(rawSettings.monthlyBudget)) ? Math.max(0, Number(rawSettings.monthlyBudget)) : 0,
    pinCode: typeof rawSettings.pinCode === 'string' ? rawSettings.pinCode : null,
    isPinEnabled: Boolean(rawSettings.isPinEnabled && rawSettings.pinCode),
    pinIsHashed: Boolean(rawSettings.pinIsHashed),
    lastBackupDate: rawSettings.lastBackupDate || null,
  };

  return {
    learnedCards: Array.isArray(data.learned_cards) ? data.learned_cards : [],
    favCards: Array.isArray(data.fav_cards) ? data.fav_cards : [],
    todos: Array.isArray(data.todos) ? data.todos : [],
    habits: Array.isArray(data.habits) ? data.habits : [],
    finance: Array.isArray(data.finance) ? data.finance : [],
    expenseCategories: Array.isArray(rawSettings.expenseCategories)
      ? rawSettings.expenseCategories
      : DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: Array.isArray(rawSettings.incomeCategories)
      ? rawSettings.incomeCategories
      : DEFAULT_INCOME_CATEGORIES,
    recurringTransactions: Array.isArray(data.recurring_transactions)
      ? data.recurring_transactions
      : (Array.isArray(rawSettings.recurringTransactions) ? rawSettings.recurringTransactions : []),
    goals: Array.isArray(data.goals) ? data.goals : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    countdowns: Array.isArray(data.countdowns) ? data.countdowns : [],
    footballMatches: Array.isArray(data.football_matches) ? data.football_matches : [],
    settings: appSettings,
    learnedSentences: Array.isArray(data.learned_sentences)
      ? data.learned_sentences
      : (Array.isArray(rawSettings.learnedSentences) ? rawSettings.learnedSentences : []),
    favSentences: Array.isArray(data.fav_sentences)
      ? data.fav_sentences
      : (Array.isArray(rawSettings.favSentences) ? rawSettings.favSentences : []),
    sentenceLanguage: rawSettings.sentenceLanguage || 'zh',
    streak: data.streak_data || { count: 0, lastDate: null, lastActiveDate: null, cardsFlippedToday: 0 },
    pomodoroStats: data.pomodoro_stats || rawSettings.pomodoroStats || DEFAULT_POMODORO_STATS,
    codeReadingProgress: data.code_reading_progress || { mode: 'code', levelIndex: 0, questionIndex: 0 },
    homeFeatureOrder: Array.isArray(data.home_feature_order) ? data.home_feature_order : DEFAULT_FEATURE_ORDER,
    updatedAt: data.updated_at || null,
  };
};

/**
 * Fetch authenticated user's sync data from Supabase.
 */
export const fetchCloudUserData = async (userId) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  if (!userId) {
    return { data: null, error: new Error('User not authenticated') };
  }

  try {
    const { data, error } = await supabase
      .from('app_sync_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    return { data: parseCloudData(data), error: null };
  } catch (err) {
    console.error('Error fetching cloud data:', err);
    return { data: null, error: err };
  }
};

/**
 * Save / Upsert authenticated user's state into Supabase with server timestamp tracking.
 */
export const saveCloudUserData = async (stateData, userId, expectedUpdatedAt = null) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, conflict: false, updatedAt: null, error: new Error('Supabase not configured') };
  }
  if (!userId) {
    return { success: false, conflict: false, updatedAt: null, error: new Error('User not authenticated') };
  }

  try {
    const payload = {
      user_id: userId,
      learned_cards: stateData.learnedCards || [],
      fav_cards: stateData.favCards || [],
      learned_sentences: stateData.learnedSentences || [],
      fav_sentences: stateData.favSentences || [],
      todos: stateData.todos || [],
      habits: stateData.habits || [],
      finance: stateData.finance || [],
      recurring_transactions: stateData.recurringTransactions || [],
      goals: stateData.goals || [],
      notes: stateData.notes || [],
      projects: stateData.projects || [],
      countdowns: stateData.countdowns || [],
      football_matches: stateData.footballMatches || [],
      app_settings: {
        ...(stateData.settings || { darkMode: true, autoPlay: true, dailyBudget: 0, monthlyBudget: 0 }),
        expenseCategories: stateData.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
        incomeCategories: stateData.incomeCategories || DEFAULT_INCOME_CATEGORIES,
        recurringTransactions: stateData.recurringTransactions || [],
        learnedSentences: stateData.learnedSentences || [],
        favSentences: stateData.favSentences || [],
        sentenceLanguage: stateData.sentenceLanguage || 'zh',
        pomodoroStats: stateData.pomodoroStats || DEFAULT_POMODORO_STATS,
      },
      streak_data: stateData.streak || { count: 0, lastDate: null, lastActiveDate: null, cardsFlippedToday: 0 },
      pomodoro_stats: stateData.pomodoroStats || DEFAULT_POMODORO_STATS,
      code_reading_progress: stateData.codeReadingProgress || { mode: 'code', levelIndex: 0, questionIndex: 0 },
      home_feature_order: stateData.homeFeatureOrder || DEFAULT_FEATURE_ORDER,
    };

    if (expectedUpdatedAt) {
      const { data: updatedRows, error } = await supabase
        .from('app_sync_data')
        .update(payload)
        .eq('user_id', userId)
        .eq('updated_at', expectedUpdatedAt)
        .select('updated_at');

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        return { success: false, conflict: true, updatedAt: null, error: null };
      }
      return { success: true, conflict: false, updatedAt: updatedRows[0].updated_at || null, error: null };
    }

    const { data: upsertedRow, error } = await supabase
      .from('app_sync_data')
      .upsert(payload, { onConflict: 'user_id' })
      .select('updated_at')
      .maybeSingle();

    if (error) throw error;
    return { success: true, conflict: false, updatedAt: upsertedRow?.updated_at || null, error: null };
  } catch (err) {
    console.error('Error saving cloud data:', err);
    return { success: false, conflict: false, updatedAt: null, error: err };
  }
};

/**
 * Subscribe to realtime updates for the authenticated user across devices.
 */
export const subscribeToCloudChanges = (userId, onUpdate) => {
  if (!isSupabaseConfigured() || !supabase || !userId) return () => {};

  try {
    const channel = supabase
      .channel(`app_sync_data_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_sync_data',
          filter: `user_id=eq.${userId}`,
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
