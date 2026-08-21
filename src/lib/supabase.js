import { createClient } from '@supabase/supabase-js';

const getEnvConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const localUrl = localStorage.getItem('supabase_custom_url');
  const localKey = localStorage.getItem('supabase_custom_key');

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || '';
  const key = (localKey && localKey.trim()) || (envKey && envKey.trim()) || '';

  return { url, key };
};

let { url, key } = getEnvConfig();

// Create client if configured
export const isSupabaseConfigured = () => {
  const config = getEnvConfig();
  return Boolean(config.url && config.key && config.url.startsWith('https://') && config.key.length > 15);
};

export let supabase = isSupabaseConfigured()
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const reinitSupabase = (customUrl, customKey) => {
  if (customUrl) localStorage.setItem('supabase_custom_url', customUrl.trim());
  if (customKey) localStorage.setItem('supabase_custom_key', customKey.trim());

  const current = getEnvConfig();
  if (current.url && current.key) {
    supabase = createClient(current.url, current.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return true;
  }
  return false;
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('supabase_custom_url');
  localStorage.removeItem('supabase_custom_key');
  const env = getEnvConfig();
  if (env.url && env.key) {
    supabase = createClient(env.url, env.key);
  } else {
    supabase = null;
  }
};
