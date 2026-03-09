import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { addThirtyMinutes } from '@/lib/availability-utils';

// ---------------------------------------------------------------------------
// GET /api/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD[&preparer_id=uuid]
// Returns all slots in the range, enriched with preparer color + client name.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const preparerId = searchParams.get('preparer_id');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'start_date and end_date are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Fetch slots with preparer info via FK join
  let query = supabase
    .from('availability_slots')
    .select('*, preparers(name, color_hex)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (preparerId) {
    query = query.eq('preparer_id', preparerId);
  }

  const { data: slots, error: slotsError } = await query;

  if (slotsError) {
    console.error('[GET /api/availability] slots error:', slotsError);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }

  // Fetch appointments in range to get client names for booked slots.
  // The join is logical: preparer_id + date + start_time uniquely identifies
  // the booking since no double-booking is allowed.
  let appointmentMap: Record<string, string> = {};
  const hasBookedSlots = (slots ?? []).some(s => s.is_booked);

  if (hasBookedSlots) {
    const apptQuery = supabase
      .from('appointments')
      .select('preparer_id, date, start_time, client_name')
      .gte('date', startDate)
      .lte('date', endDate)
      .neq('status', 'cancelled');

    const { data: appointments } = preparerId
      ? await apptQuery.eq('preparer_id', preparerId)
      : await apptQuery;

    if (appointments) {
      for (const a of appointments) {
        appointmentMap[`${a.preparer_id}_${a.date}_${a.start_time}`] = a.client_name;
      }
    }
  }

  // Normalize shape — flatten the nested preparers join
  const result = (slots ?? []).map(slot => {
    const preparer = slot.preparers as { name: string; color_hex: string } | null;
    const apptKey = `${slot.preparer_id}_${slot.date}_${slot.start_time}`;

    return {
      id: slot.id,
      preparer_id: slot.preparer_id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_booked: slot.is_booked,
      created_at: slot.created_at,
      preparer_name: preparer?.name ?? '',
      preparer_color: preparer?.color_hex ?? '#6B7280',
      client_name: slot.is_booked ? (appointmentMap[apptKey] ?? null) : null,
    };
  });

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// POST /api/availability
// Body: { preparer_id: string, date: string, start_times: string[] }
// Creates one slot per start_time (30-min duration). Skips duplicates.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: { preparer_id?: string; date?: string; start_times?: string[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { preparer_id, date, start_times } = body;

  if (!preparer_id || !date || !Array.isArray(start_times) || start_times.length === 0) {
    return NextResponse.json(
      { error: 'preparer_id, date, and start_times[] are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Check which times already exist so we can skip them
  const { data: existing } = await supabase
    .from('availability_slots')
    .select('start_time')
    .eq('preparer_id', preparer_id)
    .eq('date', date)
    .in('start_time', start_times);

  const existingTimes = new Set((existing ?? []).map(e => e.start_time));

  const newSlots = start_times
    .filter(st => !existingTimes.has(st))
    .map(st => ({
      preparer_id,
      date,
      start_time: st,
      end_time: addThirtyMinutes(st),
      is_booked: false,
    }));

  if (newSlots.length === 0) {
    return NextResponse.json({ created: 0, slots: [], message: 'All slots already exist' });
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .insert(newSlots)
    .select('id, preparer_id, date, start_time, end_time, is_booked, created_at');

  if (error) {
    console.error('[POST /api/availability]', error);
    return NextResponse.json({ error: 'Failed to create slots' }, { status: 500 });
  }

  return NextResponse.json({ created: data.length, slots: data }, { status: 201 });
}
