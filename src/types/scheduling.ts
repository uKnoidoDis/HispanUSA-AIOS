// ============================================================
// Scheduling System Types
// Matches the schema in 002_scheduling_schema.sql + 003_add_messaging_fields.sql
// ============================================================

export interface Preparer {
  id: string;
  name: string;
  color_hex: string;  // e.g. '#3B82F6'
  color_name: string; // e.g. 'Blue'
  is_active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  preparer_id: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM:SS
  end_time: string;    // HH:MM:SS
  is_booked: boolean;
  created_at: string;
}

// Slot enriched with preparer info + client name (from joined appointment)
export interface SlotWithMeta extends AvailabilitySlot {
  preparer_name: string;
  preparer_color: string;
  client_name: string | null; // present only if is_booked = true
}

export type SlotPreset = 'morning' | 'afternoon' | 'full_day' | 'full_day_tax';

export interface BulkAvailabilityRequest {
  preparer_id: string;
  date: string; // YYYY-MM-DD
  preset: SlotPreset;
}

export interface CopyWeekRequest {
  preparer_id: string;
  source_week_start: string; // YYYY-MM-DD (must be a Monday)
}

export type AppointmentType = 'personal_tax' | 'corporate_tax' | 'personal_corporate_tax' | 'professional_services';
export type ServiceSubtype =
  | 'immigration_consulting'
  | 'immigration_case'
  | 'divorce_consulting'
  | 'divorce_case'
  | 'bankruptcy_consulting'
  | 'bankruptcy_case'
  | 'offer_in_compromise_consulting'
  | 'offer_in_compromise_case'
  | 'general_consulting'
  | 'other';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately';

// One row per person attached to an appointment (spouse or dependent) —
// appointment_people table, migration 013. Spouse rows have relationship null.
export interface AppointmentPerson {
  id: string;
  role: 'spouse' | 'dependent';
  name: string;
  dob: string; // YYYY-MM-DD
  relationship: string | null;
  filing_with_us: boolean;
}

export interface Appointment {
  id: string;
  preparer_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  company_name: string | null; // corporate types only; nullable (staff may skip)
  filing_status: FilingStatus | null; // personal types only; nullable (staff may skip)
  appointment_type: AppointmentType;
  service_subtype: ServiceSubtype | null;
  service_subtype_other: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  language: 'en' | 'es';
  booked_by: 'client' | 'staff';
  checklist_sent: boolean;
  auto_send_checklist: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
