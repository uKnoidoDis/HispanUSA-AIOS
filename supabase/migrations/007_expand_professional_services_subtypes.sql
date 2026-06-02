-- =============================================================================
-- MIGRATION 007: Expand Professional Services subtypes + "Other" free text
-- Splits several Professional Services into separate Consulting and Case
-- bookable reasons, and adds free-text capture for "Other". service_subtype goes
-- from 6 values to 10; a new nullable service_subtype_other column stores the
-- client's described need when subtype = 'other'. All Professional Services
-- remain 30 min; Consulting and Case within a service share a color.
-- Safe: applied when 0 appointments carried any service_subtype, so the tightened
-- CHECK (which drops the old 'divorce'/'bankruptcy'/'offer_in_compromise' values
-- in favor of their Consulting/Case splits) cannot orphan data. The separate
-- professional_services_requires_subtype CHECK is unaffected.
-- Run after 006_add_pending_message_type.sql.
-- =============================================================================

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS service_subtype_other TEXT;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_service_subtype_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_service_subtype_check
  CHECK (service_subtype IS NULL OR service_subtype IN (
    'immigration_consulting','immigration_case',
    'divorce_consulting','divorce_case',
    'bankruptcy_consulting','bankruptcy_case',
    'offer_in_compromise_consulting','offer_in_compromise_case',
    'general_consulting','other'
  ));

-- =============================================================================
-- DONE — applied to production + staging via MCP on June 1, 2026; the new CHECK
-- definition and the service_subtype_other column were re-confirmed on both.
-- Verify with:
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid='public.appointments'::regclass
--      AND conname='appointments_service_subtype_check';
-- =============================================================================
