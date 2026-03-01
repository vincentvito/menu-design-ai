-- MenuAI v2 Migration: AI Generation + Credits + New Flow
-- Run this in Supabase SQL Editor after schema.sql

-- ============================================================
-- 1. New Tables
-- ============================================================

-- Cuisine types reference table
CREATE TABLE IF NOT EXISTS public.cuisine_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    name_ar     VARCHAR(255),
    icon        VARCHAR(50),
    description TEXT,
    prompt_modifier TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cuisine_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active cuisine types" ON public.cuisine_types
    FOR SELECT USING (is_active = true);

-- User credits
CREATE TABLE IF NOT EXISTS public.user_credits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance         INTEGER NOT NULL DEFAULT 1,
    lifetime_earned INTEGER NOT NULL DEFAULT 1,
    lifetime_spent  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions audit log
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount                INTEGER NOT NULL,
    balance_after         INTEGER NOT NULL,
    type                  VARCHAR(50) NOT NULL,
    description           TEXT,
    stripe_payment_intent VARCHAR(255),
    menu_id               UUID REFERENCES public.menus(id) ON DELETE SET NULL,
    generation_id         UUID,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id);

-- AI generations (one row per batch of 4 images)
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id           UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style_template_id UUID REFERENCES public.style_templates(id),
    cuisine_type      VARCHAR(100) NOT NULL,
    status            VARCHAR(50) NOT NULL DEFAULT 'pending',
    provider          VARCHAR(50) NOT NULL DEFAULT 'replicate',
    model_id          VARCHAR(255) NOT NULL DEFAULT 'google/nano-banana',
    total_cost_usd    DECIMAL(10,6),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own generations" ON public.ai_generations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON public.ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON public.ai_generations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_generations_menu ON public.ai_generations(menu_id);

-- AI generation images (4 per generation)
CREATE TABLE IF NOT EXISTS public.ai_generation_images (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id          UUID NOT NULL REFERENCES public.ai_generations(id) ON DELETE CASCADE,
    variant_index          INTEGER NOT NULL,
    prompt_text            TEXT NOT NULL,
    image_url              VARCHAR(1024),
    provider_prediction_id VARCHAR(255),
    status                 VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message          TEXT,
    duration_ms            INTEGER,
    cost_usd               DECIMAL(10,6),
    metadata               JSONB,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    completed_at           TIMESTAMPTZ
);

ALTER TABLE public.ai_generation_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own generation images" ON public.ai_generation_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_generations g
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own generation images" ON public.ai_generation_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_generations g
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own generation images" ON public.ai_generation_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ai_generations g
            WHERE g.id = generation_id AND g.user_id = auth.uid()
        )
    );

CREATE INDEX idx_ai_generation_images_gen ON public.ai_generation_images(generation_id);

-- Prompt templates (4 variants per style × cuisine)
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    style_template_id UUID NOT NULL REFERENCES public.style_templates(id) ON DELETE CASCADE,
    cuisine_type      VARCHAR(100) NOT NULL,
    variant_index     INTEGER NOT NULL,
    prompt_template   TEXT NOT NULL,
    aspect_ratio      VARCHAR(10) DEFAULT '3:4',
    description       TEXT,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(style_template_id, cuisine_type, variant_index)
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active prompt templates" ON public.prompt_templates
    FOR SELECT USING (is_active = true);

-- Credit packages
CREATE TABLE IF NOT EXISTS public.credit_packages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    credits         INTEGER NOT NULL,
    price_usd       DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(255) UNIQUE,
    is_popular      BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active credit packages" ON public.credit_packages
    FOR SELECT USING (is_active = true);

-- ============================================================
-- 2. Alter Existing Tables
-- ============================================================

-- Menus: new columns for v2 flow
ALTER TABLE public.menus
    ADD COLUMN IF NOT EXISTS input_method VARCHAR(20) DEFAULT 'upload',
    ADD COLUMN IF NOT EXISTS raw_text_input TEXT,
    ADD COLUMN IF NOT EXISTS selected_generation_id UUID,
    ADD COLUMN IF NOT EXISTS selected_image_id UUID,
    ADD COLUMN IF NOT EXISTS final_deliverable_urls JSONB;

-- Style templates: prompt context and example images
ALTER TABLE public.style_templates
    ADD COLUMN IF NOT EXISTS example_images JSONB,
    ADD COLUMN IF NOT EXISTS base_prompt_context TEXT;

-- Profiles: Stripe customer ID
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Orders: generation reference
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS generation_id UUID,
    ADD COLUMN IF NOT EXISTS selected_image_id UUID;

-- ============================================================
-- 3. RPC Functions
-- ============================================================

-- Atomic credit deduction with row-level locking
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID, p_menu_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < 1 THEN
        RETURN -1;
    END IF;

    UPDATE public.user_credits
    SET balance = balance - 1,
        lifetime_spent = lifetime_spent + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_transactions
        (user_id, amount, balance_after, type, description, menu_id)
    VALUES
        (p_user_id, -1, v_balance - 1, 'generation', 'AI menu design generation', p_menu_id);

    RETURN v_balance - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit addition after payment
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_amount INTEGER, p_stripe_pi VARCHAR DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT balance INTO v_balance
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL THEN
        INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent)
        VALUES (p_user_id, p_amount, p_amount, 0);
        v_balance := p_amount;
    ELSE
        UPDATE public.user_credits
        SET balance = balance + p_amount,
            lifetime_earned = lifetime_earned + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        v_balance := v_balance + p_amount;
    END IF;

    INSERT INTO public.credit_transactions
        (user_id, amount, balance_after, type, description, stripe_payment_intent)
    VALUES
        (p_user_id, p_amount, v_balance, 'purchase', p_amount || ' credits purchased', p_stripe_pi);

    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. Update handle_new_user trigger to also create credits
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, locale)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        'en'
    );

    INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (NEW.id, 1, 1, 0);

    INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
    VALUES (NEW.id, 1, 1, 'signup_bonus', 'Free generation credit on signup');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Seed Data
-- ============================================================

-- Cuisine types
INSERT INTO public.cuisine_types (slug, name, name_ar, icon, prompt_modifier, sort_order) VALUES
    ('italian', 'Italian', 'إيطالي', '🇮🇹', 'Italian restaurant, Mediterranean colors, olive and wine motifs, rustic yet refined aesthetic, pasta and pizza imagery', 1),
    ('arabic', 'Arabic / Middle Eastern', 'عربي', '🕌', 'Arabic Middle Eastern restaurant, geometric Islamic patterns, warm gold and deep green, ornate borders, Arabic calligraphy elements', 2),
    ('japanese', 'Japanese', 'ياباني', '🇯🇵', 'Japanese restaurant, zen minimal aesthetic, brush stroke elements, muted earth tones, bamboo and cherry blossom accents', 3),
    ('indian', 'Indian', 'هندي', '🇮🇳', 'Indian restaurant, vibrant spice colors, mandala patterns, rich reds and golds, ornamental borders', 4),
    ('french', 'French', 'فرنسي', '🇫🇷', 'French restaurant, elegant Parisian style, sophisticated muted palette, art deco elements, refined typography', 5),
    ('mexican', 'Mexican', 'مكسيكي', '🇲🇽', 'Mexican restaurant, vibrant warm colors, folk art patterns, terracotta and turquoise, festive atmosphere', 6),
    ('chinese', 'Chinese', 'صيني', '🇨🇳', 'Chinese restaurant, red and gold palette, traditional Chinese patterns, lantern motifs, dragon or cloud decorative elements', 7),
    ('american', 'American', 'أمريكي', '🇺🇸', 'American restaurant, bold modern style, clean lines, rustic industrial feel, craft and artisanal vibe', 8),
    ('seafood', 'Seafood', 'مأكولات بحرية', '🐟', 'Seafood restaurant, ocean blue palette, nautical elements, wave patterns, fresh coastal atmosphere', 9),
    ('cafe', 'Cafe & Bakery', 'مقهى ومخبز', '☕', 'Cafe bakery, warm cozy atmosphere, earth tones and pastels, hand-drawn illustrations, artisanal feel', 10)
ON CONFLICT (slug) DO NOTHING;

-- Credit packages
INSERT INTO public.credit_packages (name, credits, price_usd, is_popular, sort_order) VALUES
    ('Starter', 3, 9.99, false, 1),
    ('Pro', 10, 24.99, true, 2),
    ('Business', 25, 49.99, false, 3)
ON CONFLICT DO NOTHING;

-- Update style_templates with base_prompt_context
UPDATE public.style_templates SET base_prompt_context = 'Luxurious elegant fine dining restaurant menu design, serif typography, gold foil accents on dark background, sophisticated minimal layout, premium feel, candlelit ambiance' WHERE slug = 'fine-dining';
UPDATE public.style_templates SET base_prompt_context = 'Clean minimal modern cafe menu design, sans-serif typography, green and white accents, contemporary Scandinavian layout, natural light feel' WHERE slug = 'modern-cafe';
UPDATE public.style_templates SET base_prompt_context = 'Warm inviting casual dining restaurant menu, friendly typography, earthy warm tones, family-oriented layout, rustic wood textures' WHERE slug = 'casual-dining';
UPDATE public.style_templates SET base_prompt_context = 'Bold energetic fast food menu design, chunky sans-serif fonts, red and yellow bold colors, dynamic layout, action-packed imagery' WHERE slug = 'fast-food';
UPDATE public.style_templates SET base_prompt_context = 'Traditional Arabic restaurant menu design, ornate Islamic geometric patterns, rich emerald green and gold palette, Amiri-style Arabic calligraphy, arabesque borders' WHERE slug = 'arabic-traditional';
UPDATE public.style_templates SET base_prompt_context = 'Fresh ocean-themed seafood restaurant menu, coastal blue palette, nautical rope and anchor motifs, wave patterns, clean maritime typography' WHERE slug = 'seafood';
