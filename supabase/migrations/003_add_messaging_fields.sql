-- =============================================================================
-- MIGRATION 003: Messaging Fields
-- Adds auto_send_checklist to appointments.
-- Expands messages.message_type constraint to include 'checklist_manual'.
-- Run after 002_scheduling_schema.sql.
-- =============================================================================

-- Add auto_send_checklist flag to appointments
-- true  = send document checklist on confirmation (default for tax appointments)
-- false = send appointment-only confirmation (default for professional_services)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS auto_send_checklist BOOLEAN NOT NULL DEFAULT true;

-- Expand the message_type constraint to allow 'checklist_manual'
-- (used when staff manually sends checklist via the "Send Document Checklist" button)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE messages ADD CONSTRAINT messages_message_type_check CHECK (
  message_type IN (
    'confirmation',
    'reminder_7d',
    'reminder_3d',
    'reminder_1d',
    'approval',
    'rejection',
    'checklist_manual'
  )
);

-- =============================================================================
-- DONE
-- Verify with:
--   SELECT column_name, data_type, column_default
--     FROM information_schema.columns
--    WHERE table_name = 'appointments' AND column_name = 'auto_send_checklist';
-- =============================================================================
