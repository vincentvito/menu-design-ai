-- ============================================================
-- v6 Migration: Digital Menu + QR Packages
-- Adds package entitlement + public menu publishing fields
-- ============================================================

ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS output_package VARCHAR(20),
  ADD COLUMN IF NOT EXISTS digital_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_slug VARCHAR(120),
  ADD COLUMN IF NOT EXISTS public_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_visibility VARCHAR(20) NOT NULL DEFAULT 'unlisted',
  ADD COLUMN IF NOT EXISTS public_published_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS package_type VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'menus_output_package_check'
  ) THEN
    ALTER TABLE public.menus
      ADD CONSTRAINT menus_output_package_check
      CHECK (output_package IN ('basic', 'digital', 'pro') OR output_package IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'menus_public_visibility_check'
  ) THEN
    ALTER TABLE public.menus
      ADD CONSTRAINT menus_public_visibility_check
      CHECK (public_visibility IN ('unlisted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_package_type_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_package_type_check
      CHECK (package_type IN ('digital', 'pro') OR package_type IS NULL);
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_public_slug_unique
  ON public.menus(public_slug)
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_menus_public_published_slug
  ON public.menus(public_slug)
  WHERE public_published = TRUE;
