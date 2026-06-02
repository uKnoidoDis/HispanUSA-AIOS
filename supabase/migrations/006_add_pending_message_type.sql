-- =============================================================================
-- MIGRATION 006: Add 'pending' message_type
-- The client self-booking flow now sends a "request received / pending
-- confirmation" email to the client at booking time. Every outbound message is
-- logged to the messages table, and message_type is guarded by a CHECK
-- constraint. The existing constraint did not include 'pending', so logging the
-- new email would fail (silently — logMessage swallows errors — leaving an
-- unlogged send). This migration widens the allowed set to include 'pending'.
-- Backward-compatible: only adds a permitted value; no existing rows or code
-- write 'pending', so applying this before the code deploy is safe.
-- Run after 005_add_sms_consent_to_appointments.sql.
-- =============================================================================

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN (
    'confirmation',
    'reminder_7d',
    'reminder_3d',
    'reminder_1d',
    'approval',
    'rejection',
    'checklist_manual',
    'pending'
  ));

-- =============================================================================
-- DONE
-- Verify with:
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.messages'::regclass
--      AND conname  = 'messages_message_type_check';
-- =============================================================================
