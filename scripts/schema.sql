
-- ============================================================
-- MenuAI Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- PROFILES (auto-created from auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       VARCHAR(255),
    phone           VARCHAR(50),
    company_name    VARCHAR(255),
    role            VARCHAR(50) NOT NULL DEFAULT 'customer',
    locale          VARCHAR(10) DEFAULT 'en',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STYLE TEMPLATES
CREATE TABLE IF NOT EXISTS public.style_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    preview_url     VARCHAR(1024),
    css_template    TEXT,
    color_scheme    JSONB,
    font_config     JSONB,
    supports_rtl    BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- MENUS
CREATE TABLE IF NOT EXISTS public.menus (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status               VARCHAR(50) NOT NULL DEFAULT 'draft',
    original_image_url   VARCHAR(1024),
    original_filename    VARCHAR(255),
    restaurant_name      VARCHAR(255),
    cuisine_type         VARCHAR(100),
    locale               VARCHAR(10) DEFAULT 'en',
    extracted_json       JSONB,
    edited_json          JSONB,
    template_id          UUID REFERENCES public.style_templates(id),
    custom_colors        JSONB,
    background_image_url VARCHAR(1024),
    final_pdf_url        VARCHAR(1024),
    preview_pdf_url      VARCHAR(1024),
    page_count           INTEGER DEFAULT 1,
    paper_size           VARCHAR(20) DEFAULT 'A4',
    ocr_model            VARCHAR(100),
    ocr_confidence       FLOAT,
    image_gen_model      VARCHAR(100),
    processing_error     TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    submitted_at         TIMESTAMPTZ,
    approved_at          TIMESTAMPTZ,
    paid_at              TIMESTAMPTZ,
    delivered_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_menus_user_id ON public.menus(user_id);
CREATE INDEX IF NOT EXISTS idx_menus_status ON public.menus(status);

-- MENU SECTIONS
CREATE TABLE IF NOT EXISTS public.menu_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id         UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    name_en         VARCHAR(255) NOT NULL,
    name_ar         VARCHAR(255),
    description_en  TEXT,
    description_ar  TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_sections_menu_id ON public.menu_sections(menu_id);

-- MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id      UUID REFERENCES public.menu_sections(id) ON DELETE CASCADE,
    menu_id         UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    name_en         VARCHAR(255) NOT NULL,
    name_ar         VARCHAR(255),
    description_en  TEXT,
    description_ar  TEXT,
    price           DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'AED',
    price_variants  JSONB,
    is_vegetarian   BOOLEAN DEFAULT FALSE,
    is_vegan        BOOLEAN DEFAULT FALSE,
    is_gluten_free  BOOLEAN DEFAULT FALSE,
    is_spicy        BOOLEAN DEFAULT FALSE,
    is_halal        BOOLEAN DEFAULT TRUE,
    image_url       VARCHAR(1024),
    image_prompt    TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_section_id ON public.menu_items(section_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON public.menu_items(menu_id);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id               UUID REFERENCES public.menus(id) ON DELETE SET NULL,
    user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stripe_session_id     VARCHAR(255) UNIQUE,
    stripe_payment_intent VARCHAR(255) UNIQUE,
    stripe_customer_id    VARCHAR(255),
    amount                DECIMAL(10,2) NOT NULL,
    currency              VARCHAR(3) DEFAULT 'AED',
    status                VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method        VARCHAR(50),
    receipt_url           VARCHAR(1024),
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    paid_at               TIMESTAMPTZ,
    refunded_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_menu_id ON public.orders(menu_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);

-- QC REVIEWS
CREATE TABLE IF NOT EXISTS public.qc_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id         UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    reviewer_id     UUID REFERENCES auth.users(id),
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes           TEXT,
    rejection_reason TEXT,
    check_prices    BOOLEAN,
    check_names     BOOLEAN,
    check_layout    BOOLEAN,
    check_images    BOOLEAN,
    check_rtl       BOOLEAN,
    regenerated_pdf BOOLEAN DEFAULT FALSE,
    manual_edits    JSONB,
    assigned_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qc_reviews_menu_id ON public.qc_reviews(menu_id);
CREATE INDEX IF NOT EXISTS idx_qc_reviews_status ON public.qc_reviews(status);

-- TASK LOG
CREATE TABLE IF NOT EXISTS public.task_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id         UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    task_type       VARCHAR(100) NOT NULL,
    celery_task_id  VARCHAR(255),
    status          VARCHAR(50) NOT NULL,
    input_data      JSONB,
    output_data     JSONB,
    error_message   TEXT,
    duration_ms     INTEGER,
    cost_usd        DECIMAL(10,6),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_log_menu_id ON public.task_log(menu_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_log ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menus
CREATE POLICY "Users can view own menus"
    ON public.menus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create menus"
    ON public.menus FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own menus"
    ON public.menus FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own menus"
    ON public.menus FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "QC reviewers can view all menus"
    ON public.menus FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('qc_reviewer', 'admin'))
    );
CREATE POLICY "QC reviewers can update menus"
    ON public.menus FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('qc_reviewer', 'admin'))
    );

-- Menu sections
CREATE POLICY "Users can manage own menu sections"
    ON public.menu_sections FOR ALL USING (
        EXISTS (SELECT 1 FROM public.menus WHERE id = menu_sections.menu_id AND user_id = auth.uid())
    );
CREATE POLICY "QC can view menu sections"
    ON public.menu_sections FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('qc_reviewer', 'admin'))
    );

-- Menu items
CREATE POLICY "Users can manage own menu items"
    ON public.menu_items FOR ALL USING (
        EXISTS (SELECT 1 FROM public.menus WHERE id = menu_items.menu_id AND user_id = auth.uid())
    );
CREATE POLICY "QC can view menu items"
    ON public.menu_items FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('qc_reviewer', 'admin'))
    );

-- Orders
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders"
    ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- QC Reviews
CREATE POLICY "QC reviewers can manage reviews"
    ON public.qc_reviews FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('qc_reviewer', 'admin'))
    );

-- Style templates: everyone reads
CREATE POLICY "Anyone can view active templates"
    ON public.style_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates"
    ON public.style_templates FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Task log
CREATE POLICY "Users can view own task logs"
    ON public.task_log FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.menus WHERE id = task_log.menu_id AND user_id = auth.uid())
    );

-- ============================================================
-- SEED STYLE TEMPLATES
-- ============================================================
INSERT INTO public.style_templates (name, slug, description, category, color_scheme, font_config, supports_rtl, is_active, sort_order)
VALUES
    ('Fine Dining', 'fine-dining', 'Elegant and sophisticated, perfect for high-end restaurants', 'fine_dining',
     '{"primary": "#1a1a2e", "secondary": "#c9a96e", "background": "#fdf6ec", "text": "#2c2c2c", "accent": "#8b6914"}',
     '{"heading": "Playfair Display", "body": "Inter", "arabic": "Amiri"}', true, true, 1),
    ('Modern Cafe', 'modern-cafe', 'Clean and minimal, great for cafes and bistros', 'cafe',
     '{"primary": "#2d3436", "secondary": "#00b894", "background": "#ffffff", "text": "#333333", "accent": "#00a381"}',
     '{"heading": "Inter", "body": "Inter", "arabic": "Amiri"}', true, true, 2),
    ('Casual Dining', 'casual-dining', 'Warm and inviting, ideal for family restaurants', 'casual',
     '{"primary": "#2c1810", "secondary": "#d4a574", "background": "#fef9f0", "text": "#3d2b1f", "accent": "#b8860b"}',
     '{"heading": "Playfair Display", "body": "Inter", "arabic": "Amiri"}', true, true, 3),
    ('Fast Food', 'fast-food', 'Bold and energetic, perfect for quick-service restaurants', 'fast_food',
     '{"primary": "#e74c3c", "secondary": "#f39c12", "background": "#ffffff", "text": "#2c2c2c", "accent": "#e67e22"}',
     '{"heading": "Inter", "body": "Inter", "arabic": "Amiri"}', false, true, 4),
    ('Arabic Traditional', 'arabic-traditional', 'Rich and ornate, designed for traditional Middle Eastern cuisine', 'traditional',
     '{"primary": "#1b4332", "secondary": "#d4a96a", "background": "#faf3e6", "text": "#2d2d2d", "accent": "#8b6914"}',
     '{"heading": "Amiri", "body": "Amiri", "arabic": "Amiri"}', true, true, 5),
    ('Seafood', 'seafood', 'Fresh and oceanic, ideal for fish and seafood restaurants', 'seafood',
     '{"primary": "#1a3c5e", "secondary": "#4fc3f7", "background": "#f5fafd", "text": "#1a2a3a", "accent": "#0288d1"}',
     '{"heading": "Playfair Display", "body": "Inter", "arabic": "Amiri"}', true, true, 6)
ON CONFLICT (slug) DO NOTHING;
