-- =============================================================================
-- MIGRATION 004: Staff Profiles + Password Events
-- Adds the staff_profiles table (one row per auth.users) and password_events
-- (append-only log of every password change). Backfills profiles for the 21
-- existing auth users with must_change_password = true.
-- Run after 003_add_messaging_fields.sql in the Supabase SQL Editor.
--
-- Requires: update_updated_at_column() from migration 002 (verified to exist).
-- =============================================================================

-- =============================================================================
-- STEP 1: STAFF_PROFILES
-- Keyed by auth.users.id. Holds role, display name, phone, and the
-- must_change_password gate that blocks the dashboard until cleared.
-- =============================================================================

CREATE TABLE staff_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL UNIQUE,
  display_name          TEXT,
  phone_e164            TEXT,
  role                  TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  must_change_password  BOOLEAN NOT NULL DEFAULT true,
  last_login_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- E.164 sanity check: starts with + and 10-15 digits total.
  -- Application layer (normalizePhone) is the real source of truth.
  CONSTRAINT phone_e164_format CHECK (
    phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{9,14}$'
  ),

  -- Display name: 2-60 chars, letters/spaces/hyphens/apostrophes only.
  -- Pattern uses dollar-quoted string ($regex$...$regex$) so the apostrophe
  -- and hyphen in the character class don't need shell-style escaping.
  CONSTRAINT display_name_format CHECK (
    display_name IS NULL OR (
      char_length(display_name) BETWEEN 2 AND 60
      AND display_name ~ $regex$^[A-Za-zÀ-ÿ '\-]+$$regex$
    )
  )
);

CREATE INDEX idx_staff_profiles_role     ON staff_profiles(role);
CREATE INDEX idx_staff_profiles_email    ON staff_profiles(email);

-- Reuse the existing update_updated_at_column() function from migration 002.
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 2: PASSWORD_EVENTS
-- Append-only log of password mutations. The audit-log build (next migration)
-- will add database triggers that fan these rows into the master audit table.
-- =============================================================================

CREATE TABLE password_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL CHECK (
    event_type IN ('self_change', 'admin_force', 'reset_completed')
  ),
  -- Who triggered it. For 'self_change' and 'reset_completed' this equals
  -- user_id. For 'admin_force' this is the admin/owner who initiated it.
  actor_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_events_user_id     ON password_events(user_id);
CREATE INDEX idx_password_events_created_at  ON password_events(created_at DESC);
CREATE INDEX idx_password_events_event_type  ON password_events(event_type);

-- =============================================================================
-- STEP 3: ROW LEVEL SECURITY
-- App writes via service role server-side (bypasses RLS). Policies below are
-- defense-in-depth for any future direct-from-browser access and to enforce
-- the spec: "users can only update their own profile + password".
-- =============================================================================

ALTER TABLE staff_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- staff_profiles: service role full access; authenticated users can read
-- and update their own row only. Role and must_change_password can only be
-- changed via service role (admin actions run server-side).
-- ---------------------------------------------------------------------------
CREATE POLICY "staff_profiles_service_all"
  ON staff_profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "staff_profiles_self_read"
  ON staff_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "staff_profiles_self_update"
  ON staff_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent self-promotion or clearing the must_change_password gate
    -- via direct browser access. Service role bypasses this entirely.
    AND role = (SELECT role FROM staff_profiles WHERE id = auth.uid())
    AND must_change_password = (
      SELECT must_change_password FROM staff_profiles WHERE id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- password_events: service role only. App writes via service role.
-- The next migration will add an admin/owner read policy when the audit
-- log viewer is built.
-- ---------------------------------------------------------------------------
CREATE POLICY "password_events_service_all"
  ON password_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =============================================================================
-- STEP 4: BACKFILL EXISTING 21 USERS
-- Insert one staff_profiles row for every auth.users row that doesn't
-- already have one. Defaults: role='staff', must_change_password=true.
-- Ruth and Mariana get promoted in a separate one-line statement after this
-- migration runs (see post-migration notes).
-- =============================================================================

INSERT INTO staff_profiles (id, email, role, must_change_password)
SELECT
  u.id,
  u.email,
  'staff',
  true
FROM auth.users u
LEFT JOIN staff_profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL;

-- =============================================================================
-- DONE
-- Verify with:
--   SELECT COUNT(*) FROM staff_profiles;           -- expect 21
--   SELECT email, role, must_change_password FROM staff_profiles ORDER BY email;
--   SELECT COUNT(*) FROM password_events;          -- expect 0
--
-- Confirm every auth.users row got a staff_profiles row
--   SELECT u.email
--   FROM auth.users u
--   LEFT JOIN staff_profiles p ON p.id = u.id
--   WHERE p.id IS NULL;
--   -- Expect: 0 rows
-- =============================================================================
