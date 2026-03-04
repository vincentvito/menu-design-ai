-- v7: Performance — Storage bucket for generated AI images
--
-- Creates a public storage bucket for re-uploaded generated images.
-- Replicate CDN URLs expire, causing broken images on page refresh.
-- Images are now re-uploaded to Supabase Storage for permanent URLs.
--
-- The "ready" status added to ai_generation_images requires no schema
-- change since the status column is VARCHAR(50) with no CHECK constraint.

-- ---------------------------------------------------------------------------
-- Storage bucket for generated AI images
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access (images are displayed to users)
CREATE POLICY "Anyone can read generated images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');
