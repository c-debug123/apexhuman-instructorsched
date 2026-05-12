-- ── Migration 003: Cancellation support ──────────────────────────────────────
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- 1. Add cancellation columns to claims
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS status               text        NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS cancelled_at         timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by         text,
  ADD COLUMN IF NOT EXISTS cancellation_reason  text;

-- 2. Server-side cancellation with 72-hour business rule
--    SECURITY DEFINER → runs as owner (bypasses RLS), so no anon UPDATE policy needed.
--    Validates: ownership, 72h window, duplicate cancellation.
CREATE OR REPLACE FUNCTION cancel_claim(
  p_claim_id      uuid,
  p_cancelled_by  text,
  p_reason        text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim      claims%ROWTYPE;
  v_cohort     cohorts%ROWTYPE;
  v_slot       jsonb;
  v_start      text;
  v_course_dt  timestamptz;
  v_deadline   timestamptz;
BEGIN
  -- Lock row to prevent concurrent duplicate cancellations
  SELECT * INTO v_claim FROM claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Booking not found');
  END IF;

  -- Guard: already cancelled
  IF v_claim.status = 'cancelled' THEN
    RETURN json_build_object('error', 'This booking has already been cancelled');
  END IF;

  -- Guard: only the booking owner may cancel
  IF v_claim.instructor_name != p_cancelled_by THEN
    RETURN json_build_object('error', 'Unauthorized: you can only cancel your own bookings');
  END IF;

  -- Guard: date must be set to enforce window
  IF v_claim.date IS NULL THEN
    RETURN json_build_object('error', 'Cannot determine course date for this booking');
  END IF;

  -- Resolve startTime from cohort slot_dates[day - 1]
  SELECT * INTO v_cohort FROM cohorts WHERE id = v_claim.cohort_id;
  v_slot  := v_cohort.slot_dates -> (v_claim.day - 1);
  v_start := COALESCE(v_slot ->> 'startTime', '09:00');

  -- Build UTC course datetime: date + startTime
  v_course_dt := (v_claim.date + v_start::time) AT TIME ZONE 'UTC';
  v_deadline  := v_course_dt - interval '72 hours';

  -- 72-hour enforcement
  IF now() AT TIME ZONE 'UTC' >= v_deadline THEN
    RETURN json_build_object(
      'error',
      'Bookings can only be cancelled at least 72 hours before the scheduled course.'
    );
  END IF;

  -- Perform soft cancellation
  UPDATE claims SET
    status              = 'cancelled',
    cancelled_at        = now(),
    cancelled_by        = p_cancelled_by,
    cancellation_reason = p_reason
  WHERE id = p_claim_id;

  RETURN json_build_object('success', true);
END;
$$;
