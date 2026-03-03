import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { buildAndSendMessages } from '@/lib/message-builder';
import { getReminderSchedule } from '@/lib/reminder-scheduler';
import { todayString } from '@/lib/utils';
import type { ChecklistType, ReminderTrigger } from '@/types';

export async function GET(request: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const today = todayString();
  const schedule = getReminderSchedule(today);

  const results = {
    processed: 0,
    sent_sms: 0,
    sent_email: 0,
    failed: 0,
    details: [] as Array<{
      trigger: ReminderTrigger;
      appointment_id: string;
      client_name: string;
      sms: boolean | null;
      email: boolean | null;
    }>,
  };

  for (const { trigger, targetDate } of schedule) {
    // Query appointments on target date that haven't received this reminder and docs aren't done
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        checklists:appointment_checklists(*),
        sent_messages:message_log(id, trigger, status, channel)
      `)
      .eq('appointment_date', targetDate)
      .neq('doc_status', 'docs_received');

    if (error) {
      console.error(`Error querying appointments for trigger ${trigger}:`, error);
      continue;
    }

    const due = (appointments ?? []).filter((appt: Record<string, unknown>) => {
      const msgs = (appt.sent_messages as Array<{ trigger: string; status: string }>) ?? [];
      return !msgs.some(m => m.trigger === trigger && m.status === 'sent');
    });

    for (const appt of due) {
      results.processed++;
      const client = appt.client as Record<string, unknown>;
      const checklistTypes = (appt.checklists as Array<{ checklist_type: ChecklistType }>).map(c => c.checklist_type);

      try {
        const msgResults = await buildAndSendMessages(
          appt as unknown as Parameters<typeof buildAndSendMessages>[0],
          client as unknown as Parameters<typeof buildAndSendMessages>[1],
          checklistTypes,
          trigger as ReminderTrigger,
          supabase
        );

        if (msgResults.sms?.success) results.sent_sms++;
        else if (msgResults.sms && !msgResults.sms.success) results.failed++;

        if (msgResults.email?.success) results.sent_email++;
        else if (msgResults.email && !msgResults.email.success) results.failed++;

        results.details.push({
          trigger: trigger as ReminderTrigger,
          appointment_id: appt.id as string,
          client_name: `${client.first_name} ${client.last_name}`,
          sms: msgResults.sms?.success ?? null,
          email: msgResults.email?.success ?? null,
        });
      } catch (err) {
        results.failed++;
        console.error(`Failed to send for appointment ${appt.id}:`, err);
      }
    }
  }

  return NextResponse.json(results);
}
