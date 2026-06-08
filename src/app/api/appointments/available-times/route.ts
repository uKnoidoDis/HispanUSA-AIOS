import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { slotsForType, consecutiveFreeFrom } from '@/lib/availability-utils';
import { easternDateString, isBookableEastern } from '@/lib/utils';

// GET /api/appointments/available-times?date=2026-03-15&type=personal_tax
// Returns array of available start time strings ("09:00", "09:30", …) for the given date.
// For corporate_tax (60 min), only returns times where a consecutive second slot is also free.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const type = searchParams.get('type') ?? 'personal_tax';

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 });
  }

  // Past day -> nothing is bookable. (This route previously had no date floor at all.)
  if (date < easternDateString()) {
    return NextResponse.json([]);
  }

  const supabase = createServerClient();

  const { data: slots, error } = await supabase
    .from('availability_slots')
    .select('start_time')
    .eq('date', date)
    .eq('is_booked', false)
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Drop today's already-passed times (Eastern, + lead buffer). Future days unaffected.
  const liveSlots = (slots ?? []).filter(s => isBookableEastern(date, s.start_time as string));

  const times = liveSlots.map(s => (s.start_time as string).slice(0, 5)); // 'HH:MM'

  const count = slotsForType(type);
  if (count === 1) {
    return NextResponse.json(times);
  }

  // Multi-slot types need `count` consecutive free 30-min slots
  // (corporate_tax = 2, personal_corporate_tax = 3). Built from liveSlots so a run
  // whose earlier slot already passed the Eastern buffer is excluded.
  const timeSet = new Set(liveSlots.map(s => s.start_time as string));
  const consecutiveTimes = times.filter(t => consecutiveFreeFrom(timeSet, t, count));

  return NextResponse.json(consecutiveTimes);
}
