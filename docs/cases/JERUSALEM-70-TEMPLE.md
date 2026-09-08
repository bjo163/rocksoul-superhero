# CASE 001 — JERUSALEM 70 CE

## THE TEMPLE DESTRUCTION CHAIN

### TEXT · STORY · EVENT · PERSON

> **One research problem. Four repositories. Four questions. No layer is allowed to impersonate another.**

## Four-way graph

```text
RGBL
Mark 13:2
exact passage / edition / provenance
        │
        ▼
MFTL
MYTH-JERUSALEM-TEMPLE-DESTRUCTION-PROPHECY-000001
prediction narrative / interpretation
        │
        ▼
LEGEND
EVT-JERUSALEM-SECOND-TEMPLE-DESTRUCTION-70
historical destruction event
        ▲
        │ witnessed / recorded
SUPERHERO
PER-JERUSALEM-FLAVIUS-JOSEPHUS
```

## Four questions

| Layer | Question | Canonical responsibility |
|---|---|---|
| **RGBL** | What does the exact text say? | Mark 13:2 passage/content, edition and provenance |
| **MFTL** | What was told? | Temple-destruction prediction narrative and later comparison |
| **LEGEND** | What happened? | Roman siege, sack of Jerusalem and destruction of the Second Temple in 70 CE |
| **SUPERHERO** | Who carried the evidence? | Josephus as participant/witness and recorder of the war |

## Evidence boundary

```text
MARK 13:2 EXISTS AS TEXT                         strongly supported
70 CE TEMPLE DESTRUCTION OCCURRED                strongly supported
JOSEPHUS WAS PRESENT AND RECORDED THE WAR        strongly supported

TEXT CORRESPONDS TO EVENT SUBJECT MATTER         supported
TEXT WAS CERTAINLY COMPOSED BEFORE THE EVENT     not assumed
EVENT ALONE PROVES SUPERNATURAL FULFILLMENT      not established by historical evidence
```

The case deliberately preserves the scholarly dating problem around Mark. Textual attestation, event historicity, witness proximity, and theological fulfillment are different claims.

## Stable references

```text
RGBL
rgbl:mw:passage:sblgnt:v1-2:mark:13:2
rgbl:mw:passage:web-classic:2020:mar:13:2

MFTL
mftl:MYTH-JERUSALEM-TEMPLE-DESTRUCTION-PROPHECY-000001

LEGEND
legend:EVT-JERUSALEM-SECOND-TEMPLE-DESTRUCTION-70

SUPERHERO
superhero:PER-JERUSALEM-FLAVIUS-JOSEPHUS
```

## Stop rule

This case is successful only if it works **without** merging the four ownership domains into one schema or database.

```text
TEXT ≠ STORY
STORY ≠ EVENT
EVENT ≠ WITNESS
CORRESPONDENCE ≠ CAUSATION
ATTESTATION ≠ THEOLOGICAL VERDICT
```


## Fifth domain — AWS legal applicability

The same case is also consumed by `rocksoul-aws` as a distinct LAW domain:

```text
RGBL exact text
   ↓
MFTL story
   ↓
LEGEND event
   ↑
SUPERHERO person
   │
   └──────────────► AWS law / applicability
```

AWS does **not** own or rewrite the STORY, EVENT, PERSON, or RGBL records. It asks a separate legal question:

> **Was a selected legal basis applicable to this event?**

For Jerusalem 70 CE, AWS records:

```text
APPL-JERUSALEM-70-GCIV
TEMPORAL       DOES_NOT_APPLY
APPLICABILITY  NOT_APPLICABLE
LEGAL RESULT   UNRESOLVED
MIZAN          NOT_RUN
```

Stable AWS refs:

```text
aws:CASE-AWS-JERUSALEM-70
aws:APPL-JERUSALEM-70-GCIV
aws:LCLAIM-JERUSALEM-70-GCIV-TEMPORAL
aws:LASSMT-JERUSALEM-70-GCIV
```

The five-domain stop rule is therefore:

```text
TEXT ≠ STORY
STORY ≠ EVENT
EVENT ≠ WITNESS
CORRESPONDENCE ≠ CAUSATION
HISTORICAL FACT ≠ LEGAL APPLICABILITY
LEGAL APPLICABILITY ≠ MIZAN
```
