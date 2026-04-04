import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/availability/clear-day
// Body: { preparer_id: string, date: string }
// Deletes all UNBOOKED slots for a given preparer on a given day.
// Booked slots are preserved (they have appointments attached).
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: { preparer_id?: string; date?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { preparer_id, date } = body;

  if (!preparer_id || !date) {
    return NextResponse.json(
      { error: 'preparer_id and date are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Delete all unbooked slots for this preparer on this date
  const { data, error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('preparer_id', preparer_id)
    .eq('date', date)
    .eq('is_booked', false)
    .select('id');

  if (error) {
    console.error('[POST /api/availability/clear-day]', error);
    return NextResponse.json({ error: 'Failed to clear slots' }, { status: 500 });
  }

  return NextResponse.json({
    deleted: data?.length ?? 0,
    message: `Cleared ${data?.length ?? 0} open slot${(data?.length ?? 0) === 1 ? '' : 's'}`,
  });
}
