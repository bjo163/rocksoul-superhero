# Rocksoul Research Interoperability

## Three-domain model

```text
MFTL       STORY     What was told?
LEGEND     EVENT     What happened?
SUPERHERO  PERSON    Who was involved?
RGBL       TEXT      What does the source text say?
```

## Qualified references

SUPERHERO uses qualified cross-repository references to avoid namespace ambiguity.

Examples:

```text
mftl:MYTH-MES-INANA-DESCENT-000001
mftl:SOURCE-ETCSL-INANA-DESCENT

legend:EVT-IDN-KRAKATAU-1883
legend:SRC-IDN-NOAA-KRAKATAU-1883

superhero:PER-...
superhero:SRC-SH-...

rgbl:mw:work:...
rgbl:mw:passage:...
```

This does **not** require MFTL or LEGEND to rename any existing IDs.

## Accepted external namespaces

### MFTL

`MYTH-*`, `ENTITY-*`, `CLAIM-*`, `SOURCE-*`, `EVIDENCE-*`, `CAND-*`

### LEGEND

`EVT-*`, `SRC-*`, `CLM-*`, `EVD-*`, `REL-*`, `PLC-*`, `ART-*`

### SUPERHERO

`PER-*`, `SRC-SH-*`, `CLM-PER-*`, `EVD-PER-*`, `REL-PER-*`

## Ownership test

- What was told? → MFTL.
- What happened? → LEGEND.
- Who acted, witnessed, recorded, translated, transmitted, interpreted, or disputed it? → SUPERHERO.

A foreign reference never transfers ownership.


## Cross-repository validation boundary

Qualified references make ownership explicit, but SUPERHERO does not remotely fetch MFTL or LEGEND on every CI run.

```text
local SUPERHERO target
→ must exist locally

external mftl:/legend: target
→ namespace/prefix validated locally
→ target existence verified during research/audit
```

This is intentional. A temporary failure or change in another repository must not make SUPERHERO's local schema build fail.

## Shared ownership contract

```text
mftl:*       → narrative / story ownership
legend:*     → event / historical-core ownership
superhero:*  → person / human-agency ownership
rgbl:mw:*     → scripture/text corpus ownership
```

MFTL may contain event reports or named-person mentions as narrative context, but it should not duplicate canonical LEGEND events or canonical SUPERHERO person/transmission records.


## RGBL boundary

SUPERHERO may later link a person to an exact RGBL work/passage when research needs to establish authorship, transmission, quotation, translation, interpretation, or scriptural-role evidence.

For v0.1, RGBL references are documented but not yet accepted by the SUPERHERO machine schemas because no canonical person record currently requires one. Add machine support only when a real research case needs it.

This preserves the stop rule: interoperability first, schema expansion only from real data.
