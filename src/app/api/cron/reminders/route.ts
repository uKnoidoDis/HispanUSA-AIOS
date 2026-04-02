import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendReminderMessage, type MessagingAppt } from '@/lib/messaging';
import { todayString, addDaysToDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET /api/cron/reminders
// Runs daily at 8 AM EST (0 13 * * * UTC) via Vercel Cron.
// Sends 7-day, 3-day, and 1-day reminders for confirmed appointments.
// Skips if a reminder of that type has already been sent (idempotent).
//
// Security: requires CRON_SECRET via Authorization header (Bearer) or
// Vercel's x-vercel-cron-secret header. Returns 401 otherwise.

type ReminderType = 'reminder_7d' | 'reminder_3d' | 'reminder_1d';

const REMINDER_SCHEDULE: { type: ReminderType; daysAhead: number }[] = [
  { type: 'reminder_7d', daysAhead: 7 },
  { type: 'reminder_3d', daysAhead: 3 },
  { type: 'reminder_1d', daysAhead: 1 },
];

export async function GET(request: NextRequest) {
  // ── Auth: verify CRON_SECRET ─────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[CRON] CRON_SECRET env var is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Accept the secret via Vercel's native header or a standard Bearer token.
  const vercelHeader = request.headers.get('x-vercel-cron-secret');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (vercelHeader !== secret && bearerToken !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ─────────────────────────────────────────────────────────────────────────

  const supabase = createServerClient();
  const today = todayString();

  const results: Record<string, { sent: number; skipped: number; errors: number }> = {
    reminder_7d: { sent: 0, skipped: 0, errors: 0 },
    reminder_3d: { sent: 0, skipped: 0, errors: 0 },
    reminder_1d: { sent: 0, skipped: 0, errors: 0 },
  };

  for (const { type, daysAhead } of REMINDER_SCHEDULE) {
    const targetDate = addDaysToDate(today, daysAhead);

    // Fetch all confirmed appointments for that date
    const { data: appointments, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', targetDate)
      .eq('status', 'confirmed');

    if (fetchErr) {
      console.error(`[CRON] Failed to fetch appointments for ${targetDate}:`, fetchErr.message);
      continue;
    }

    for (const appt of (appointments ?? [])) {
      // Check if this reminder type was already sent (any channel)
      const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('appointment_id', appt.id as string)
        .eq('message_type', type)
        .eq('status', 'sent')
        .limit(1)
        .maybeSingle();

      if (existingMsg) {
        results[type].skipped++;
        continue;
      }

      const messagingAppt: MessagingAppt = {
        id:                   appt.id as string,
        client_name:          appt.client_name as string,
        client_phone:         appt.client_phone as string,
        client_email:         appt.client_email as string | null,
        appointment_type:     appt.appointment_type as MessagingAppt['appointment_type'],
        service_subtype:      appt.service_subtype as string | null,
        date:                 appt.date as string,
        start_time:           appt.start_time as string,
        language:             appt.language as 'en' | 'es',
        auto_send_checklist:  appt.auto_send_checklist as boolean,
        checklist_sent:       appt.checklist_sent as boolean,
      };

      try {
        await sendReminderMessage(messagingAppt, supabase, type);
        results[type].sent++;
      } catch (e) {
        console.error(`[CRON] sendReminderMessage failed for ${appt.id}:`, e);
        results[type].errors++;
      }
    }
  }

  console.log('[CRON] reminders complete:', results);
  return NextResponse.json({ date: today, results });
}
