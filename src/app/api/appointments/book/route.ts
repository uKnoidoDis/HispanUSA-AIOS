import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { normalizePhone, easternDateString, isBookableEastern, isPlausibleDob } from '@/lib/utils';
import { addThirtyMinutes, slotStartTimesFor, endTimeFor, includesCorporate, includesPersonal } from '@/lib/availability-utils';
import { sendPendingMessage, type MessagingAppt } from '@/lib/messaging';

// ─── Validation ────────────────────────────────────────────────────────────────

// Version tag for the SMS consent disclosure text shown on the booking form.
// Bump this (year-month) whenever the disclosure wording materially changes,
// so each stored consent record points at the exact text the client agreed to.
const SMS_CONSENT_TEXT_VERSION = 'v1-2026-05';

// DOB: shape via regex, validity via isPlausibleDob (real calendar date, not in
// the future, not more than 120 years past). Shared by spouse + dependents.
const dobSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD')
  .refine(isPlausibleDob, { message: 'DOB must be a valid past date within 120 years' });

const bookSchema = z.object({
  client_name:      z.string().min(2, 'Full name required'),
  client_phone:     z.string().min(10, 'Valid US phone required'),
  client_email:     z.string().email('Invalid email').optional().nullable(),
  company_name:     z.string().trim().max(200).optional().nullable(),
  appointment_type: z.enum(['personal_tax', 'corporate_tax', 'personal_corporate_tax', 'professional_services']),
  service_subtype:  z.enum([
    'immigration_consulting', 'immigration_case',
    'divorce_consulting', 'divorce_case',
    'bankruptcy_consulting', 'bankruptcy_case',
    'offer_in_compromise_consulting', 'offer_in_compromise_case',
    'general_consulting', 'other',
  ]).optional().nullable(),
  service_subtype_other: z.string().trim().max(500).optional().nullable(),
  date:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time:       z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  language:         z.enum(['en', 'es']).default('es'),
  sms_consent:      z.boolean().default(false),
  // Household (migration 013) — personal types only; gated again at write time.
  filing_status:    z.enum(['single', 'married_filing_jointly', 'married_filing_separately']).optional().nullable(),
  spouse:           z.object({
    name: z.string().trim().min(1).max(200),
    dob:  dobSchema,
  }).optional().nullable(),
  dependents:       z.array(z.object({
    name:           z.string().trim().min(1).max(200),
    dob:            dobSchema,
    relationship:   z.string().trim().max(100).optional().nullable(),
    filing_with_us: z.boolean().default(false),
  })).max(10).default([]),
}).refine(
  data => data.appointment_type !== 'professional_services' || !!data.service_subtype,
  { message: 'service_subtype is required for professional_services' }
).refine(
  // When the client picks "Other", they must describe their need (free text).
  data => data.service_subtype !== 'other' || !!data.service_subtype_other?.trim(),
  { message: 'service_subtype_other is required when service_subtype is other' }
).refine(
  // Corporate returns are filed for a company — the client portal must say which.
  // (Staff bookings via /api/appointments deliberately do NOT enforce this.)
  data => !includesCorporate(data.appointment_type) || !!data.company_name?.trim(),
  { message: 'company_name is required for corporate appointment types' }
).refine(
  // Personal returns need a filing status (Ruth's exactly-three values).
  // (Staff bookings via /api/appointments deliberately do NOT enforce this.)
  data => !includesPersonal(data.appointment_type) || !!data.filing_status,
  { message: 'filing_status is required for personal appointment types' }
).refine(
  // A married filing status names a spouse. Only meaningful on personal types.
  data => !includesPersonal(data.appointment_type)
    || !(data.filing_status === 'married_filing_jointly' || data.filing_status === 'married_filing_separately')
    || !!data.spouse,
  { message: 'spouse is required for married filing statuses' }
);

// Extracts the client IP from proxy headers. Never trusts a client-supplied
// body value — only reads headers set by the platform proxy (Vercel). Returns
// the first address in x-forwarded-for, falling back to x-real-ip, else null.
function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();
  return null;
}

// ─── POST /api/appointments/book ───────────────────────────────────────────────
// Public endpoint — no authentication required.
// Creates a PENDING appointment and auto-assigns an available preparer.

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const phone = normalizePhone(input.client_phone);

  // ── Rate limit: max 5 booking requests per phone per calendar day ──────────
  const today = easternDateString();
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('client_phone', phone)
    .eq('booked_by', 'client')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Too many booking requests today. Please call our office at 954-934-0194.' },
      { status: 429 }
    );
  }

  // ── Normalize time ─────────────────────────────────────────────────────────
  const startTime = input.start_time.length === 5
    ? `${input.start_time}:00`
    : input.start_time;

  // Slot count + end_time from slotsForType() (single source of truth):
  // personal_corporate_tax = 3 slots / 90 min, corporate_tax = 2 / 60, else 1 / 30.
  const endTime = endTimeFor(startTime, input.appointment_type);
  const slotStartTimes = slotStartTimesFor(startTime, input.appointment_type);

  // ── Validate requested date is not in the past ─────────────────────────────
  if (input.date < today) {
    return NextResponse.json({ error: 'Cannot book appointments in the past' }, { status: 400 });
  }

  // ── Reject same-day slots whose start time has already passed ───────────────
  // Server backstop so a direct POST can't bypass the read-path expiry filter.
  // For corporate, the first slot's start passing is sufficient to reject.
  if (!isBookableEastern(input.date, startTime)) {
    return NextResponse.json(
      { error: 'Cannot book a time that has already passed. Please choose a later time.' },
      { status: 400 },
    );
  }

  // ── Find an available preparer (first one with all required slots free) ─────
  const { data: candidates, error: slotErr } = await supabase
    .from('availability_slots')
    .select('preparer_id, start_time')
    .eq('date', input.date)
    .eq('start_time', startTime)
    .eq('is_booked', false);

  if (slotErr) return NextResponse.json({ error: slotErr.message }, { status: 500 });

  let assignedPreparerId: string | null = null;

  for (const slot of (candidates ?? [])) {
    const preparerId = slot.preparer_id as string;

    if (slotStartTimes.length === 1) {
      assignedPreparerId = preparerId;
      break;
    }

    // Multi-slot types (corporate = 2, personal+corporate = 3): verify EVERY
    // required consecutive slot exists and is free for this preparer — not just
    // the first or second. Count of free matching slots must equal the full set.
    const { data: freeSlots } = await supabase
      .from('availability_slots')
      .select('start_time')
      .eq('preparer_id', preparerId)
      .eq('date', input.date)
      .in('start_time', slotStartTimes)
      .eq('is_booked', false);

    if ((freeSlots?.length ?? 0) === slotStartTimes.length) {
      assignedPreparerId = preparerId;
      break;
    }
  }

  if (!assignedPreparerId) {
    return NextResponse.json(
      { error: 'No availability for the selected time. Please choose a different slot.' },
      { status: 409 }
    );
  }

  // ── Book the slots (mark as held while pending) ────────────────────────────
  // Frees slots already claimed by THIS request when a later step conflicts —
  // safe because the checks below ensured they weren't held by anyone else.
  const freeClaimedSlots = async (upTo: string[]) => {
    for (const claimed of upTo) {
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('preparer_id', assignedPreparerId)
        .eq('date', input.date)
        .eq('start_time', claimed);
    }
  };
  const claimedStarts: string[] = [];

  for (const slotStart of slotStartTimes) {
    const { data: existingSlot } = await supabase
      .from('availability_slots')
      .select('id, is_booked')
      .eq('preparer_id', assignedPreparerId)
      .eq('date', input.date)
      .eq('start_time', slotStart)
      .maybeSingle();

    if (existingSlot) {
      // Double-check it's still free (race condition guard)
      if (existingSlot.is_booked) {
        await freeClaimedSlots(claimedStarts);
        return NextResponse.json(
          { error: 'This time slot was just taken. Please select another time.' },
          { status: 409 }
        );
      }
      await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', existingSlot.id);
    } else {
      // Slot doesn't exist — create override. Under migration 012's unique
      // constraint a lost race here surfaces as 23505 instead of a silent
      // duplicate — treat it exactly like the is_booked race above.
      const { error: overrideErr } = await supabase
        .from('availability_slots')
        .insert({
          preparer_id: assignedPreparerId,
          date: input.date,
          start_time: slotStart,
          end_time: addThirtyMinutes(slotStart),
          is_booked: true,
        });
      if (overrideErr) {
        await freeClaimedSlots(claimedStarts);
        if (overrideErr.code === '23505') {
          return NextResponse.json(
            { error: 'This time slot was just taken. Please select another time.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: overrideErr.message }, { status: 500 });
      }
    }
    claimedStarts.push(slotStart);
  }

  // auto_send_checklist: true for tax types, false for professional_services
  const autoSendChecklist = input.appointment_type !== 'professional_services';

  // ── SMS consent ────────────────────────────────────────────────────────────
  // Metadata columns are only populated when consent is granted; otherwise NULL.
  const smsConsent = input.sms_consent;
  const consentAt = smsConsent ? new Date().toISOString() : null;
  const consentIp = smsConsent ? (getClientIp(request) ?? 'unknown') : null;
  const consentTextVersion = smsConsent ? SMS_CONSENT_TEXT_VERSION : null;

  // ── Create appointment with status = pending ────────────────────────────────
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      preparer_id:          assignedPreparerId,
      client_name:          input.client_name.trim(),
      client_phone:         phone,
      client_email:         input.client_email ?? null,
      company_name:         includesCorporate(input.appointment_type)
        ? (input.company_name?.trim() || null)
        : null,
      appointment_type:     input.appointment_type,
      service_subtype:      input.service_subtype ?? null,
      service_subtype_other: input.service_subtype === 'other'
        ? (input.service_subtype_other?.trim() || null)
        : null,
      filing_status:        includesPersonal(input.appointment_type)
        ? (input.filing_status ?? null)
        : null,
      date:                 input.date,
      start_time:           startTime,
      end_time:             endTime,
      status:               'pending',
      language:             input.language,
      booked_by:            'client',
      notes:                null,
      auto_send_checklist:  autoSendChecklist,
      sms_consent:              smsConsent,
      sms_consent_at:           consentAt,
      sms_consent_ip:           consentIp,
      sms_consent_text_version: consentTextVersion,
    })
    .select('id, date, start_time, end_time, appointment_type, status')
    .single();

  if (apptError) {
    // Roll back slot booking on appointment insert failure
    for (const slotStart of slotStartTimes) {
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('preparer_id', assignedPreparerId)
        .eq('date', input.date)
        .eq('start_time', slotStart);
    }
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  // ── Insert household rows (spouse + dependents) — personal types only ───────
  // Spouse is stored only for married filing statuses; dependents whenever the
  // type includes a personal return. One bulk insert; zero rows → skipped.
  const isPersonalType = includesPersonal(input.appointment_type);
  const isMarried = input.filing_status === 'married_filing_jointly'
    || input.filing_status === 'married_filing_separately';
  const peopleRows = isPersonalType
    ? [
        ...(isMarried && input.spouse
          ? [{
              appointment_id: appointment.id as string,
              role:           'spouse',
              name:           input.spouse.name,
              dob:            input.spouse.dob,
              relationship:   null as string | null,
              filing_with_us: false,
            }]
          : []),
        ...input.dependents.map(d => ({
          appointment_id: appointment.id as string,
          role:           'dependent',
          name:           d.name,
          dob:            d.dob,
          relationship:   d.relationship?.trim() || null,
          filing_with_us: d.filing_with_us,
        })),
      ]
    : [];

  if (peopleRows.length > 0) {
    const { error: peopleError } = await supabase
      .from('appointment_people')
      .insert(peopleRows);
    if (peopleError) {
      // Compensating rollback (the route's proven doctrine): no messages exist
      // yet — sends happen below — so deleting the appointment (CASCADE clears
      // any partial people rows) plus freeing the claimed slots leaves zero
      // trace of the failed booking.
      await supabase.from('appointments').delete().eq('id', appointment.id);
      await freeClaimedSlots(claimedStarts);
      console.error('[POST /api/appointments/book] people insert failed, booking rolled back:', peopleError);
      return NextResponse.json({ error: peopleError.message }, { status: 500 });
    }
  }

  // ── Acknowledge the request by email (best-effort) ──────────────────────────
  // The booking already succeeded; an email failure must NOT fail the request.
  // sendPendingMessage swallows its own send/log errors, so awaiting it is safe
  // and never blocks the 201. Email-only for now (SMS is off until A2P approves).
  const pendingAppt: MessagingAppt = {
    id:                  appointment.id as string,
    client_name:         input.client_name.trim(),
    client_phone:        phone,
    client_email:        input.client_email ?? null,
    appointment_type:    input.appointment_type,
    service_subtype:     input.service_subtype ?? null,
    date:                input.date,
    start_time:          startTime,
    language:            input.language,
    auto_send_checklist: autoSendChecklist,
    checklist_sent:      false,
    filing_status:       isPersonalType ? (input.filing_status ?? null) : null,
  };
  await sendPendingMessage(pendingAppt, supabase);

  return NextResponse.json(appointment, { status: 201 });
}
