import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/preparers — returns all active preparers ordered by name
export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('preparers')
    .select('id, name, color_hex, color_name, is_active, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('[GET /api/preparers]', error);
    return NextResponse.json({ error: 'Failed to fetch preparers' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
