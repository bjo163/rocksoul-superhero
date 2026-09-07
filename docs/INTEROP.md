# Rocksoul Research Interoperability

## Three-domain model

```text
MFTL       STORY     What was told?
LEGEND     EVENT     What happened?
SUPERHERO  PERSON    Who was involved?
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
