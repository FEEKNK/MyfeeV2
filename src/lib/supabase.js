import { createClient } from '@supabase/supabase-js';

export const isValidSupabaseConfig = (candidateUrl, candidateKey) => {
  if (typeof candidateUrl !== 'string' || typeof candidateKey !== 'string') return false;
  try {
    const parsed = new URL(candidateUrl.trim());
    return parsed.protocol === 'https:' && candidateKey.trim().length > 15;
  } catch {
    return false;
  }
};

const getEnvConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const localUrl = localStorage.getItem('supabase_custom_url');
  const localKey = localStorage.getItem('supabase_custom_key');

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || '';
  const key = (localKey && localKey.trim()) || (envKey && envKey.trim()) || '';

  return { url, key };
};

const initialConfig = getEnvConfig();

export const isSupabaseConfigured = () => {
  const config = getEnvConfig();
  return isValidSupabaseConfig(config.url, config.key);
};

export let supabase = isValidSupabaseConfig(initialConfig.url, initialConfig.key)
  ? createClient(initialConfig.url, initialConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const reinitSupabase = (customUrl, customKey) => {
  const cleanUrl = (customUrl || '').trim();
  const cleanKey = (customKey || '').trim();
  if (!isValidSupabaseConfig(cleanUrl, cleanKey)) {
    return false;
  }

  localStorage.setItem('supabase_custom_url', cleanUrl);
  localStorage.setItem('supabase_custom_key', cleanKey);

  supabase = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return true;
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('supabase_custom_url');
  localStorage.removeItem('supabase_custom_key');
  const env = getEnvConfig();
  if (isValidSupabaseConfig(env.url, env.key)) {
    supabase = createClient(env.url, env.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } else {
    supabase = null;
  }
};
