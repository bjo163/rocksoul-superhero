# SUPERHERO Data Model

## Ownership

```text
MFTL       → STORY
LEGEND     → EVENT
SUPERHERO  → PERSON / HUMAN AGENCY
```

SUPERHERO is not a biography database. Its core object is a person plus evidence-backed relationships to events, sources, narratives, claims, and other people.

## Narrative chain of custody

```text
EVENT
  ↓ witnessed / participated
PERSON
  ↓ reported / recorded
SOURCE
  ↓ copied / translated / edited
PERSON
  ↓ transmitted / interpreted
NARRATIVE
```

## Identity uncertainty

Allowed identity states:

`attested`, `strongly_supported`, `probable`, `plausible`, `disputed`,
`conflated`, `legendary`, `anonymous`, `indeterminate`.

## Temporal proximity

Relationships record one of:

`direct_participant`, `direct_witness`, `contemporary_non_witness`,
`near_contemporary`, `later_compiler`, `later_interpreter`,
`modern_researcher`, `unknown`.

Proximity is not reliability. A direct witness can still be incomplete, mistaken, or biased.

## Role attribution

Hero, villain, martyr, savior, saint, rebel, or similar labels are **source-relative attributions**. They are not permanent person properties.
