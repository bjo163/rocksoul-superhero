# SUPERHERO Steward

`SUPERHERO-Steward` is the PERSON research-maintenance adapter for `bjo163/rocksoul-superhero`.

## Scheduler V2 slot

The desired ecosystem topology places PERSON in the hourly `:20` Attestation slot **after TEXT and an explicit `RESET_CONTEXT` boundary**.

```text
TEXT -> RESET_CONTEXT -> PERSON
```

Repository configuration describes the desired slot only. It does not prove that an external ChatGPT/runtime automation is currently enabled.

## Progression-first contract

1. Inspect open PERSON research issues and existing candidate/canonical indexes before routine discovery.
2. Rank existing work with `RPS_V1`; RPS is a scheduling priority score, never a truth, confidence, identity, or canonicality score.
3. Apply WIP/backpressure. When PERSON backlog is already substantial, reduce or suppress routine new discovery.
4. Prefer advancing existing `triaged`, `needs_sources`, `source_inspected`, or `ready_for_observation` work over creating another discovery envelope.
5. `NO_UPDATE` is a valid result when neither existing work nor a defensible new lead should advance.
6. Research remains issue-first and may not directly add, promote, or canonicalize PERSON, actor, claim, evidence, or transmission data.

The executable adapter is `scripts/research-steward.mjs`; reusable policy/guardrail logic lives in `scripts/research-policy.mjs`.

## PERSON identity guardrails

- Same name does not prove identity.
- Same spelling does not prove identity.
- Same title does not prove identity.
- Same URL does not prove identity.
- Same embedding does not prove identity.
- Shared event participation does not prove two PERSON records are identical.
- A TEXT reference does not mint a canonical PERSON.
- Identity review requires independent evidence and may remain disputed.
- Living-person privacy, anonymization, and sensitive-inference boundaries override promotion pressure.
- Uncertainty and alternative identity hypotheses stay explicit.

These rules extend the repository's existing `Identity ≠ role` and evidence-bound relationship policies; they do not replace the PERSON schema or identity-status model.

## Research Signal

Each steward decision is emitted first as machine-readable `rocksoul.research-signal.v1` data containing the PERSON owner, selected issue/state, RPS explanation, WIP state, identity decision, convergence status, relationship-handoff status, and safety constraints.

A Research Signal is operational metadata, not canonical research truth.

## Cross-domain convergence and Relationship Handoff

Cross-domain convergence may become eligible for a `rocksoul.relationship-handoff.v1` review only when there are qualified cross-domain references, supporting evidence, counterevidence, alternatives, adequate confidence, and no privacy block.

Similarity-only convergence is held. Even an eligible handoff has:

```text
canonical_edge_created = false
```

Correlation remains event-driven and is responsible for later relationship review. SUPERHERO never mints a canonical Correlation edge from the scheduled PERSON pass.

## Research contract

1. Review the repository, open research Issues, and existing PERSON / actor / transmission records first.
2. Deduplicate before researching.
3. Browse authoritative primary, academic, museum, library, archive, or institutional sources when source work is actually selected.
4. Prefer historically significant people, legendary or folk heroes, ritual specialists, witnesses, authors, transmitters, compilers, interpreters, or superhero-history figures that fit PERSON and chain-of-custody scope.
5. Keep role, proximity, authorship, witnessing, transmission, identity uncertainty, conflicting scholarship, and privacy boundaries source-relative.
6. Do not absorb TEXT, EVENT, STORY, LAW, PERSPECTIVE, or RELATIONSHIP conclusions into PERSON merely because the same referent appears elsewhere.

## Maintenance contract

After research, inspect README/docs navigation, badges, Mermaid diagrams, stale wording, broken links, PERSON/index counters, and workflow consistency. Make only small, low-risk presentation fixes when clearly useful. Do not expand schemas or taxonomies unless a real consistency defect requires it.

Validate/build when relevant, commit only while `main` remains healthy, and inspect CI.

## Repository invariant

```text
REMOTE CANONICAL BRANCH  main only
WORKFLOWS                validate.yml + rocksoul-contract.yml
RESEARCH                 issue-first, progression-first
IDENTITY                 evidence-bound, never similarity-merged
CANONICAL DATA            explicit follow-up review only
RELATIONSHIP              event-driven Correlation review only
```
