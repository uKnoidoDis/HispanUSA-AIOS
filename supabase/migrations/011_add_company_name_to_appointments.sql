-- 011_add_company_name_to_appointments.sql
-- Company name for corporate appointment types (corporate_tax, personal_corporate_tax).
-- Nullable by design: the client booking portal requires it for corporate types
-- (enforced in the app layer), staff bookings may leave it blank (warn-don't-block).
ALTER TABLE appointments ADD COLUMN company_name TEXT;
