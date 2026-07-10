import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPresetStartTimes, addThirtyMinutes } from '@/lib/availability-utils';
import { easternDateString, isBookableEastern } from '@/lib/utils';
import type { SlotPreset } from '@/types/scheduling';

// ---------------------------------------------------------------------------
// POST /api/availability/bulk
// Body: { preparer_id: string, dates: string[], preset: SlotPreset }
//       (legacy single `date: string` still accepted — TECH DEBT: remove the
//        legacy form one release after the Availability scope-toggle ships)
// Opens preset slots on every given date, in ONE call (week = up to 6 dates,
// month = up to ~27). Write-time past guard: fully-past dates are skipped and
// today keeps only slots passing isBookableEastern (15-min buffer) — opening
// availability can never create dead slots. Duplicates are ignored via the
// uniq_slot_preparer_date_start constraint (migration 012), which replaces the
// old SELECT-then-INSERT dedup and closes its race window.
// Returns: { created, skipped: { pastDays: string[], pastSlotsToday: number } }
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATES = 31;

export async function POST(request: NextRequest) {
  let body: { preparer_id?: string; dates?: string[]; date?: string; preset?: SlotPreset };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { preparer_id, preset } = body;
  const dates = Array.isArray(body.dates)
    ? body.dates
    : typeof body.date === 'string'
      ? [body.date]
      : null;

  if (!preparer_id || !preset || !dates || dates.length === 0) {
    return NextResponse.json(
      { error: 'preparer_id, dates[], and preset are required' },
      { status: 400 }
    );
  }
  if (dates.length > MAX_DATES) {
    return NextResponse.json(
      { error: `Too many dates (max ${MAX_DATES})` },
      { status: 400 }
    );
  }
  if (dates.some(d => !DATE_RE.test(d))) {
    return NextResponse.json(
      { error: 'Dates must be YYYY-MM-DD' },
      { status: 400 }
    );
  }

  const startTimes = getPresetStartTimes(preset);
  if (startTimes.length === 0) {
    return NextResponse.json({ error: `Invalid preset: ${preset}` }, { status: 400 });
  }

  // ── Write-time past guard (Eastern, buffer-aware) ─────────────────────────
  const today = easternDateString();
  const pastDays: string[] = [];
  let pastSlotsToday = 0;

  const rows: {
    preparer_id: string; date: string; start_time: string; end_time: string; is_booked: boolean;
  }[] = [];

  for (const date of dates) {
    if (date < today) {
      pastDays.push(date);
      continue;
    }
    for (const st of startTimes) {
      if (!isBookableEastern(date, st)) {
        // Only today can partially fail the check for a non-past date.
        pastSlotsToday++;
        continue;
      }
      rows.push({
        preparer_id,
        date,
        start_time: st,
        end_time: addThirtyMinutes(st),
        is_booked: false,
      });
    }
  }

  const skipped = { pastDays, pastSlotsToday };

  if (rows.length === 0) {
    return NextResponse.json({ created: 0, skipped, message: 'Nothing to open — all requested slots are in the past' });
  }

  const supabase = createServerClient();

  // ignoreDuplicates: existing (preparer_id, date, start_time) rows are left
  // untouched; .select() returns only the rows actually inserted.
  const { data, error } = await supabase
    .from('availability_slots')
    .upsert(rows, { onConflict: 'preparer_id,date,start_time', ignoreDuplicates: true })
    .select('id');

  if (error) {
    console.error('[POST /api/availability/bulk]', error);
    return NextResponse.json({ error: 'Failed to create slots' }, { status: 500 });
  }

  return NextResponse.json({ created: data.length, skipped }, { status: 201 });
}
