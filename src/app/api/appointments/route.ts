import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { resolveChecklists } from '@/lib/checklist-router';
import { buildAndSendMessages } from '@/lib/message-builder';

const createAppointmentSchema = z.object({
  // Client fields (used for upsert)
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  language_preference: z.enum(['en', 'es']).default('es'),
  canopy_id: z.string().optional().nullable(),
  // Appointment fields
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.number().int().positive().default(30),
  method: z.enum(['in_person', 'zoom', 'telephone', 'whatsapp']).default('in_person'),
  appointment_type: z.enum(['personal_returning', 'personal_new', 'corporate']),
  has_dependents: z.boolean().default(false),
  is_new_client: z.boolean().default(false),
  booked_by: z.string().optional().nullable(),
  assigned_preparer: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(data => data.phone || data.email, {
  message: 'At least one of phone or email is required',
});

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('appointments')
    .select(`*, client:clients(*)`)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (date) {
    query = query.eq('appointment_date', date);
  }
  if (status) {
    query = query.eq('doc_status', status);
  }
  if (search) {
    // Join search not directly possible via PostgREST on related table; filter client-side for now
    const { data: allData, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const lower = search.toLowerCase();
    const filtered = (allData ?? []).filter((appt: Record<string, unknown>) => {
      const c = appt.client as Record<string, string> | null;
      if (!c) return false;
      return (
        c.first_name?.toLowerCase().includes(lower) ||
        c.last_name?.toLowerCase().includes(lower) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(lower)
      );
    });
    return NextResponse.json(filtered);
  }

  const { data, error } = await query;
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

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  // Step 1: Upsert client — search by phone OR email
  let client;
  {
    const orParts: string[] = [];
    if (input.phone) orParts.push(`phone.eq.${input.phone}`);
    if (input.email) orParts.push(`email.eq.${input.email}`);

    const { data: existing } = await supabase
      .from('clients')
      .select('*')
      .or(orParts.join(','))
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update existing client with latest info
      const { data: updated, error: updateError } = await supabase
        .from('clients')
        .update({
          email: input.email ?? existing.email,
          phone: input.phone ?? existing.phone,
          language_preference: input.language_preference,
          canopy_id: input.canopy_id ?? existing.canopy_id,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
      client = updated;
    } else {
      // Create new client
      const { data: created, error: createError } = await supabase
        .from('clients')
        .insert({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          phone: input.phone,
          language_preference: input.language_preference,
          is_new_client: input.is_new_client,
          has_dependents: input.has_dependents,
          is_corporate: input.appointment_type === 'corporate',
          canopy_id: input.canopy_id,
        })
        .select()
        .single();

      if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
      client = created;
    }
  }

  // Step 2: Create appointment
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      client_id: client.id,
      appointment_date: input.appointment_date,
      appointment_time: input.appointment_time + ':00',
      duration_minutes: input.duration_minutes,
      method: input.method,
      appointment_type: input.appointment_type,
      has_dependents: input.has_dependents,
      is_new_client: input.is_new_client,
      doc_status: 'not_sent',
      booked_by: input.booked_by,
      assigned_preparer: input.assigned_preparer,
      notes: input.notes,
    })
    .select()
    .single();

  if (apptError) return NextResponse.json({ error: apptError.message }, { status: 500 });

  // Step 3: Resolve checklists
  const checklistTypes = resolveChecklists(appointment);

  // Step 4: Insert appointment_checklists
  await supabase.from('appointment_checklists').insert(
    checklistTypes.map(type => ({
      appointment_id: appointment.id,
      checklist_type: type,
      language: client.language_preference,
    }))
  );

  // Step 5: Send messages (fire-and-forget style — appointment was created regardless)
  console.log('[APPOINTMENT] Route hit — appointment created:', appointment.id, '| client phone:', client.phone, '| client email:', client.email);
  let messageResults;
  try {
    messageResults = await buildAndSendMessages(appointment, client, checklistTypes, 'immediate', supabase);
    // Update doc_status to checklist_sent
    await supabase
      .from('appointments')
      .update({ doc_status: 'checklist_sent' })
      .eq('id', appointment.id);
  } catch (err) {
    messageResults = { sms: null, email: null, error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json(
    {
      appointment_id: appointment.id,
      client_id: client.id,
      checklists_sent: checklistTypes,
      messages_sent: messageResults,
    },
    { status: 201 }
  );
}
