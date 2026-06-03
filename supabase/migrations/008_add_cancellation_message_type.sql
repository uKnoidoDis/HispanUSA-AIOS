-- =============================================================================
-- MIGRATION 008: Add 'cancellation' message_type
-- Staff cancelling an appointment (PATCH /api/appointments/[id] → status
-- 'cancelled') now sends the client a cancellation notice. Every outbound
-- message is logged to the messages table, and message_type is guarded by a
-- CHECK constraint that did not include 'cancellation', so logging the new send
-- would fail the CHECK (silently — logMessage swallows errors — leaving the send
-- unlogged). This migration widens the allowed set to include 'cancellation'.
-- Backward-compatible: only adds a permitted value; no existing rows write it.
-- APPLY THIS BEFORE THE CODE DEPLOY (staging AND prod).
-- Run after 007_expand_professional_services_subtypes.sql.
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
    'pending',
    'cancellation'
  ));

-- =============================================================================
-- DONE
-- Verify with (expect 9 values incl. 'cancellation'):
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.messages'::regclass
--      AND conname  = 'messages_message_type_check';
-- =============================================================================
