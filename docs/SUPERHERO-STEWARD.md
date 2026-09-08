# SUPERHERO Steward

`SUPERHERO-Steward` is the scheduled research-maintenance agent for `bjo163/rocksoul-superhero`.

## Cadence

The connected Steward runs every six hours.

## Research contract

1. Review the repository, open research Issues, and existing PERSON / actor / transmission records first.
2. Deduplicate before researching.
3. Browse authoritative primary, academic, museum, library, archive, or institutional sources.
4. Prefer leads involving historically significant people, legendary or folk heroes, ritual specialists, witnesses, authors, transmitters, compilers, interpreters, or superhero-history figures that fit SUPERHERO's PERSON and chain-of-custody scope.
5. For a defensible non-duplicate lead, create or update a GitHub research Issue containing:
   - concise summary;
   - region, tradition, or historical context;
   - authoritative source links;
   - role, proximity, authorship, witnessing, or transmission relevance;
   - uncertainty and conflicting scholarship;
   - suggested next action.
6. Browsing is issue-first. It must not directly add, promote, or canonicalize PERSON, actor, claim, evidence, or transmission data.

## Maintenance contract

After research, inspect README/docs navigation, badges, Mermaid diagrams, stale wording, broken links, PERSON/index counters, and workflow consistency. Make only small, low-risk presentation fixes when clearly useful. Do not expand schemas or taxonomies unless a real consistency defect requires it.

Validate/build when relevant, commit only while `main` remains healthy, and inspect CI. If neither a useful research Issue nor a meaningful repository fix is warranted, report `NO_UPDATE` and leave the repository unchanged.

## Repository invariant

```text
REMOTE BRANCHES  main only
WORKFLOWS        .github/workflows/validate.yml only
RESEARCH         issue-first
CANONICAL DATA   explicit follow-up review only
```
