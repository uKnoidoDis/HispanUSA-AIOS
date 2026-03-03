import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { buildAndSendMessages } from '@/lib/message-builder';
import type { ChecklistType } from '@/types';

const sendChecklistSchema = z.object({
  channel: z.enum(['sms', 'email', 'both']).default('both'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = sendChecklistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Load appointment with client and checklists
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select(`*, client:clients(*), checklists:appointment_checklists(*)`)
    .eq('id', params.id)
    .single();

  if (apptError || !appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const client = appointment.client;
  const checklistTypes = (appointment.checklists as Array<{ checklist_type: ChecklistType }>).map(c => c.checklist_type);

  const results = await buildAndSendMessages(
    appointment,
    client,
    checklistTypes,
    'manual_resend',
    supabase
  );

  return NextResponse.json({ success: true, results });
}
