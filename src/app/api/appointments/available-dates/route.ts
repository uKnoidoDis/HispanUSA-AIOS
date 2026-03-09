import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { addThirtyMinutes } from '@/lib/availability-utils';

// GET /api/appointments/available-dates?type=personal_tax&months=2
// Returns array of YYYY-MM-DD strings that have available slots for the given type.
// personal_tax / professional_services = needs 1 free 30-min slot
// corporate_tax = needs 2 consecutive free 30-min slots

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'personal_tax';
  const months = Math.min(parseInt(searchParams.get('months') ?? '2', 10), 6);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const future = new Date(today);
  future.setMonth(future.getMonth() + months);
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

  // Group slots by date
  const byDate = new Map<string, string[]>();
  for (const slot of slots) {
    const existing = byDate.get(slot.date) ?? [];
    existing.push(slot.start_time as string);
    byDate.set(slot.date, existing);
  }

  const isCorporate = type === 'corporate_tax';
  const availableDates: string[] = [];

  for (const [date, times] of Array.from(byDate.entries())) {
    if (!isCorporate) {
      // Any date with at least one slot works
      availableDates.push(date);
    } else {
      // Need two consecutive 30-min slots
      const timeSet = new Set(times);
      const hasConsecutive = times.some(slotTime => timeSet.has(addThirtyMinutes(slotTime)));
      if (hasConsecutive) availableDates.push(date);
    }
  }

  return NextResponse.json(availableDates);
}
