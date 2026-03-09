import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { addDays, format, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// POST /api/availability/copy-week
// Body: { preparer_id: string, source_week_start: string } (Monday, YYYY-MM-DD)
// Copies all unbooked slots from Mon–Sat of source week to Mon–Sat of next week.
// Skips any target slots that already exist.
// Returns: { created: number }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: { preparer_id?: string; source_week_start?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { preparer_id, source_week_start } = body;

  if (!preparer_id || !source_week_start) {
    return NextResponse.json(
      { error: 'preparer_id and source_week_start are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Source: Mon–Sat of source week (6 days)
  const sourceStart = parseISO(source_week_start);
  const sourceEnd = addDays(sourceStart, 5); // Saturday

  // Target: Mon–Sat of next week
  const targetStart = addDays(sourceStart, 7);
  const targetEnd = addDays(targetStart, 5);

  const sourceStartStr = format(sourceStart, 'yyyy-MM-dd');
  const sourceEndStr = format(sourceEnd, 'yyyy-MM-dd');
  const targetStartStr = format(targetStart, 'yyyy-MM-dd');
  const targetEndStr = format(targetEnd, 'yyyy-MM-dd');

  // Fetch unbooked slots from source week
  const { data: sourceSlots, error: sourceError } = await supabase
    .from('availability_slots')
    .select('date, start_time, end_time')
    .eq('preparer_id', preparer_id)
    .gte('date', sourceStartStr)
    .lte('date', sourceEndStr)
    .eq('is_booked', false);

  if (sourceError) {
    console.error('[POST /api/availability/copy-week] source fetch error:', sourceError);
    return NextResponse.json({ error: 'Failed to fetch source slots' }, { status: 500 });
  }

  if (!sourceSlots || sourceSlots.length === 0) {
    return NextResponse.json({
      created: 0,
      message: 'No unbooked slots found in source week',
    });
  }

  // Build the target slots (same time, +7 days)
  const targetSlots = sourceSlots.map(slot => ({
    preparer_id,
    date: format(addDays(parseISO(slot.date), 7), 'yyyy-MM-dd'),
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_booked: false,
  }));

  // Check for already-existing slots in the target week to avoid duplicates
  const { data: existingTarget } = await supabase
    .from('availability_slots')
    .select('date, start_time')
    .eq('preparer_id', preparer_id)
    .gte('date', targetStartStr)
    .lte('date', targetEndStr);

  const existingKeys = new Set(
    (existingTarget ?? []).map(s => `${s.date}_${s.start_time}`)
  );

  const newSlots = targetSlots.filter(
    s => !existingKeys.has(`${s.date}_${s.start_time}`)
  );

  if (newSlots.length === 0) {
    return NextResponse.json({
      created: 0,
      message: 'All target slots already exist',
    });
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .insert(newSlots)
    .select('id');

  if (error) {
    console.error('[POST /api/availability/copy-week] insert error:', error);
    return NextResponse.json({ error: 'Failed to copy slots' }, { status: 500 });
  }

  return NextResponse.json({ created: data.length });
}
