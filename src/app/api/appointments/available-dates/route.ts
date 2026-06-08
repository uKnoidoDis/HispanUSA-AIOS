import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { slotsForType, consecutiveFreeFrom } from '@/lib/availability-utils';
import { easternDateString, isBookableEastern } from '@/lib/utils';

// GET /api/appointments/available-dates?type=personal_tax&months=2
// Returns array of YYYY-MM-DD strings that have available slots for the given type.
// personal_tax / professional_services = needs 1 free 30-min slot
// corporate_tax = needs 2 consecutive free 30-min slots

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'personal_tax';
  const months = Math.min(parseInt(searchParams.get('months') ?? '2', 10), 6);

  const todayStr = easternDateString(); // Eastern calendar date (lower bound)
  // Upper bound: `months` out. Anchor at UTC noon so month math can't roll the
  // date across a TZ boundary, then read the date back.
  const future = new Date(`${todayStr}T12:00:00Z`);
  future.setUTCMonth(future.getUTCMonth() + months);
  const futureStr = future.toISOString().slice(0, 10);

  const supabase = createServerClient();

  // Fetch all unbooked slots in the range
  const { data: slots, error } = await supabase
    .from('availability_slots')
    .select('date, start_time, end_time')
    .eq('is_booked', false)
    .gte('date', todayStr)
    .lte('date', futureStr)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!slots || slots.length === 0) {
    return NextResponse.json([]);
  }

  // Group slots by date, dropping any slot whose start time has already passed
  // (Eastern, + lead buffer). A day whose every remaining slot has expired produces
  // no entry here and therefore drops off the date picker entirely.
  const byDate = new Map<string, string[]>();
  for (const slot of slots) {
    if (!isBookableEastern(slot.date as string, slot.start_time as string)) continue;
    const existing = byDate.get(slot.date) ?? [];
    existing.push(slot.start_time as string);
    byDate.set(slot.date, existing);
  }

  const count = slotsForType(type);
  const availableDates: string[] = [];

  for (const [date, times] of Array.from(byDate.entries())) {
    if (count === 1) {
      // Any date with at least one slot works
      availableDates.push(date);
    } else {
      // Need `count` consecutive 30-min slots (corporate_tax = 2, personal_corporate_tax = 3)
      const timeSet = new Set(times);
      const hasConsecutive = times.some(slotTime => consecutiveFreeFrom(timeSet, slotTime, count));
      if (hasConsecutive) availableDates.push(date);
    }
  }

  return NextResponse.json(availableDates);
}
