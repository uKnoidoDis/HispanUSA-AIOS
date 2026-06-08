-- =============================================================================
-- MIGRATION 009: Add 'personal_corporate_tax' appointment type
-- New 4th appointment type — "Taxes — Personal and Corporate", a single 90-minute
-- visit (3 consecutive 30-min slots, same preparer). The appointments.appointment_type
-- column is guarded by a CHECK constraint that did not include the new value, so
-- inserting/booking the new type would fail the CHECK (a 500 on the booking route).
-- This migration widens the allowed set to include 'personal_corporate_tax'.
-- Backward-compatible: only adds a permitted value; no existing rows write it.
-- APPLY THIS BEFORE THE CODE DEPLOY (staging AND prod).
-- Run after 008_add_cancellation_message_type.sql.
-- =============================================================================

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check;

ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_type_check
  CHECK (appointment_type IN (
    'personal_tax',
    'corporate_tax',
    'professional_services',
    'personal_corporate_tax'
  ));

-- =============================================================================
-- DONE
-- Verify with (expect 4 values incl. 'personal_corporate_tax'):
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.appointments'::regclass
--      AND conname  = 'appointments_appointment_type_check';
-- =============================================================================
