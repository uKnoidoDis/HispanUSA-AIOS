import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPresetStartTimes, addThirtyMinutes } from '@/lib/availability-utils';
import type { SlotPreset } from '@/types/scheduling';

// ---------------------------------------------------------------------------
// POST /api/availability/bulk
// Body: { preparer_id: string, date: string, preset: SlotPreset }
// Opens all slots for the given preset on the given date. Skips existing slots.
// Returns: { created: number }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: { preparer_id?: string; date?: string; preset?: SlotPreset };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { preparer_id, date, preset } = body;

  if (!preparer_id || !date || !preset) {
    return NextResponse.json(
      { error: 'preparer_id, date, and preset are required' },
      { status: 400 }
    );
  }

  const startTimes = getPresetStartTimes(preset);

  if (startTimes.length === 0) {
    return NextResponse.json({ error: `Invalid preset: ${preset}` }, { status: 400 });
  }

  const supabase = createServerClient();

  // Skip any start_times that already exist for this preparer+date
  const { data: existing } = await supabase
    .from('availability_slots')
    .select('start_time')
    .eq('preparer_id', preparer_id)
    .eq('date', date)
    .in('start_time', startTimes);

  const existingTimes = new Set((existing ?? []).map(e => e.start_time));

  const newSlots = startTimes
    .filter(st => !existingTimes.has(st))
    .map(st => ({
      preparer_id,
      date,
      start_time: st,
      end_time: addThirtyMinutes(st),
      is_booked: false,
    }));

  if (newSlots.length === 0) {
    return NextResponse.json({ created: 0, message: 'All slots already exist' });
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .insert(newSlots)
    .select('id');

  if (error) {
    console.error('[POST /api/availability/bulk]', error);
    return NextResponse.json({ error: 'Failed to create slots' }, { status: 500 });
  }

  return NextResponse.json({ created: data.length }, { status: 201 });
}
