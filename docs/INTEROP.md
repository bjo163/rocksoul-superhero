# Rocksoul Research Interoperability

## Research-domain model

```text
MFTL       STORY        What was told?
LEGEND     EVENT        What happened?
SUPERHERO  PERSON       Who was involved?
RGBL       TEXT         What does the source text say?
AWS        LAW          Was it legally applicable?
JIZZ       PERSPECTIVE  How is the record observed or framed?
```

`rocksoul-correlation` owns reviewed RELATIONSHIP semantics between independently canonical records.

## Qualified references

SUPERHERO uses qualified cross-repository references to avoid namespace ambiguity.

Examples:

```text
mftl:MYTH-MES-INANA-DESCENT-000001
legend:EVT-IDN-KRAKATAU-1883
superhero:PER-...
rgbl:mw:work:...
aws:LAW-...
jizz:PERSP-...
correlation:CORR-...
```

This does **not** require any owner repository to rename existing IDs.

## Accepted external namespaces

### MFTL

`MYTH-*`, `ENTITY-*`, `CLAIM-*`, `SOURCE-*`, `EVIDENCE-*`, `CAND-*`

### LEGEND

`EVT-*`, `SRC-*`, `CLM-*`, `EVD-*`, `REL-*`, `PLC-*`, `ART-*`

### SUPERHERO

`PER-*`, `SRC-SH-*`, `CLM-PER-*`, `EVD-PER-*`, `REL-PER-*`

Machine-level namespace expansion remains evidence-driven. A documented foreign domain does not need to be accepted by every local schema until a real PERSON record requires that reference.

## Ownership test

- What was told? → MFTL.
- What happened? → LEGEND.
- Who acted, witnessed, recorded, translated, transmitted, interpreted, or disputed it? → SUPERHERO.
- What does the exact source text say? → RGBL.
- Was it legally applicable? → AWS.
- How is the record observed, framed, or situated? → JIZZ.

A foreign reference never transfers ownership.

## Cross-repository validation boundary

Qualified references make ownership explicit, but SUPERHERO does not remotely fetch every owner on every CI run.

```text
local SUPERHERO target
→ must exist locally

external qualified target
→ namespace/prefix validated locally where implemented
→ target existence verified during research/audit/integration certification
```

This is intentional. A temporary failure or change in another repository must not make SUPERHERO's local schema build fail.

## Shared ownership contract

```text
mftl:*        → STORY ownership
legend:*      → EVENT ownership
superhero:*   → PERSON ownership
rgbl:mw:*     → TEXT ownership
aws:*         → LAW ownership
jizz:*        → PERSPECTIVE ownership
correlation:* → RELATIONSHIP ownership
```

MFTL may contain named-person mentions as narrative context, RGBL may contain corpus-level person referents, JIZZ may frame or observe a person, and AWS may assess legal relevance. None of those replace canonical SUPERHERO PERSON / actor / transmission research.

## RGBL boundary

SUPERHERO may link a person to an exact RGBL work/passage when research establishes authorship, transmission, quotation, translation, interpretation, or scriptural-role evidence.

RGBL corpus-level person and figure entities do not replace SUPERHERO.

```text
RGBL mw:person:*
→ corpus referent
→ scoped textual/religious-role assertions

SUPERHERO PER-*
→ historical actor research
→ witness / participant proximity
→ authorship / reporting / translation / transmission
→ chain of custody
```

Do not infer identity from matching names. An explicit crosswalk between `PER-*` and `mw:person:*` requires reconciliation evidence and may remain disputed.

## AWS boundary

`rocksoul-aws` owns LAW / applicability / legal assessment. A PERSON record may be legally relevant without moving its identity, agency, or transmission semantics into AWS.

```text
LEGAL RELEVANCE ≠ PERSON OWNERSHIP
LEGAL RESULT ≠ IDENTITY VERDICT
```

## JIZZ boundary

`rocksoul-jizz` owns PERSPECTIVE / observation / framing.

A JIZZ perspective may observe, frame, react to, or situate a PERSON record, but it does not rewrite canonical identity, role, proximity, authorship, witnessing, or transmission claims in SUPERHERO.

```text
superhero:PER-...
        ↓ observed / framed by
jizz:PERSP-...
```

`PERSPECTIVE ≠ PERSON` and `PERSPECTIVE ≠ IDENTITY`.

## SUPERHERO relationships vs global Correlation

SUPERHERO `REL-PER-*` objects are local actor/transmission graph facts needed to make PERSON research inspectable. They remain canonical inside SUPERHERO.

`rocksoul-correlation` owns reviewed ecosystem-wide RELATIONSHIP semantics, explainability, freshness and targeted re-analysis.

```text
SUPERHERO REL-PER-*            local PERSON / transmission graph
rocksoul-correlation CORR-*    reviewed cross-domain relationship
```

Local actor relations are therefore not a second global correlation store, and Correlation must not duplicate the underlying PERSON record.
