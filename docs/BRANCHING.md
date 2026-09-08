# Branching Contract

This repository uses exactly one canonical remote branch:

```text
main  ← stable, development, maintenance, and release
```

## Rules

- All implementation, research issues, schemas, docs, CI, and maintenance work targets `main`.
- Do not maintain persistent remote `dev`, `feature/*`, `fix/*`, `hotfix/*`, `release/*`, `chore/*`, `experiment/*`, `agent/*`, or `phase*` branches.
- Temporary local branches are allowed, but they must not become canonical remote branches.
- The single validation workflow checks repository health and removes noncanonical remote branches after trusted non-PR runs.
- Research discovered by the SUPERHERO Steward is issue-first: browsing may create or update research Issues, but must not directly canonicalize PERSON, actor, or transmission records.
- Release automation may create tags/releases, never additional branches.

If an older document describes another branching model, this file wins.
