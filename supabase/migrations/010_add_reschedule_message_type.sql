-- =============================================================================
-- MIGRATION 010: Add 'reschedule' message_type
-- Staff rescheduling an appointment (PATCH /api/appointments/[id] with a new
-- date/start_time) now sends the client a "moved from X to Y" notice. Every
-- outbound message is logged to the messages table, and message_type is guarded
-- by a CHECK constraint that did not include 'reschedule', so logging the new
-- send would fail the CHECK (silently — logMessage swallows errors — leaving
-- the send unlogged). This migration widens the allowed set to include it.
-- Backward-compatible: only adds a permitted value; no existing rows write it.
-- APPLY THIS BEFORE THE CODE DEPLOY (staging AND prod).
-- Run after 009_add_personal_corporate_tax_type.sql.
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
    'cancellation',
    'reschedule'
  ));

-- =============================================================================
-- DONE
-- Verify with (expect 10 values incl. 'reschedule'):
--   SELECT pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.messages'::regclass
--      AND conname  = 'messages_message_type_check';
-- =============================================================================
