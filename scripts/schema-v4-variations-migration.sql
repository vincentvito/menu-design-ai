-- ============================================================
-- V4: Variation Refinement Support
-- Adds parent tracking to ai_generations for variation chains
-- ============================================================

ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS parent_generation_id UUID REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_image_id UUID REFERENCES public.ai_generation_images(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variation_instructions TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_generations_parent
  ON public.ai_generations(parent_generation_id);
