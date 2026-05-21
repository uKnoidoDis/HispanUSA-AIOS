# Staging Workflow

Reference for the two-environment setup. Keep it boring and predictable.

## Branch Structure

- `main` → **production**. Auto-deploys to `book.hispanusa.com` (Vercel production project). Real data, 21 staff, live bookings.
- `develop` → **staging**. Auto-deploys to a free `*.vercel.app` URL (Vercel staging project). Mirrors production, fully isolated, separate Supabase project.
- `feature/*` → short-lived working branches off `develop`.

## Start a New Feature

```bash
git checkout develop
git pull
git checkout -b feature/whatever
```

## Ship to Staging

- Merge the feature branch into `develop`, then push.
```bash
git checkout develop
git merge feature/whatever
git push origin develop
```
- Vercel staging auto-deploys `develop`. Test on the `*.vercel.app` URL.

## Promote Staging → Production

- Open a PR from `develop` → `main`.
- Review the diff. Confirm staging testing passed.
- Merge the PR. Vercel production auto-deploys `main` to `book.hispanusa.com`.
- Run an incognito production smoke test after deploy (don't trust "Ready" status — verify the actual feature).

## Feature Flags

- All Module 2 flags live in `src/lib/feature-flags.ts`, read from `NEXT_PUBLIC_FEATURE_*` env vars.
- **Add a new flag:** add a line to `FEATURES` in `feature-flags.ts`, document it in `.env.example`, gate the code with `if (FEATURES.yourFlag) { ... }`.
- **Flip a flag:** set the env var in the right Vercel project (staging = `true` to test, production = `false` until verified). Vercel env var changes require a **manual redeploy** — they do not auto-trigger.
- Default every flag to `false` in production until the feature is verified on staging.

## Database Migrations

- Run new migrations on the **staging Supabase project first**. Verify behavior on staging.
- Only then run the same migration on the **production Supabase project**.
- Never run an untested migration against production data.
- Staging and production are separate Supabase projects with separate URLs/keys — confirm you're pointed at the right one before running SQL.

## Rollback (production broke)

- Identify the bad commit on `main`.
```bash
git checkout main
git pull
git revert <commit-sha>
git push origin main
```
- `git revert` (not `reset`) — it creates a new commit undoing the change, safe on a shared branch.
- Vercel auto-deploys the revert. Verify production recovered.
- If a migration caused the break, roll the database back separately — code revert alone won't undo schema/data changes.
