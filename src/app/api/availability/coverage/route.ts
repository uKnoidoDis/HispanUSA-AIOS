import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { todayString, hasSlotStartedEastern } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/availability/coverage
//
// How far out does OPEN (unbooked, not yet started) availability actually run,
// across ALL active preparers? Feeds the staff coverage banner.
//
// Returns: { last_open_date: string | null, open_slot_count: number, today: string }
//   last_open_date === null  -> no open future availability at all.
//
// AUTH: guarded by src/middleware.ts, NOT by code in this file. The matcher
// covers '/api/availability/:path*' and isStaffApi matches the same prefix, so
// an unauthenticated request gets a 401 and a must-change-password user gets a
// 403 before this handler runs. That is exactly why this route lives under
// /api/availability/ rather than at /api/coverage, which the matcher would not
// cover. Do NOT add this path to PUBLIC_API_PATHS.
//
// Read-only: SELECTs only. No writes, no migration, no stored expiry state.
// ---------------------------------------------------------------------------
export async function GET() {
  const supabase = createServerClient();
  const today = todayString(); // Eastern calendar date

  // Query 1: today's open slots. A day whose slots have ALL started no longer
  // counts as coverage, so the time-of-day filter runs in JS via the shared
  // Eastern predicate (PostgREST cannot express "start_time is still ahead of
  // Eastern now" without a stored column, which requirement 3 forbids).
  //
  // preparers!inner + is_active filter restricts to bookable preparers, so a
  // deactivated preparer's leftover slots cannot mask an empty calendar.
  const { data: todayRows, error: todayError } = await supabase
    .from('availability_slots')
    .select('start_time, preparers!inner(is_active)')
    .eq('is_booked', false)
    .eq('date', today)
    .eq('preparers.is_active', true);

  if (todayError) {
    console.error('[GET /api/availability/coverage] today query error:', todayError);
    return NextResponse.json({ error: 'Failed to compute coverage' }, { status: 500 });
  }

  const liveToday = (todayRows ?? []).filter(
    (r) => !hasSlotStartedEastern(today, r.start_time as string)
  );

  // Query 2: the furthest-out future open date. Ordered descending, limit 1, so
  // this stays cheap no matter how many slots exist.
  const { data: futureRows, error: futureError } = await supabase
    .from('availability_slots')
    .select('date, preparers!inner(is_active)')
    .eq('is_booked', false)
    .gt('date', today)
    .eq('preparers.is_active', true)
    .order('date', { ascending: false })
    .limit(1);

  if (futureError) {
    console.error('[GET /api/availability/coverage] future query error:', futureError);
    return NextResponse.json({ error: 'Failed to compute coverage' }, { status: 500 });
  }

  const furthestFuture = (futureRows ?? [])[0]?.date as string | undefined;

  // Later of the two. Both are YYYY-MM-DD so string compare is exact.
  let lastOpenDate: string | null = null;
  if (furthestFuture) lastOpenDate = furthestFuture;
  if (liveToday.length > 0 && (!lastOpenDate || today > lastOpenDate)) lastOpenDate = today;

  // last_open_date === null is the sole "no coverage" signal. live_slots_today
  // is reported because it is a real, exact number that costs nothing extra
  // (query 1 already returned the rows) and is useful when reading the response
  // by hand. Deliberately NOT a total forward count: that would mean scanning
  // every open row to tell the banner something last_open_date already says.
  return NextResponse.json({
    last_open_date: lastOpenDate,
    live_slots_today: liveToday.length,
    today,
  });
}
