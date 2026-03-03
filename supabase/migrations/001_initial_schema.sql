CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE appointment_type AS ENUM ('personal_returning', 'personal_new', 'corporate');
CREATE TYPE appointment_method AS ENUM ('in_person', 'zoom', 'telephone', 'whatsapp');
CREATE TYPE language_preference AS ENUM ('en', 'es');
CREATE TYPE checklist_type AS ENUM ('checklist_1', 'checklist_2', 'checklist_3', 'checklist_4');
CREATE TYPE reminder_trigger AS ENUM ('immediate', '7_day', '3_day', '1_day', 'manual_resend');
CREATE TYPE message_channel AS ENUM ('sms', 'email');
CREATE TYPE message_status AS ENUM ('sent', 'failed', 'pending');
CREATE TYPE doc_status AS ENUM ('not_sent', 'checklist_sent', 'confirmed', 'folder_opened', 'docs_received');

-- CLIENTS
CREATE TABLE clients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  language_preference language_preference NOT NULL DEFAULT 'es',
  is_new_client       BOOLEAN NOT NULL DEFAULT true,
  has_dependents      BOOLEAN NOT NULL DEFAULT false,
  is_corporate        BOOLEAN NOT NULL DEFAULT false,
  canopy_id           TEXT,
  notes               TEXT,
  CONSTRAINT clients_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_last_name ON clients(last_name);

-- APPOINTMENTS
CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  appointment_date  DATE NOT NULL,
  appointment_time  TIME NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  method            appointment_method NOT NULL DEFAULT 'in_person',
  appointment_type  appointment_type NOT NULL,
  has_dependents    BOOLEAN NOT NULL DEFAULT false,
  is_new_client     BOOLEAN NOT NULL DEFAULT false,
  doc_status        doc_status NOT NULL DEFAULT 'not_sent',
  booked_by         TEXT,
  assigned_preparer TEXT,
  calendar_entry    TEXT,
  notes             TEXT
);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, doc_status);

-- APPOINTMENT_CHECKLISTS
CREATE TABLE appointment_checklists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  checklist_type  checklist_type NOT NULL,
  language        language_preference NOT NULL DEFAULT 'es',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(appointment_id, checklist_type)
);
CREATE INDEX idx_appt_checklists_appt_id ON appointment_checklists(appointment_id);

-- MESSAGE_LOG
CREATE TABLE message_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel         message_channel NOT NULL,
  trigger         reminder_trigger NOT NULL,
  language        language_preference NOT NULL,
  recipient       TEXT NOT NULL,
  subject         TEXT,
  body            TEXT NOT NULL,
  status          message_status NOT NULL DEFAULT 'pending',
  provider_id     TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ
);
CREATE INDEX idx_message_log_appointment_id ON message_log(appointment_id);
CREATE INDEX idx_message_log_status ON message_log(status);
-- Prevents duplicate cron sends; manual_resend trigger bypasses this
CREATE UNIQUE INDEX idx_message_log_no_duplicate
  ON message_log(appointment_id, channel, trigger)
  WHERE trigger != 'manual_resend';

-- AUTO-UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (server-side service role bypasses by default)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
