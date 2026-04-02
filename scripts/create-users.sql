-- =============================================================================
-- HispanUSA AIOS — Initial Staff User Accounts
-- =============================================================================
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New Query).
--
-- HOW TO USE:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this script and run it
--   3. All accounts are created with temporary password: HispanUSA2026!
--   4. Staff go to /login, enter their email + that password, and sign in
--   5. Tell each staff member to change their password after first login
--
-- IMPORTANT: Run this only ONCE against production. Running it a second time
-- will fail with "User already registered" for existing emails (safe to ignore).
-- =============================================================================

-- Owner
SELECT auth.create_user(
  '{"email": "ruth@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Ruth Chaverra", "role": "owner"}}'::jsonb
);

-- Troy (admin / builder access)
SELECT auth.create_user(
  '{"email": "troy@darkhorsesystems.io", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Troy Montalvo", "role": "admin"}}'::jsonb
);

-- Receptionists
SELECT auth.create_user(
  '{"email": "beatriz@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Beatriz", "role": "receptionist"}}'::jsonb
);

SELECT auth.create_user(
  '{"email": "marcela@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Marcela", "role": "receptionist"}}'::jsonb
);

SELECT auth.create_user(
  '{"email": "isabel@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Isabel", "role": "receptionist"}}'::jsonb
);

SELECT auth.create_user(
  '{"email": "shelby@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Shelby", "role": "receptionist"}}'::jsonb
);

-- Tax Preparers
SELECT auth.create_user(
  '{"email": "nathaly@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Nathaly", "role": "preparer"}}'::jsonb
);

SELECT auth.create_user(
  '{"email": "marycela@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Marycela", "role": "preparer"}}'::jsonb
);

SELECT auth.create_user(
  '{"email": "oraise@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Oraise", "role": "preparer"}}'::jsonb
);

SELECT auth.create_user(
  '{"email": "emely@hispanusa.com", "password": "HispanUSA2026!", "email_confirm": true, "user_metadata": {"name": "Emely", "role": "preparer"}}'::jsonb
);
