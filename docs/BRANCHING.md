# SUPERHERO Branching Contract

## Canonical branch

`main` is the only canonical, long-lived SUPERHERO branch.

All stable research data, schemas, application code, documentation, CI policy, and releases resolve from `main`.

## Development model

SUPERHERO does not maintain a permanent `dev`, staging, release, or feature branch. Trusted repository work lands on `main` and is protected by the full validation workflow.

Older documentation that describes a `main + dev` model is superseded by this contract.

## Ephemeral automation exception

Dependency automation may temporarily create branches under:

```text
dependabot/*
```

These branches are **not canonical development branches**. They exist only as PR transport for automated dependency updates and may be deleted when their PR is closed or merged.

The main-only enforcement workflow:

- preserves `main`;
- temporarily preserves `dependabot/*`;
- deletes other noncanonical remote branches;
- verifies that, after excluding dependency-automation branches, the only canonical remote branch is `main`.

## Pull requests

A pull request may originate from an allowed ephemeral automation branch or an external fork. Its contents are noncanonical until merged to `main` and validated there.

## Release rule

```text
current main
+ schema/graph valid
+ generated artifacts current
+ application/type/UI tests green
= releasable SUPERHERO revision
```
