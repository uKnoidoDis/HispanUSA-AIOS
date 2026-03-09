// ─── Calendar Component Types ────────────────────────────────────────────────
// These extend the scheduling types with the joined preparer field returned by
// the appointments API (preparer:preparers(id, name, color_hex, color_name)).

export interface CalendarPreparer {
  id: string;
  name: string;
  color_hex: string;
  color_name: string;
}

export interface CalendarAppt {
  id: string;
  preparer_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  appointment_type: 'personal_tax' | 'corporate_tax' | 'professional_services';
  service_subtype: string | null;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM:SS
  end_time: string;    // HH:MM:SS
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  language: 'en' | 'es';
  notes: string | null;
  preparer: CalendarPreparer | null;
}

export interface CalendarMessage {
  id: string;
  channel: string;
  message_type: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
}

export interface CalendarApptDetail extends CalendarAppt {
  messages: CalendarMessage[];
}

export type CalendarViewMode = 'week' | 'day' | 'month';
