import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const createClientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  language_preference: z.enum(['en', 'es']).default('es'),
  is_new_client: z.boolean().default(true),
  has_dependents: z.boolean().default(false),
  is_corporate: z.boolean().default(false),
  canopy_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(data => data.phone || data.email, {
  message: 'At least one of phone or email is required',
});

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';

  let query = supabase.from('clients').select('*').order('last_name', { ascending: true });

  if (search.length > 0) {
    query = query.or(
      `last_name.ilike.%${search}%,first_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
