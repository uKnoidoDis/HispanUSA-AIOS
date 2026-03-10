import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Prevent Next.js from statically caching this response.
// Without this, new client bookings may not appear until the cache invalidates.
export const dynamic = 'force-dynamic';

// GET /api/appointments/pending
// Returns pending appointments list + count for the approval queue.

export async function GET() {
  const supabase = createServerClient();

  const { data, error, count } = await supabase
    .from('appointments')
    .select('*, preparer:preparers(id, name, color_hex)', { count: 'exact' })
    .eq('status', 'pending')
    .eq('booked_by', 'client')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: count ?? 0, items: data ?? [] });
}
