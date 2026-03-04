-- ============================================================
-- v5 Migration: Strict Fidelity + Ingestion Pipeline
-- Adds storage bucket/policies, refund RPC, and OCR metadata columns
-- ============================================================

-- 1) Ensure OCR metadata columns exist on menus
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS ocr_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ocr_confidence FLOAT;

-- 2) Storage bucket for original user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-originals', 'menu-originals', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies scoped to user-owned folder prefix: {auth.uid()}/{menu_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can read own menu originals'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can read own menu originals"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'menu-originals'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can upload own menu originals'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own menu originals"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'menu-originals'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can update own menu originals'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update own menu originals"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'menu-originals'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'menu-originals'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can delete own menu originals'
      AND schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete own menu originals"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'menu-originals'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END
$$;

-- 4) Refund RPC for generations that fail fidelity checks entirely
CREATE OR REPLACE FUNCTION public.refund_credit(
  p_user_id UUID,
  p_menu_id UUID,
  p_reason TEXT DEFAULT 'Generation refund'
)
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
    VALUES (p_user_id, 1, 0, 0);
    v_balance := 1;
  ELSE
    UPDATE public.user_credits
    SET balance = balance + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    v_balance := v_balance + 1;
  END IF;

  INSERT INTO public.credit_transactions
    (user_id, amount, balance_after, type, description, menu_id)
  VALUES
    (p_user_id, 1, v_balance, 'refund', COALESCE(p_reason, 'Generation refund'), p_menu_id);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
