-- =============================================================================
-- MIGRATION 013: Filing status + appointment_people (spouse & dependents)
-- Ruth feedback #6 + #3, combined build. Patterns from 002: nullable
-- conditional CHECK (cf. service_subtype 002:104), RLS service+authenticated
-- (cf. 002:234-242), partial-unique hardening (cf. 012).
-- =============================================================================

-- Filing status — personal types only (app-layer gating, same doctrine as
-- company_name in 011: nullable in DB, public route enforces per type).
ALTER TABLE appointments ADD COLUMN filing_status TEXT CHECK (
  filing_status IS NULL OR filing_status IN (
    'single', 'married_filing_jointly', 'married_filing_separately'
  )
);

-- One row per person attached to an appointment (spouse or dependent).
CREATE TABLE appointment_people (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID    NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL CHECK (role IN ('spouse', 'dependent')),
  name            TEXT    NOT NULL,
  dob             DATE    NOT NULL,
  relationship    TEXT,             -- dependents only; free text ("son", "mother")
  filing_with_us  BOOLEAN NOT NULL DEFAULT false,  -- dependent also files with HispanUSA
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointment_people_appointment_id
  ON appointment_people(appointment_id);

-- At most ONE spouse row per appointment (belt-and-suspenders, 012 culture).
CREATE UNIQUE INDEX uniq_one_spouse_per_appointment
  ON appointment_people(appointment_id)
  WHERE role = 'spouse';

ALTER TABLE appointment_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_people_service_all"
  ON appointment_people FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "appointment_people_authenticated_all"
  ON appointment_people FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
