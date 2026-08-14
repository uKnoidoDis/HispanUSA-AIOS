// Health context config for the DHS System-Health agent.
//
// This file is CONFIG. The engine (src/app/api/cron/health/route.ts) reads it and
// never hardcodes knowledge of any particular system state. To tell the digest that
// something is expected, edit this file. Do not edit the engine.
//
// Two mechanisms:
//   1. Lifecycle stage. Declares where the deployment is in its life. Under
//      'pre-launch', absence of activity is the expected state and is reported as
//      context in the numbers section rather than as something needing attention.
//   2. Known-intentional states. Named, reasoned, DATED exceptions for specific
//      findings. Every one carries a required expiry. When it passes, the finding
//      fires normally again and the digest says the exception expired.
//
// Three safety rules are deliberately not configurable:
//   - NEVER_SUPPRESSIBLE findings cannot be silenced by anything in this file.
//     Data integrity and real delivery failures always reach the reader.
//   - Every suppression expires. There is no permanent exception.
//   - Data beats the declaration. If observed activity contradicts a 'pre-launch'
//     declaration, the frame stops applying immediately and the digest says the
//     declaration looks out of date.
//
// SEVERITY DEFINITIONS (keep future checks consistent with these):
//
//   HIGH    Someone must act today. Data integrity is broken, or clients are
//           being affected right now. Example: orphaned booked slots, a pending
//           booking request older than 48 hours.
//
//   MEDIUM  Someone must act this week. Real degradation that causes harm if it
//           is ignored, but nothing is on fire today. Example: failed message
//           sends, a health check that could not run.
//
//   LOW     Worth knowing. No action is needed this week. Act only if it persists
//           or recurs. Example: a stage declaration past its review date.
//
//   Not a finding at all. Expected under the current lifecycle stage, or a
//           declared intentional state still inside its expiry. These belong in
//           the numbers section and never in the attention list.
//
// The test is actionability, not noticeability. If nobody needs to do anything,
// it is not an attention item. An unusual number that requires no action is a
// number, not a finding.

export type HealthEnvironment = 'production' | 'staging';

export type LifecycleStage = 'pre-launch' | 'soft-launch' | 'live';

/** Stable ids for every condition the digest can raise. Config references these. */
export type FindingId =
  // absence-of-activity family
  | 'zero-appointments-lifetime'
  | 'zero-appointments-created-7d'
  | 'zero-upcoming-confirmed-7d'
  | 'zero-messages-7d'
  // capacity
  | 'preparers-with-zero-open-slots'
  | 'zero-open-slots-all-preparers'
  // integrity and delivery
  | 'orphaned-booked-slots'
  | 'people-without-parents'
  | 'married-without-spouse'
  | 'failed-message-sends'
  | 'stale-pending-request'
  | 'signal-check-failed';

/**
 * Absence of activity. Under a 'pre-launch' stage these are the expected state,
 * not problems. Note that 'zero-open-slots-all-preparers' is deliberately NOT in
 * this set: no availability anywhere is a launch-readiness problem even before
 * launch, so it keeps firing.
 */
export const ABSENCE_OF_ACTIVITY: readonly FindingId[] = [
  'zero-appointments-lifetime',
  'zero-appointments-created-7d',
  'zero-upcoming-confirmed-7d',
  'zero-messages-7d',
];

/**
 * Findings that config can never silence, whatever anyone writes below. These are
 * data integrity and real delivery failures. If a suppression names one of these
 * the resolver drops it and says so in the digest.
 */
export const NEVER_SUPPRESSIBLE: readonly FindingId[] = [
  'orphaned-booked-slots',
  'people-without-parents',
  'married-without-spouse',
  'failed-message-sends',
  'stale-pending-request',
  'signal-check-failed',
];

export interface KnownIntentionalState {
  /** Short slug, used in logs and the digest. */
  id: string;
  /** Which finding this suppresses. */
  finding: FindingId;
  /** Why this state exists. Written for a reader who was not in the room. */
  reason: string;
  /** Who declared it. */
  declared_by: string;
  /** YYYY-MM-DD */
  declared_on: string;
  /** YYYY-MM-DD. REQUIRED. After this date the finding fires normally again. */
  expires_on: string;
}

export interface EnvironmentHealthContext {
  stage: LifecycleStage;
  /** Why the deployment is at this stage. Appears in the digest. */
  stage_reason: string;
  /** YYYY-MM-DD */
  stage_declared_on: string;
  /**
   * YYYY-MM-DD. The stage declaration itself expires. Past this date the digest
   * raises it, so a 'pre-launch' frame cannot quietly outlive launch and hide
   * real problems.
   */
  stage_review_by: string;
  intentional_states: KnownIntentionalState[];
}

// ── The config ───────────────────────────────────────────────────────────────

export const HEALTH_CONTEXT: Record<HealthEnvironment, EnvironmentHealthContext> = {
  production: {
    stage: 'pre-launch',
    stage_reason:
      'Production booking data was cleared on 2026-07-09 and the client booking portal has not been announced to clients yet. Zero appointment activity is the expected state, not a fault.',
    stage_declared_on: '2026-07-29',
    stage_review_by: '2026-08-31',
    intentional_states: [
      {
        id: 'ruth-only-open-availability',
        finding: 'preparers-with-zero-open-slots',
        // Re-declared 2026-08-14. The original reason (supporting the Twilio
        // carrier review) is spent: the A2P campaign was APPROVED 2026-08-12.
        // The state itself continues for a different reason, so it gets a fresh
        // declaration and a fresh expiry rather than a silent extension.
        reason:
          'HispanUSA staff are not yet onboarded to the system, so availability stays concentrated on Ruth until staff scheduling is confirmed with her. The other preparers having no open slots is intentional, not a scheduling gap.',
        declared_by: 'Troy',
        declared_on: '2026-08-14',
        expires_on: '2026-09-15',
      },
    ],
  },
  staging: {
    stage: 'pre-launch',
    stage_reason:
      'Staging carries no real client data by design. It exists to prove the pipeline, so absence of activity is permanent and expected here.',
    stage_declared_on: '2026-07-29',
    stage_review_by: '2026-12-31',
    intentional_states: [],
  },
};

// ── Resolver ─────────────────────────────────────────────────────────────────

/** What the engine observed this run, used to sanity-check the declaration. */
export interface HealthObservations {
  /** Lifetime appointment count, or null when that signal failed. */
  lifetimeAppointments: number | null;
}

export interface ActiveSuppression {
  id: string;
  finding: FindingId;
  reason: string;
  expires_on: string;
  days_remaining: number;
}

export interface ExpiredSuppression {
  id: string;
  finding: FindingId;
  reason: string;
  expired_on: string;
  days_overdue: number;
}

export interface ResolvedHealthContext {
  environment: HealthEnvironment;
  stage: LifecycleStage;
  stage_reason: string;
  stage_declared_on: string;
  stage_review_by: string;
  /** True when today is past stage_review_by. The digest must raise this. */
  stage_declaration_stale: boolean;
  /** True when the absence-of-activity frame is actually in force this run. */
  absence_of_activity_suppressed: boolean;
  /** Findings the digest must not raise as attention items this run. */
  suppressed_findings: FindingId[];
  active_suppressions: ActiveSuppression[];
  /** Expired exceptions. Not suppressed, and the digest must raise each one. */
  expired_suppressions: ExpiredSuppression[];
  /** Plain-English notes the digest must work in. */
  notes: string[];
}

/** Whole days between two YYYY-MM-DD strings, parsed as UTC to avoid drift. */
function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

/**
 * Resolve the config against today's date and this run's observations.
 *
 * Pure function, no I/O. Order of precedence, highest first:
 *   1. NEVER_SUPPRESSIBLE. Config cannot silence these.
 *   2. Observed data. Activity contradicting a 'pre-launch' declaration drops the
 *      absence-of-activity frame for this run.
 *   3. Expiry dates. A lapsed exception stops suppressing and gets raised.
 *   4. The declared stage and intentional states.
 *
 * @param today YYYY-MM-DD in Eastern time (the engine passes todayString()).
 */
export function resolveHealthContext(
  environment: HealthEnvironment,
  today: string,
  observations: HealthObservations
): ResolvedHealthContext {
  const cfg = HEALTH_CONTEXT[environment];
  const notes: string[] = [];
  const suppressed = new Set<FindingId>();
  const active: ActiveSuppression[] = [];
  const expired: ExpiredSuppression[] = [];

  // 1. Does observed data contradict a 'pre-launch' declaration?
  // A null count means the signal failed, so we cannot conclude anything and the
  // declaration stands. That failure is raised separately as signal-check-failed.
  const lifetime = observations.lifetimeAppointments;
  const dataContradictsStage =
    cfg.stage === 'pre-launch' && lifetime !== null && lifetime > 0;

  if (dataContradictsStage) {
    notes.push(
      `The declared lifecycle stage is "pre-launch" but there are ${lifetime} appointments on record. Observed data beats the declaration, so absence-of-activity findings are NOT being treated as expected this week. The stage declaration in src/lib/health-context.ts appears out of date and should be updated.`
    );
  }

  const applyAbsenceFrame = cfg.stage === 'pre-launch' && !dataContradictsStage;
  if (applyAbsenceFrame) {
    for (const f of ABSENCE_OF_ACTIVITY) suppressed.add(f);
  }

  // 2. Known-intentional states, each gated on its own expiry.
  for (const s of cfg.intentional_states) {
    if (NEVER_SUPPRESSIBLE.includes(s.finding)) {
      notes.push(
        `Config declares an exception "${s.id}" for "${s.finding}", but that finding can never be suppressed. The exception was ignored and the check is running normally.`
      );
      continue;
    }
    if (today <= s.expires_on) {
      suppressed.add(s.finding);
      active.push({
        id: s.id,
        finding: s.finding,
        reason: s.reason,
        expires_on: s.expires_on,
        days_remaining: daysBetween(today, s.expires_on),
      });
    } else {
      expired.push({
        id: s.id,
        finding: s.finding,
        reason: s.reason,
        expired_on: s.expires_on,
        days_overdue: daysBetween(s.expires_on, today),
      });
      notes.push(
        `The declared exception "${s.id}" expired on ${s.expires_on}. It is no longer suppressing anything and the underlying state needs a decision: either it is still intentional and the expiry should be extended, or it should be fixed.`
      );
    }
  }

  // 3. Has the stage declaration itself gone stale?
  const stageStale = today > cfg.stage_review_by;
  if (stageStale) {
    notes.push(
      `The "${cfg.stage}" stage declaration was due for review on ${cfg.stage_review_by} and has not been updated. Until it is, this digest may be applying the wrong frame.`
    );
  }

  return {
    environment,
    stage: cfg.stage,
    stage_reason: cfg.stage_reason,
    stage_declared_on: cfg.stage_declared_on,
    stage_review_by: cfg.stage_review_by,
    stage_declaration_stale: stageStale,
    absence_of_activity_suppressed: applyAbsenceFrame,
    suppressed_findings: Array.from(suppressed),
    active_suppressions: active,
    expired_suppressions: expired,
    notes,
  };
}
