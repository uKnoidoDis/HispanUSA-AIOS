-- =============================================================================
-- MIGRATION 005: SMS Consent on Appointments
-- Adds explicit SMS opt-in tracking to the appointments table so the public
-- booking flow can record verifiable consent. This is required for Twilio
-- A2P 10DLC compliance — the carrier campaign was rejected partly because the
-- system had no provable opt-in record per contact. These columns capture
-- whether the client consented, and when / from what IP / against which
-- disclosure-text version. The three metadata columns stay NULL whenever
-- sms_consent is false. Uses ALTER TABLE — no drop/rebuild.
-- Run after 004_staff_profiles_and_password_events.sql.
-- =============================================================================

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS sms_consent              BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_consent_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_consent_ip           TEXT,
  ADD COLUMN IF NOT EXISTS sms_consent_text_version TEXT;

-- =============================================================================
-- DONE
-- Verify with:
--   SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_name = 'appointments'
--      AND column_name LIKE 'sms_consent%'
--    ORDER BY column_name;
-- =============================================================================
