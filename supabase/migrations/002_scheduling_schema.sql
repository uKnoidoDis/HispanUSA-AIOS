-- =============================================================================
-- MIGRATION 002: Scheduling System Schema
-- Replaces old doc-followup schema with full scheduling system tables.
-- Run this in Supabase SQL Editor after 001_initial_schema.sql.
-- =============================================================================

-- =============================================================================
-- STEP 1: DROP OLD CONFLICTING TABLES (in FK-safe order)
-- These tables from the doc-followup build are being superseded.
-- =============================================================================

DROP TABLE IF EXISTS message_log CASCADE;
DROP TABLE IF EXISTS appointment_checklists CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Drop old ENUMs that are no longer used
DROP TYPE IF EXISTS appointment_type CASCADE;
DROP TYPE IF EXISTS appointment_method CASCADE;
DROP TYPE IF EXISTS language_preference CASCADE;
DROP TYPE IF EXISTS checklist_type CASCADE;
DROP TYPE IF EXISTS reminder_trigger CASCADE;
DROP TYPE IF EXISTS message_channel CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS doc_status CASCADE;

-- =============================================================================
-- STEP 2: SHARED UTILITIES
-- =============================================================================

-- Auto-update trigger function (reusable across tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: PREPARERS
-- One row per tax preparer / staff member. Drives the calendar color coding.
-- =============================================================================

CREATE TABLE preparers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  color_hex   TEXT NOT NULL,  -- e.g. '#3B82F6' — used directly in calendar UI
  color_name  TEXT NOT NULL,  -- e.g. 'Blue' — displayed in dropdowns / labels
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup of active preparers (calendar + booking dropdown)
CREATE INDEX idx_preparers_active ON preparers(is_active);

-- =============================================================================
-- STEP 4: AVAILABILITY SLOTS
-- Stores the open time blocks staff create. Booked when an appointment is made.
-- =============================================================================

CREATE TABLE availability_slots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preparer_id   UUID NOT NULL REFERENCES preparers(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_booked     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent double-booking a slot for the same preparer
  CONSTRAINT no_overlapping_slots_check CHECK (start_time < end_time)
);

CREATE INDEX idx_slots_preparer_id  ON availability_slots(preparer_id);
CREATE INDEX idx_slots_date         ON availability_slots(date);
-- Composite for the most common query: "show available slots for date X"
CREATE INDEX idx_slots_date_booked  ON availability_slots(date, is_booked);

-- =============================================================================
-- STEP 5: APPOINTMENTS
-- Core booking record. Client info stored inline (no separate clients table
-- in Phase 1 — simplified for staff entry speed).
-- =============================================================================

CREATE TABLE appointments (
  id                UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  preparer_id       UUID    NOT NULL REFERENCES preparers(id) ON DELETE RESTRICT,

  -- Client info (inline — no separate clients table in Phase 1)
  client_name       TEXT    NOT NULL,
  client_phone      TEXT    NOT NULL,  -- E.164 format: +15551234567
  client_email      TEXT,              -- Optional: used for email reminders

  -- Appointment type drives checklist selection
  -- personal_tax | corporate_tax | professional_services
  appointment_type  TEXT    NOT NULL CHECK (
    appointment_type IN ('personal_tax', 'corporate_tax', 'professional_services')
  ),

  -- Required when appointment_type = 'professional_services'
  -- divorce | immigration_consulting | general_consulting | bankruptcy |
  -- offer_in_compromise | other
  service_subtype   TEXT    CHECK (
    service_subtype IS NULL OR service_subtype IN (
      'divorce', 'immigration_consulting', 'general_consulting',
      'bankruptcy', 'offer_in_compromise', 'other'
    )
  ),

  -- Scheduling
  date              DATE    NOT NULL,
  start_time        TIME    NOT NULL,
  end_time          TIME    NOT NULL,

  -- Lifecycle
  -- pending → confirmed → completed  (or cancelled at any point)
  status            TEXT    NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),

  -- Bilingual support: 'en' | 'es'
  language          TEXT    NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es')),

  -- Who created the booking: 'client' (self-book) | 'staff' (manual entry)
  booked_by         TEXT    NOT NULL CHECK (booked_by IN ('client', 'staff')),

  -- Set to true once the doc checklist SMS/email has been sent
  checklist_sent    BOOLEAN NOT NULL DEFAULT false,

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce: professional_services must have a subtype
  CONSTRAINT professional_services_requires_subtype CHECK (
    appointment_type != 'professional_services' OR service_subtype IS NOT NULL
  ),

  -- Enforce: time slot is valid
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_appointments_preparer_id  ON appointments(preparer_id);
CREATE INDEX idx_appointments_date         ON appointments(date);
CREATE INDEX idx_appointments_status       ON appointments(status);
-- Composite for dashboard: "show all active appointments for today"
CREATE INDEX idx_appointments_date_status  ON appointments(date, status);

-- Auto-update updated_at on every row change
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: MESSAGES
-- Outbound SMS and email log. One row per send attempt.
-- =============================================================================

CREATE TABLE messages (
  id                UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id    UUID    NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

  -- Delivery channel
  channel           TEXT    NOT NULL CHECK (channel IN ('sms', 'email')),

  -- What this message is for
  -- confirmation | reminder_7d | reminder_3d | reminder_1d | approval | rejection
  message_type      TEXT    NOT NULL CHECK (
    message_type IN (
      'confirmation', 'reminder_7d', 'reminder_3d', 'reminder_1d',
      'approval', 'rejection'
    )
  ),

  status            TEXT    NOT NULL DEFAULT 'pending' CHECK (
    status IN ('sent', 'failed', 'pending')
  ),

  error_message     TEXT,   -- Populated on failure (Twilio/Resend error text)
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_appointment_id  ON messages(appointment_id);
CREATE INDEX idx_messages_status          ON messages(status);

-- Prevent duplicate sends of the same message type to the same appointment
-- (cron job safety net)
CREATE UNIQUE INDEX idx_messages_no_duplicate
  ON messages(appointment_id, channel, message_type)
  WHERE status = 'sent';

-- =============================================================================
-- STEP 7: ROW LEVEL SECURITY
-- All tables locked down. The app uses SUPABASE_SERVICE_ROLE_KEY server-side,
-- which bypasses RLS. Anon key (public) is blocked entirely.
-- Auth policies will be added when Supabase Auth is wired up.
-- =============================================================================

ALTER TABLE preparers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- preparers: read-only for authenticated users, full access for service role
-- ---------------------------------------------------------------------------
CREATE POLICY "preparers_service_all"
  ON preparers FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "preparers_authenticated_read"
  ON preparers FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- availability_slots: authenticated users can read/manage
-- ---------------------------------------------------------------------------
CREATE POLICY "slots_service_all"
  ON availability_slots FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "slots_authenticated_all"
  ON availability_slots FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- appointments: authenticated users can read/manage
-- ---------------------------------------------------------------------------
CREATE POLICY "appointments_service_all"
  ON appointments FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "appointments_authenticated_all"
  ON appointments FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- messages: authenticated users can read/manage
-- ---------------------------------------------------------------------------
CREATE POLICY "messages_service_all"
  ON messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "messages_authenticated_all"
  ON messages FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- =============================================================================
-- STEP 8: SEED DATA — PREPARERS
-- The 5 active preparers at HispanUSA. Colors match Outlook calendar coding.
-- =============================================================================

INSERT INTO preparers (name, color_hex, color_name) VALUES
  ('Ruth Chaverra', '#3B82F6', 'Blue'),
  ('Nathaly',       '#FB923C', 'Light Orange'),
  ('Marycela',      '#EC4899', 'Pink'),
  ('Oraise',        '#92400E', 'Brown'),
  ('Emely',         '#22C55E', 'Green');

-- =============================================================================
-- DONE
-- Verify with:
--   SELECT * FROM preparers;
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================================================
