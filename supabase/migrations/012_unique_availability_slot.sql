-- 012_unique_availability_slot.sql
-- One slot per preparer per date per start_time. App-side SELECT-then-INSERT
-- dedup had a race window; month-scale bulk writes widen it ~22x. Added at the
-- zero-data moment (prod + staging both at 0 slot rows — no dedup step needed).
ALTER TABLE availability_slots
  ADD CONSTRAINT uniq_slot_preparer_date_start UNIQUE (preparer_id, date, start_time);
