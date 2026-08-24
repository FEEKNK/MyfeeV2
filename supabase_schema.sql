-- ================================================================
-- MyFee V2 - Supabase Database Schema (Single-User Cloud Sync / No Login)
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ================================================================

-- 1. Create table for Single-User synchronization data
CREATE TABLE IF NOT EXISTS public.app_sync_data (
    id TEXT PRIMARY KEY DEFAULT 'single_user',
    learned_cards JSONB DEFAULT '[]'::jsonb,
    fav_cards JSONB DEFAULT '[]'::jsonb,
    todos JSONB DEFAULT '[]'::jsonb,
    habits JSONB DEFAULT '[]'::jsonb,
    finance JSONB DEFAULT '[]'::jsonb,
    goals JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    countdowns JSONB DEFAULT '[]'::jsonb,
    app_settings JSONB DEFAULT '{"darkMode": true, "autoPlay": true, "dailyBudget": 0, "monthlyBudget": 0, "pinCode": "3804", "isPinEnabled": true}'::jsonb,
    streak_data JSONB DEFAULT '{"count": 0, "lastDate": null, "cardsFlippedToday": 0}'::jsonb,
    code_reading_progress JSONB DEFAULT '{"mode": "code", "levelIndex": 0, "questionIndex": 0}'::jsonb,
    home_feature_order JSONB DEFAULT '["flashcard", "todo", "habit", "finance", "goals", "notes", "projects", "pomodoro", "countdown", "breathing", "quiz", "code_reading", "settings"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.app_sync_data ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Policies allowing Anon / Authenticated clients to access single_user data
DROP POLICY IF EXISTS "Public access to app_sync_data" ON public.app_sync_data;
CREATE POLICY "Public access to app_sync_data"
    ON public.app_sync_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Insert initial row if not already present
INSERT INTO public.app_sync_data (id)
VALUES ('single_user')
ON CONFLICT (id) DO NOTHING;

-- 5. Updated_at timestamp trigger
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

-- 6. Enable Supabase Realtime for instant synchronization across devices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'app_sync_data'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_sync_data;
    END IF;
END $$;

-- Finished! Run this script once in the Supabase SQL Editor.
