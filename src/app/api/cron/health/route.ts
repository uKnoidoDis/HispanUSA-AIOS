import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { sendEmail } from '@/lib/resend';
import { todayString, addDaysToDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET /api/cron/health
// Runs weekly, Monday 11:00 UTC (~7 AM Eastern) via Vercel Cron.
// DHS System-Health agent: read-only digest of the production system, emailed
// to Troy. Flags, never fixes. Heartbeat semantics: the email sends EVERY week,
// including ALL CLEAR — a missing Monday email is itself the alarm.
//
// Guardrails (see context/agents/system-health-agent.md):
//  - Read-only DB access, mechanically enforced: this route's Supabase client
//    throws on any non-GET/HEAD request (PostgREST .select() is GET; every
//    write is POST/PATCH/DELETE and physically cannot leave the client).
//  - No client-facing sends, no Twilio: messaging.ts/twilio.ts are NOT
//    imported. The only send is the internal digest via resend.ts.
//  - Failure surfaces: a failed query becomes {error} in the metrics JSON;
//    an Anthropic failure falls back to a plain-text email with raw metrics;
//    a Resend failure returns 500 (visible in Vercel's cron dashboard).
//  - LLM output is advisory text only — nothing downstream parses it.
//
// Security: requires CRON_SECRET via Authorization header (Bearer) or
// Vercel's x-vercel-cron-secret header. Returns 401 otherwise.

const DIGEST_RECIPIENT = 'montalvotroy@gmail.com';
const DIGEST_FROM = 'DHS System Health <appointments@hispanusa.com>';
const DIGEST_MODEL = 'claude-sonnet-4-6';

const DIGEST_SYSTEM_PROMPT = `You are the DHS System Health agent — a weekly read-only monitor for the HispanUSA scheduling system (a Next.js + Supabase appointment-booking app run by Dark Horse Systems). You receive raw weekly metrics as JSON. Your ONLY job is to write a short plain-English health digest for Troy, a non-technical founder. You take no actions. Your text is advisory only — nothing downstream parses or acts on it, so write for a human reader, not a machine.

Rules:
- First line: exactly "ALL CLEAR" if nothing needs attention, otherwise "N ITEMS NEED ATTENTION" (with the real count).
- If there are flagged items: a numbered list, each starting with a severity tag [HIGH], [MEDIUM], or [LOW], then a one-line plain-English reason — what it is and why it matters. No jargon, no table names.
- Then a short section titled "This week's numbers" summarizing the healthy metrics in a few plain lines.
- Flagging rules: any orphan-audit count above 0 is [HIGH]. Any failed email sends: [MEDIUM], or [HIGH] if more than 3. Any pending booking request older than 48 hours: [HIGH]. Zero open availability slots across the next 14 days: [HIGH]. A single preparer with zero open slots while others have many: [LOW]. Anything else you judge anomalous: flag it with your reasoning and a severity.
- Never invent numbers — use only what is in the JSON. If a metric carries an "error" field or is missing, flag that as [MEDIUM] ("a health check itself failed").
- Keep the whole digest under 250 words. Plain text only — it goes into a simple email.`;

// ── Read-only Supabase client ────────────────────────────────────────────────
// Service-role key (required to bypass RLS) but the fetch wrapper throws on any
// HTTP method other than GET/HEAD, so .insert()/.update()/.delete()/.rpc()
// physically cannot leave this client — even a future code edit fails at
// runtime. Also sets cache:'no-store' per Applied Learning #41 (Next.js Data
// Cache silently caches the supabase-js PostgREST fetch otherwise).
function createReadOnlyClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const method = (init?.method ?? 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
          console.error(`[HEALTH] READ-ONLY GUARD blocked a ${method} request: ${String(input)}`);
          throw new Error(`Read-only health client blocked a ${method} request`);
        }
        return fetch(input, { ...init, cache: 'no-store' });
      },
    },
  });
}

// ── Query plumbing ───────────────────────────────────────────────────────────
// supabase-js v2 returns { data, error } instead of throwing; normalize to
// throw so each signal's try/catch catches both shapes.
async function rows<T>(
  p: PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data ?? [];
}

type SignalError = { error: string };
function isSignalError(v: unknown): v is SignalError {
  return typeof v === 'object' && v !== null && 'error' in (v as Record<string, unknown>);
}

async function fetchSignal<T>(name: string, fn: () => Promise<T>): Promise<T | SignalError> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[HEALTH] base fetch "${name}" failed:`, msg);
    return { error: msg };
  }
}

// ── Row shapes (only the columns this route selects) ─────────────────────────
interface ApptRow {
  id: string;
  preparer_id: string | null;
  client_name: string;
  appointment_type: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  booked_by: string | null;
  filing_status: string | null;
  sms_consent: boolean | null;
  created_at: string;
  updated_at: string;
}
interface BookedSlotRow {
  id: string;
  preparer_id: string;
  date: string;
  start_time: string;
}
interface PersonRow {
  id: string;
  appointment_id: string;
  role: string;
}
interface InventorySlotRow {
  preparer_id: string;
  date: string;
  is_booked: boolean;
}
interface PreparerRow {
  id: string;
  name: string;
}
interface MessageRow {
  appointment_id: string | null;
  channel: string;
  message_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  // ── Auth: verify CRON_SECRET (pattern copied from reminders/route.ts) ─────
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[HEALTH] CRON_SECRET env var is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  const vercelHeader = request.headers.get('x-vercel-cron-secret');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (vercelHeader !== secret && bearerToken !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ──────────────────────────────────────────────────────────────────────────

  const supabase = createReadOnlyClient();
  const today = todayString();
  const in14 = addDaysToDate(today, 14);
  const in7 = addDaysToDate(today, 7);
  const nowMs = Date.now();
  const sevenDaysAgoIso = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
  const isStaging = (process.env.NEXT_PUBLIC_APP_URL ?? '').includes('staging');
  const environment = isStaging ? 'staging' : 'production';

  // ── Base fetches (all read-only GETs, in parallel) ────────────────────────
  const [appts, bookedSlots, people, inventorySlots, preparers, recentMessages] =
    await Promise.all([
      fetchSignal('appointments', () =>
        rows<ApptRow>(
          supabase
            .from('appointments')
            .select(
              'id, preparer_id, client_name, appointment_type, date, start_time, end_time, status, booked_by, filing_status, sms_consent, created_at, updated_at'
            )
        )
      ),
      fetchSignal('booked_slots', () =>
        rows<BookedSlotRow>(
          supabase
            .from('availability_slots')
            .select('id, preparer_id, date, start_time')
            .eq('is_booked', true)
        )
      ),
      fetchSignal('appointment_people', () =>
        rows<PersonRow>(supabase.from('appointment_people').select('id, appointment_id, role'))
      ),
      fetchSignal('slot_inventory', () =>
        rows<InventorySlotRow>(
          supabase
            .from('availability_slots')
            .select('preparer_id, date, is_booked')
            .gte('date', today)
            .lte('date', in14)
        )
      ),
      fetchSignal('preparers', () =>
        rows<PreparerRow>(
          supabase.from('preparers').select('id, name').eq('is_active', true)
        )
      ),
      fetchSignal('messages', () =>
        rows<MessageRow>(
          supabase
            .from('messages')
            .select('appointment_id, channel, message_type, status, error_message, created_at')
            .gte('created_at', sevenDaysAgoIso)
        )
      ),
    ]);

  // ── Signals 1–3: orphan audit ─────────────────────────────────────────────
  // Plain-SELECT reimplementation of scripts/orphan-audit.sql, logic mirrored
  // line-for-line (supabase-js can't run raw SQL without an RPC, and RPC is a
  // POST the read-only guard forbids). scripts/orphan-audit.sql remains the
  // canonical manual-check artifact — keep the two in sync.
  let orphanAudit;
  if (isSignalError(appts) || isSignalError(bookedSlots) || isSignalError(people)) {
    const failed = [
      isSignalError(appts) ? `appointments: ${appts.error}` : null,
      isSignalError(bookedSlots) ? `booked_slots: ${bookedSlots.error}` : null,
      isSignalError(people) ? `appointment_people: ${people.error}` : null,
    ].filter(Boolean);
    orphanAudit = { error: failed.join('; ') };
  } else {
    // 1. booked-slots-without-appointments: an is_booked=true slot must map to
    //    a pending/confirmed/completed appointment covering its start_time.
    const LIVE_STATUSES = new Set(['pending', 'confirmed', 'completed']);
    const liveAppts = appts.filter((a) => LIVE_STATUSES.has(a.status));
    const orphanedSlots = bookedSlots.filter(
      (s) =>
        !liveAppts.some(
          (a) =>
            a.preparer_id === s.preparer_id &&
            a.date === s.date &&
            s.start_time >= a.start_time &&
            s.start_time < a.end_time
        )
    );
    // 2. people-without-parents: appointment_people rows whose appointment is
    //    gone (catches FK drift; impossible while FK CASCADE stands).
    const apptIds = new Set(appts.map((a) => a.id));
    const orphanedPeople = people.filter((p) => !apptIds.has(p.appointment_id));
    // 3. married-without-spouse: CLIENT-booked married appointments with no
    //    spouse row (staff bookings are warn-don't-block and excluded).
    const spouseApptIds = new Set(
      people.filter((p) => p.role === 'spouse').map((p) => p.appointment_id)
    );
    const marriedWithoutSpouse = appts.filter(
      (a) =>
        a.booked_by === 'client' &&
        (a.filing_status === 'married_filing_jointly' ||
          a.filing_status === 'married_filing_separately') &&
        !spouseApptIds.has(a.id)
    );
    orphanAudit = {
      booked_slots_without_appointments: orphanedSlots.length,
      people_without_parents: orphanedPeople.length,
      married_without_spouse: marriedWithoutSpouse.length,
      sample_orphaned_slots: orphanedSlots
        .slice(0, 5)
        .map((s) => ({ date: s.date, start_time: s.start_time })),
    };
  }

  // ── Signal 4: appointments created past 7 days, by type + booked_by ───────
  let recentCreated;
  if (isSignalError(appts)) {
    recentCreated = { error: appts.error };
  } else {
    const recent = appts.filter((a) => a.created_at >= sevenDaysAgoIso);
    const byType: Record<string, number> = {};
    const byBookedBy: Record<string, number> = {};
    for (const a of recent) {
      byType[a.appointment_type] = (byType[a.appointment_type] ?? 0) + 1;
      const key = a.booked_by ?? 'unknown';
      byBookedBy[key] = (byBookedBy[key] ?? 0) + 1;
    }
    recentCreated = { total: recent.length, by_type: byType, by_booked_by: byBookedBy };
  }

  // ── Signal 5: pending queue depth + oldest pending age ────────────────────
  let pendingQueue;
  if (isSignalError(appts)) {
    pendingQueue = { error: appts.error };
  } else {
    const pending = appts.filter((a) => a.status === 'pending');
    const oldestMs = pending.length
      ? Math.min(...pending.map((a) => new Date(a.created_at).getTime()))
      : null;
    const oldestAgeHours =
      oldestMs === null ? null : Math.round(((nowMs - oldestMs) / 3_600_000) * 10) / 10;
    pendingQueue = {
      depth: pending.length,
      oldest_pending_age_hours: oldestAgeHours,
      any_older_than_48_hours: oldestAgeHours !== null && oldestAgeHours > 48,
    };
  }

  // ── Signal 6: messages past 7 days by channel/type/status ─────────────────
  let messagesSummary;
  if (isSignalError(recentMessages)) {
    messagesSummary = { error: recentMessages.error };
  } else {
    const counts: Record<string, number> = {};
    for (const m of recentMessages) {
      const key = `${m.channel}/${m.message_type}/${m.status}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const failed = recentMessages.filter((m) => m.status === 'failed');
    messagesSummary = {
      total: recentMessages.length,
      by_channel_type_status: counts,
      failed_count: failed.length,
      failed_details_top5: failed.slice(0, 5).map((m) => ({
        channel: m.channel,
        message_type: m.message_type,
        created_at: m.created_at,
        error_message: m.error_message,
      })),
    };
  }

  // ── Signal 7: slot inventory next 14 days per preparer ────────────────────
  let slotInventory;
  if (isSignalError(inventorySlots) || isSignalError(preparers)) {
    slotInventory = {
      error: [
        isSignalError(inventorySlots) ? `slots: ${inventorySlots.error}` : null,
        isSignalError(preparers) ? `preparers: ${preparers.error}` : null,
      ]
        .filter(Boolean)
        .join('; '),
    };
  } else {
    const perPreparer = preparers.map((p) => {
      const theirs = inventorySlots.filter((s) => s.preparer_id === p.id);
      const open = theirs.filter((s) => !s.is_booked).length;
      return { preparer: p.name, open, booked: theirs.length - open };
    });
    const totalOpen = perPreparer.reduce((sum, p) => sum + p.open, 0);
    slotInventory = {
      window: `${today} to ${in14}`,
      per_preparer: perPreparer,
      total_open: totalOpen,
      zero_open_across_all_preparers: totalOpen === 0,
      preparers_with_zero_open: perPreparer.filter((p) => p.open === 0).map((p) => p.preparer),
    };
  }

  // ── Signals 8–11: workload, cancellations, growth, consent ────────────────
  let upcomingConfirmed;
  let cancellations;
  let totalAppointments;
  let smsConsentRate;
  if (isSignalError(appts)) {
    upcomingConfirmed = { error: appts.error };
    cancellations = { error: appts.error };
    totalAppointments = { error: appts.error };
    smsConsentRate = { error: appts.error };
  } else {
    upcomingConfirmed = {
      window: `${today} to ${in7}`,
      count: appts.filter(
        (a) => a.status === 'confirmed' && a.date >= today && a.date <= in7
      ).length,
    };
    // Cancellations: updated_at is the closest queryable proxy for "when
    // cancelled" (the status flip is the row's last update in practice).
    cancellations = {
      past_7_days: appts.filter(
        (a) => a.status === 'cancelled' && a.updated_at >= sevenDaysAgoIso
      ).length,
    };
    totalAppointments = { lifetime: appts.length };
    const recentClientBookings = appts.filter(
      (a) => a.booked_by === 'client' && a.created_at >= sevenDaysAgoIso
    );
    const consented = recentClientBookings.filter((a) => a.sms_consent === true).length;
    smsConsentRate = {
      client_bookings_past_7_days: recentClientBookings.length,
      opted_in: consented,
      opt_in_rate:
        recentClientBookings.length > 0
          ? Math.round((consented / recentClientBookings.length) * 100) / 100
          : null,
    };
  }

  const metrics = {
    week_ending: today,
    environment,
    orphan_audit: orphanAudit,
    appointments_created_past_7_days: recentCreated,
    pending_queue: pendingQueue,
    messages_past_7_days: messagesSummary,
    slot_inventory_next_14_days: slotInventory,
    upcoming_confirmed_next_7_days: upcomingConfirmed,
    cancellations_past_7_days: cancellations,
    total_appointments: totalAppointments,
    sms_consent_past_7_days: smsConsentRate,
  };
  const metricsJson = JSON.stringify(metrics, null, 2);
  const signalErrors = Object.entries(metrics)
    .filter(([, v]) => isSignalError(v))
    .map(([k]) => k);

  // ── LLM judgment step (Anthropic failure → plain-text fallback email) ─────
  let digest: string | null = null;
  let llmError: string | null = null;
  try {
    const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY
    const msg = await anthropic.messages.create({
      model: DIGEST_MODEL,
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system: DIGEST_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Weekly metrics JSON for the week ending ${today}:\n\n${metricsJson}`,
        },
      ],
    });
    digest = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!digest) throw new Error('model returned no text content');
  } catch (e) {
    llmError = e instanceof Error ? e.message : String(e);
    console.error('[HEALTH] Anthropic digest failed, sending plain-text fallback:', llmError);
  }

  // ── Email (Resend failure → 500, visible in Vercel cron dashboard) ────────
  const firstLine = digest ? digest.split('\n')[0].trim() : 'HEALTH CHECK DEGRADED';
  const stagingPrefix = isStaging ? '[STAGING] ' : '';
  const subject = `${stagingPrefix}[DHS System Health] ${firstLine} — ${today}`;
  const bodyText = digest
    ? digest
    : `The weekly digest could not be generated (Anthropic API error: ${llmError}).\n` +
      `Raw metrics below — a human read is needed this week.\n\n${metricsJson}`;

  try {
    await sendEmail({
      to: DIGEST_RECIPIENT,
      subject,
      html: buildDigestHtml(bodyText, today, environment),
      from: DIGEST_FROM,
      replyTo: DIGEST_RECIPIENT,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[HEALTH] digest email send FAILED:', msg);
    return NextResponse.json(
      {
        error: `Digest email failed: ${msg}`,
        stages: { metrics: 'ok', llm: llmError ? `fallback (${llmError})` : 'ok', email: 'failed' },
        signal_errors: signalErrors,
      },
      { status: 500 }
    );
  }

  console.log(`[HEALTH] digest sent: "${firstLine}" (${environment}, signal errors: ${signalErrors.length})`);
  return NextResponse.json({
    date: today,
    environment,
    stages: { metrics: 'ok', llm: llmError ? `fallback (${llmError})` : 'ok', email: 'ok' },
    signal_errors: signalErrors,
    digest_first_line: firstLine,
  });
}

// ── DHS-branded email shell ──────────────────────────────────────────────────
// Deliberately NOT HispanUSA client styling: dark header, monospace digest
// block, DHS footer. Inline CSS only (email clients strip <style> tags).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDigestHtml(bodyText: string, date: string, environment: string): string {
  const envLabel = environment === 'staging' ? ' · STAGING' : '';
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="background-color:#18181b;padding:20px 28px;">
                <span style="color:#fafafa;font-size:15px;font-weight:bold;letter-spacing:2px;">DARK HORSE SYSTEMS</span>
                <span style="color:#a1a1aa;font-size:13px;letter-spacing:1px;"> &middot; System Health${envLabel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px 28px;">
                <p style="margin:0;color:#71717a;font-size:12px;">Weekly digest &middot; week ending ${escapeHtml(date)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 24px 28px;">
                <pre style="margin:0;padding:16px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:6px;font-family:Consolas,Menlo,monospace;font-size:13px;line-height:1.5;color:#18181b;white-space:pre-wrap;word-wrap:break-word;">${escapeHtml(bodyText)}</pre>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;color:#a1a1aa;font-size:11px;">Powered by Dark Horse Systems &middot; automated read-only monitor &middot; it flags, it never fixes</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
