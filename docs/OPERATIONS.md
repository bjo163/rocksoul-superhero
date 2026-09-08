# SUPERHERO Production Operations

## Canonical release path

SUPERHERO is main-only.

Every trusted main update runs the `Validate SUPERHERO` workflow:

```text
install
→ schema + graph validation
→ generated index
→ generated public snapshot
→ TypeScript
→ Vite production build
→ Node tests
→ UI / production contract audit
→ generated index drift check
→ snapshot synchronization
→ main-only remote enforcement
```

A release is production-ready only when the current main head has a green validation run.

## Deployment artifact

Production project:

```text
Vercel project: rocksoul-superhero
Framework: Vite
Canonical alias: https://rocksoul-superhero.vercel.app
```

The production browser artifact requires the Vite source, presentation contract, and the CI-generated deployment snapshot. Research source JSON remains canonical in GitHub and is validated before deployment.

## Post-deploy checks

Verify all of the following:

1. deployment state is `READY`;
2. alias error is null;
3. `https://rocksoul-superhero.vercel.app/data/superhero.snapshot.json` returns HTTP 200;
4. the returned `source.dataset_sha256` equals the snapshot committed on main;
5. Vercel build logs show a successful Vite production build;
6. production runtime errors are empty or investigated;
7. security/cache headers remain present.

## Rollback

Use a previous Vercel deployment only if it is marked `READY` and is known to correspond to a previously green SUPERHERO revision.

Rollback is a delivery action, not a data mutation. Do not modify canonical PERSON records merely to recover a broken frontend.

After rollback, open/fix the source regression on main and restore forward deployment once CI is green.

## Snapshot integrity

The deployment snapshot is content-addressed. Its hash is visible in the observatory and footer.

This allows an operator to distinguish:

- research data changes;
- presentation-only changes;
- deployment drift.

The UI must never silently substitute live GitHub data for the pinned deployment snapshot.

## Incident triage

For a production failure, inspect in this order:

1. current GitHub validation run;
2. Vercel build logs;
3. production deployment state and alias;
4. snapshot endpoint;
5. Vercel runtime errors;
6. browser-visible data-load state.

If the snapshot endpoint is healthy but the UI fails, treat it as presentation/runtime failure. If validation fails before snapshot generation, treat it as repository/data-contract failure.

## Research backlog is not an incident queue

Open research-only issues remain noncanonical until evidence work is complete. Production urgency must not be used to bypass the PERSON evidence gate.
