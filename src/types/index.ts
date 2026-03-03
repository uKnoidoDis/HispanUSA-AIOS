export type LanguagePreference = 'en' | 'es';
export type AppointmentType = 'personal_returning' | 'personal_new' | 'corporate';
export type AppointmentMethod = 'in_person' | 'zoom' | 'telephone' | 'whatsapp';
export type ChecklistType = 'checklist_1' | 'checklist_2' | 'checklist_3' | 'checklist_4';
export type ReminderTrigger = 'immediate' | '7_day' | '3_day' | '1_day' | 'manual_resend';
export type MessageChannel = 'sms' | 'email';
export type MessageStatus = 'sent' | 'failed' | 'pending';
export type DocStatus = 'not_sent' | 'checklist_sent' | 'confirmed' | 'folder_opened' | 'docs_received';

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  language_preference: LanguagePreference;
  is_new_client: boolean;
  has_dependents: boolean;
  is_corporate: boolean;
  canopy_id: string | null;
  notes: string | null;
}

export interface Appointment {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  method: AppointmentMethod;
  appointment_type: AppointmentType;
  has_dependents: boolean;
  is_new_client: boolean;
  doc_status: DocStatus;
  booked_by: string | null;
  assigned_preparer: string | null;
  calendar_entry: string | null;
  notes: string | null;
}

export interface AppointmentWithClient extends Appointment {
  client: Client;
}

export interface AppointmentChecklist {
  id: string;
  appointment_id: string;
  checklist_type: ChecklistType;
  language: LanguagePreference;
  created_at: string;
}

export interface MessageLog {
  id: string;
  created_at: string;
  appointment_id: string;
  client_id: string;
  channel: MessageChannel;
  trigger: ReminderTrigger;
  language: LanguagePreference;
  recipient: string;
  subject: string | null;
  body: string;
  status: MessageStatus;
  provider_id: string | null;
  error_message: string | null;
  sent_at: string | null;
}

export interface AppointmentDetail extends Appointment {
  client: Client;
  checklists: AppointmentChecklist[];
  messages: MessageLog[];
}

export interface ChecklistSection {
  title: string;
  items: string[];
}

export interface ChecklistContent {
  type: ChecklistType;
  language: LanguagePreference;
  title: string;
  sections: ChecklistSection[];
  sendTo?: string;
  notes?: string;
}

export interface TemplateVars {
  firstName: string;
  date: string;
  time: string;
  daysUntil?: number;
}

export interface SmsTemplate {
  body: (vars: TemplateVars) => string;
}

export interface EmailTemplate {
  subject: (vars: TemplateVars) => string;
  html: (vars: TemplateVars, checklistsHtml: string) => string;
}

export interface MessageResult {
  success: boolean;
  channel: MessageChannel;
  recipient: string;
  providerId?: string;
  error?: string;
}
