-- ============================================================
-- v3 Migration: Enhanced Menu Creation Flow
-- Adds: menu format, page layout, color palettes, expanded cuisines
-- ============================================================

-- 1a. New columns on menus table
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS menu_format VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS page_layout VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS color_palette JSONB DEFAULT NULL;

-- 1b. Color palettes table (curated palettes per style)
CREATE TABLE IF NOT EXISTS public.color_palettes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_template_id UUID NOT NULL REFERENCES public.style_templates(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  colors          JSONB NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active palettes"
  ON public.color_palettes FOR SELECT
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_color_palettes_style
  ON public.color_palettes(style_template_id);

-- ============================================================
-- 1c. Expanded cuisine types (~18 new cuisines)
-- ============================================================

INSERT INTO public.cuisine_types (slug, name, icon, description, prompt_modifier, is_active, sort_order)
VALUES
  ('mediterranean', 'Mediterranean', '🌊', 'Coastal Mediterranean cuisine with fresh ingredients',
   'Mediterranean coastal restaurant, sun-washed terracotta and azure blue palette, olive branches and citrus motifs, whitewashed walls feel, fresh seafood and vegetable focus, rustic coastal elegance',
   true, 11),

  ('greek', 'Greek', '🇬🇷', 'Traditional and modern Greek cuisine',
   'Greek restaurant, Aegean blue and white color scheme, ancient column motifs, Mediterranean terracotta accents, olive and grape vine decorative elements, taverna warmth',
   true, 12),

  ('levantine', 'Levantine / Lebanese', '🇱🇧', 'Lebanese, Syrian, and Levantine cuisine',
   'Levantine Lebanese restaurant, warm earth tones with pomegranate red accents, cedar tree motifs, intricate mosaic patterns, mezze-style abundant display, warm hospitality feel',
   true, 13),

  ('turkish', 'Turkish', '🇹🇷', 'Rich Turkish culinary traditions',
   'Turkish restaurant, deep crimson and turquoise palette, Iznik tile patterns, copper pot and lantern motifs, Ottoman ornamental borders, bazaar warmth and richness',
   true, 14),

  ('korean', 'Korean', '🇰🇷', 'Korean BBQ, bibimbap, and more',
   'Korean restaurant, clean modern aesthetic with bold accents, vibrant banchan colors, minimalist contemporary layout, kimchi red and sesame tones, K-style modern elegance',
   true, 15),

  ('thai', 'Thai', '🇹🇭', 'Authentic Thai flavors and street food',
   'Thai restaurant, tropical warm palette with gold temple accents, lotus flower and elephant motifs, rich purples and greens, ornate Thai pattern borders, spice market vibrancy',
   true, 16),

  ('vietnamese', 'Vietnamese', '🇻🇳', 'Fresh Vietnamese pho, banh mi, and more',
   'Vietnamese restaurant, fresh green and warm yellow palette, lantern and lotus motifs, light airy bamboo textures, delicate line illustrations, fresh herb garden feel',
   true, 17),

  ('persian', 'Persian / Iranian', '🇮🇷', 'Ancient Persian culinary traditions',
   'Persian Iranian restaurant, turquoise and gold palette, Persian miniature art motifs, intricate paisley and floral patterns, saffron and rose accents, regal elegance',
   true, 18),

  ('spanish', 'Spanish / Tapas', '🇪🇸', 'Spanish tapas and regional cuisine',
   'Spanish tapas restaurant, warm terracotta and deep red palette, flamenco-inspired decorative elements, Mediterranean tile patterns, olive and vine motifs, lively social atmosphere',
   true, 19),

  ('brazilian', 'Brazilian / South American', '🇧🇷', 'Churrasco, feijoada, and tropical flavors',
   'Brazilian South American restaurant, tropical lush greens and sunny yellows, Amazonian leaf patterns, carnival-inspired accents, warm wood textures, vibrant energy',
   true, 20),

  ('caribbean', 'Caribbean', '🌴', 'Island flavors and tropical dishes',
   'Caribbean restaurant, vibrant tropical sunset palette, palm tree and hibiscus motifs, reggae-art inspired patterns, ocean turquoise and mango orange, island relaxation feel',
   true, 21),

  ('ethiopian', 'Ethiopian / African', '🌍', 'Injera, stews, and African flavors',
   'Ethiopian African restaurant, earthy brown and gold palette, bold geometric tribal patterns, woven basket textures, rich spice market colors, communal dining warmth',
   true, 22),

  ('steakhouse', 'Steakhouse / Grill', '🥩', 'Premium steaks and grilled meats',
   'Steakhouse grill restaurant, dark leather and mahogany tones, fire and smoke visual elements, bold masculine typography, rustic wood and iron textures, premium butcher-style feel',
   true, 23),

  ('sushi-bar', 'Sushi Bar', '🍣', 'Fresh sushi, sashimi, and Japanese seafood',
   'Sushi bar restaurant, clean minimal Japanese aesthetic, slate gray and cherry blossom pink, fresh fish display presentation, bamboo and stone textures, zen tranquility',
   true, 24),

  ('pizzeria', 'Pizzeria', '🍕', 'Pizza, calzones, and Italian-American favorites',
   'Pizzeria restaurant, classic red and white checkered Italian-American style, brick oven warmth, fresh basil green accents, hand-tossed rustic charm, neighborhood warmth',
   true, 25),

  ('brunch', 'Brunch', '🧇', 'Breakfast, brunch, and daytime dining',
   'Brunch restaurant, sunny pastel palette with warm yellows and soft pinks, morning light atmosphere, coffee cup and egg motifs, hand-drawn whimsical illustrations, cozy weekend feel',
   true, 26),

  ('vegan', 'Vegan / Plant-Based', '🌱', 'Plant-based and health-conscious dining',
   'Vegan plant-based restaurant, fresh green and earth tone palette, organic leaf and seed motifs, clean modern minimal layout, natural textures, farm-to-table sustainable feel',
   true, 27),

  ('fusion', 'Fusion / Contemporary', '✨', 'Creative fusion and modern cuisine',
   'Fusion contemporary restaurant, mixed cultural design elements, modern artistic layout, bold color blocking, abstract geometric patterns, avant-garde sophisticated feel',
   true, 28)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 1d. Seed color palettes for each style template
-- ============================================================

-- Fine Dining palettes
INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Classic Gold & Navy', 'classic-gold',
  '["#1a1a2e", "#c9a96e", "#fdf6ec", "#2c2c2c", "#8b6914"]'::jsonb, true, 1
FROM public.style_templates WHERE slug = 'fine-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Midnight Ruby', 'midnight-ruby',
  '["#1c1c2e", "#9b2335", "#f5e6d3", "#2c2c2c", "#d4a574"]'::jsonb, false, 2
FROM public.style_templates WHERE slug = 'fine-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Champagne & Ivory', 'champagne-ivory',
  '["#2c2c2c", "#c4a35a", "#faf8f0", "#5c5c5c", "#e8dcc8"]'::jsonb, false, 3
FROM public.style_templates WHERE slug = 'fine-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Forest Formal', 'forest-formal',
  '["#1b3a2d", "#c9a96e", "#f0ebe3", "#2c2c2c", "#4a7c59"]'::jsonb, false, 4
FROM public.style_templates WHERE slug = 'fine-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Rose Gold & Black', 'rose-gold-black',
  '["#1a1a1a", "#b76e79", "#fdf6f0", "#333333", "#e8c4b8"]'::jsonb, false, 5
FROM public.style_templates WHERE slug = 'fine-dining';

-- Modern Cafe palettes
INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Mint & Charcoal', 'mint-charcoal',
  '["#2d3436", "#00b894", "#ffffff", "#636e72", "#dfe6e9"]'::jsonb, true, 1
FROM public.style_templates WHERE slug = 'modern-cafe';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Coral Sunset', 'coral-sunset',
  '["#2d3436", "#ff7675", "#ffeaa7", "#636e72", "#fab1a0"]'::jsonb, false, 2
FROM public.style_templates WHERE slug = 'modern-cafe';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Ocean Breeze', 'ocean-breeze',
  '["#2d3436", "#0984e3", "#dfe6e9", "#636e72", "#74b9ff"]'::jsonb, false, 3
FROM public.style_templates WHERE slug = 'modern-cafe';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Sage & Sand', 'sage-sand',
  '["#2d3436", "#a8b5a2", "#f5f0e8", "#636e72", "#d4c5a9"]'::jsonb, false, 4
FROM public.style_templates WHERE slug = 'modern-cafe';

-- Casual Dining palettes
INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Warm Rustic', 'warm-rustic',
  '["#2c1810", "#d4a574", "#fdf6ec", "#5c3a2e", "#e8d5b7"]'::jsonb, true, 1
FROM public.style_templates WHERE slug = 'casual-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Olive Garden', 'olive-garden',
  '["#3d4f2f", "#c4a35a", "#f5f0e3", "#5c6b4a", "#d4c5a9"]'::jsonb, false, 2
FROM public.style_templates WHERE slug = 'casual-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Terracotta Sun', 'terracotta-sun',
  '["#8b4513", "#e67e22", "#fdf6ec", "#a0522d", "#f5d6b4"]'::jsonb, false, 3
FROM public.style_templates WHERE slug = 'casual-dining';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Berry & Cream', 'berry-cream',
  '["#4a1942", "#c0392b", "#fdf6ec", "#6b2c5e", "#e8c4b8"]'::jsonb, false, 4
FROM public.style_templates WHERE slug = 'casual-dining';

-- Fast Food palettes
INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Classic Red & Yellow', 'classic-red-yellow',
  '["#e74c3c", "#f39c12", "#ffffff", "#2c3e50", "#f1c40f"]'::jsonb, true, 1
FROM public.style_templates WHERE slug = 'fast-food';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Neon Green', 'neon-green',
  '["#27ae60", "#2ecc71", "#ffffff", "#2c3e50", "#f1c40f"]'::jsonb, false, 2
FROM public.style_templates WHERE slug = 'fast-food';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Purple Punch', 'purple-punch',
  '["#8e44ad", "#e74c3c", "#ffffff", "#2c3e50", "#f39c12"]'::jsonb, false, 3
FROM public.style_templates WHERE slug = 'fast-food';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Blue Flame', 'blue-flame',
  '["#2980b9", "#e67e22", "#ffffff", "#2c3e50", "#3498db"]'::jsonb, false, 4
FROM public.style_templates WHERE slug = 'fast-food';

-- Arabic Traditional palettes
INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Emerald & Gold', 'emerald-gold',
  '["#1b4332", "#d4a96a", "#f5efe0", "#2d6a4f", "#8b6914"]'::jsonb, true, 1
FROM public.style_templates WHERE slug = 'arabic-traditional';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Royal Blue & Gold', 'royal-blue-gold',
  '["#1a237e", "#d4a96a", "#f5efe0", "#283593", "#c9a96e"]'::jsonb, false, 2
FROM public.style_templates WHERE slug = 'arabic-traditional';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Desert Sand', 'desert-sand',
  '["#5d4037", "#d4a96a", "#f5efe0", "#795548", "#c9a96e"]'::jsonb, false, 3
FROM public.style_templates WHERE slug = 'arabic-traditional';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Burgundy & Gold', 'burgundy-gold',
  '["#4a0e0e", "#d4a96a", "#f5efe0", "#6b1a1a", "#c9a96e"]'::jsonb, false, 4
FROM public.style_templates WHERE slug = 'arabic-traditional';

-- Seafood palettes
INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Deep Ocean', 'deep-ocean',
  '["#1a3c5e", "#4fc3f7", "#e8f4f8", "#2c5f8a", "#b3e5fc"]'::jsonb, true, 1
FROM public.style_templates WHERE slug = 'seafood';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Coral Reef', 'coral-reef',
  '["#1a3c5e", "#ff8a65", "#e8f4f8", "#2c5f8a", "#ffab91"]'::jsonb, false, 2
FROM public.style_templates WHERE slug = 'seafood';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Sandy Shore', 'sandy-shore',
  '["#1a3c5e", "#d4a574", "#f5f0e8", "#2c5f8a", "#e8d5b7"]'::jsonb, false, 3
FROM public.style_templates WHERE slug = 'seafood';

INSERT INTO public.color_palettes (style_template_id, name, slug, colors, is_default, sort_order)
SELECT id, 'Teal & White', 'teal-white',
  '["#004d40", "#26a69a", "#ffffff", "#00695c", "#80cbc4"]'::jsonb, false, 4
FROM public.style_templates WHERE slug = 'seafood';
