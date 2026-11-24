-- ================================================================
-- MyFee V2 - Supabase Database Schema (Per-User Authenticated Cloud Sync)
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ================================================================

-- 1. Create table for per-user synchronization data
CREATE TABLE IF NOT EXISTS public.app_sync_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    learned_cards JSONB DEFAULT '[]'::jsonb,
    fav_cards JSONB DEFAULT '[]'::jsonb,
    learned_sentences JSONB DEFAULT '[]'::jsonb,
    fav_sentences JSONB DEFAULT '[]'::jsonb,
    todos JSONB DEFAULT '[]'::jsonb,
    habits JSONB DEFAULT '[]'::jsonb,
    finance JSONB DEFAULT '[]'::jsonb,
    recurring_transactions JSONB DEFAULT '[]'::jsonb,
    goals JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    countdowns JSONB DEFAULT '[]'::jsonb,
    football_matches JSONB DEFAULT '[]'::jsonb,
    app_settings JSONB DEFAULT '{"darkMode": true, "autoPlay": true, "dailyBudget": 0, "monthlyBudget": 0, "pinCode": null, "isPinEnabled": false, "pinIsHashed": false}'::jsonb,
    streak_data JSONB DEFAULT '{"count": 0, "lastDate": null, "lastActiveDate": null, "cardsFlippedToday": 0}'::jsonb,
    pomodoro_stats JSONB DEFAULT '{"totalSessions": 0, "todaySessions": 0, "lastSessionDate": null}'::jsonb,
    code_reading_progress JSONB DEFAULT '{"mode": "code", "levelIndex": 0, "questionIndex": 0}'::jsonb,
    home_feature_order JSONB DEFAULT '["sentences", "flashcard", "todo", "habit", "finance", "goals", "notes", "projects", "pomodoro", "countdown", "breathing", "quiz", "code_reading", "football", "settings"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If upgrading from the legacy single_user schema (where primary key was `id TEXT`):
-- ALTER TABLE public.app_sync_data ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- ALTER TABLE public.app_sync_data ADD COLUMN IF NOT EXISTS learned_sentences JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.app_sync_data ADD COLUMN IF NOT EXISTS fav_sentences JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.app_sync_data ADD COLUMN IF NOT EXISTS recurring_transactions JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.app_sync_data ADD COLUMN IF NOT EXISTS pomodoro_stats JSONB DEFAULT '{"totalSessions": 0, "todaySessions": 0, "lastSessionDate": null}'::jsonb;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.app_sync_data ENABLE ROW LEVEL SECURITY;

-- 3. Remove any legacy public policies & enforce strict per-user RLS
DROP POLICY IF EXISTS "Public access to app_sync_data" ON public.app_sync_data;
DROP POLICY IF EXISTS "Users can access only their own sync data" ON public.app_sync_data;

CREATE POLICY "Users can access only their own sync data"
    ON public.app_sync_data
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.update_app_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_sync_data_timestamp ON public.app_sync_data;
CREATE TRIGGER update_app_sync_data_timestamp
    BEFORE UPDATE ON public.app_sync_data
    FOR EACH ROW EXECUTE FUNCTION public.update_app_sync_timestamp();

-- 5. Enable Supabase Realtime for instant synchronization across devices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'app_sync_data'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_sync_data;
    END IF;
END $$;
