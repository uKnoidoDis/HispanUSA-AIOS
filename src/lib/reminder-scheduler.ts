import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReminderTrigger } from '@/types';

export type ScheduledReminder = {
  trigger: ReminderTrigger;
  targetDate: string;
};

export function getReminderSchedule(today: string): ScheduledReminder[] {
  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
  };

  return [
    { trigger: '7_day', targetDate: addDays(today, 7) },
    { trigger: '3_day', targetDate: addDays(today, 3) },
    { trigger: '1_day', targetDate: addDays(today, 1) },
  ];
}

export async function getAppointmentsDueForReminder(
  supabase: SupabaseClient,
  trigger: ReminderTrigger,
  targetDate: string
) {
  // Get appointments on the target date that haven't received this specific reminder
  // and are not already fully completed (docs received)
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(*),
      checklists:appointment_checklists(*),
      sent_messages:message_log(id, trigger, status, channel)
    `)
    .eq('appointment_date', targetDate)
    .neq('doc_status', 'docs_received');

  if (error) throw error;
  if (!data) return [];

  // Filter out appointments that already have a successful send for this trigger
  return data.filter((appt: Record<string, unknown>) => {
    const messages = (appt.sent_messages as Array<{ trigger: string; status: string }>) ?? [];
    return !messages.some(
      (m) => m.trigger === trigger && m.status === 'sent'
    );
  });
}
