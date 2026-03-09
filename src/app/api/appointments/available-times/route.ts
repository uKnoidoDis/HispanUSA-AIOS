import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { addThirtyMinutes } from '@/lib/availability-utils';

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

  const supabase = createServerClient();

  const { data: slots, error } = await supabase
    .from('availability_slots')
    .select('start_time')
    .eq('date', date)
    .eq('is_booked', false)
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const times = (slots ?? []).map(s => (s.start_time as string).slice(0, 5)); // 'HH:MM'

  if (type !== 'corporate_tax') {
    return NextResponse.json(times);
  }

  // For corporate (60 min): only slots where the next 30-min slot is also free
  const timeSet = new Set((slots ?? []).map(s => s.start_time as string));
  const consecutiveTimes = times.filter(t => {
    const tFull = `${t}:00`;
    return timeSet.has(addThirtyMinutes(tFull));
  });

  return NextResponse.json(consecutiveTimes);
}
