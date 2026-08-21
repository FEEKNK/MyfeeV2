-- ================================================================
-- MyFee V2 - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ================================================================

-- 1. Create table for user synchronization data (All-in-one sync)
CREATE TABLE IF NOT EXISTS public.user_sync_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_sync_data ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies so users can only access and update their own data
DROP POLICY IF EXISTS "Users can view own sync data" ON public.user_sync_data;
CREATE POLICY "Users can view own sync data"
    ON public.user_sync_data
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sync data" ON public.user_sync_data;
CREATE POLICY "Users can insert own sync data"
    ON public.user_sync_data
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sync data" ON public.user_sync_data;
CREATE POLICY "Users can update own sync data"
    ON public.user_sync_data
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sync data" ON public.user_sync_data;
CREATE POLICY "Users can delete own sync data"
    ON public.user_sync_data
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Automatically create user_sync_data record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_sync_data (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_sync_data_timestamp ON public.user_sync_data;
CREATE TRIGGER update_user_sync_data_timestamp
    BEFORE UPDATE ON public.user_sync_data
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Finished! All tables and security policies are configured.
