# SUPERHERO Public Observatory Contract

## Purpose

The public observatory is a read-only projection of canonical SUPERHERO research data. It exists to make PERSON identity, authorship, witnessing, transmission, evidence, sources, and uncertainty inspectable without creating a second research truth layer in React.

```text
canonical JSON
  → schema + graph validation
  → generated index
  → deployment snapshot
  → @rocksoul/ui semantic rendering
  → Vite production bundle
```

The browser consumes `/data/superhero.snapshot.json`. It does not query GitHub APIs at runtime.

## Eight public sections

1. **People** — canonical and candidate PERSON navigation with search/filter state.
2. **Transmission** — source-relative actor edges and cross-domain qualified references.
3. **Evidence** — atomic claims, evidence edges, limitations, source refs, and confidence.
4. **Quality** — coverage metrics plus the claim-by-evidence stance matrix.
5. **Sources** — the complete local source registry, with current-dossier sources highlighted.
6. **Uncertainty** — explicit person-level uncertainty statements.
7. **Taxonomy** — canonical relation and proximity vocabulary.
8. **Contract** — JSON Schemas plus automatic public record ledger.

## Quality is not truth scoring

The Quality section measures documentary coverage only.

Current metrics include:

- claims with at least one evidence edge;
- number of evidence edges;
- mean recorded edge confidence;
- local source links;
- cross-domain reference count;
- explicit caveat count;
- unresolved/unmapped evidence edges.

The evidence matrix maps evidence relations to visual stance columns through `config/public-observatory.json`:

```text
supports                → support
contradicts             → counter
contextualizes          → context
alternative_explanation → alternative
unresolved_uncertainty  → intentionally outside stance columns
```

The UI must not translate these metrics into a universal truth score.

## URL and navigation state

The presentation contract owns query parameter names:

- `person` — selected PERSON id;
- `q` — search text;
- `identity` — identity-state filter;
- `relation` — actor-relation filter.

Selecting a PERSON creates browser history. Search/filter changes replace the current URL state. Back/forward navigation restores dossier and filter state.

A copied or shared URL therefore preserves the current research view without relying on client storage.

## Keyboard and accessibility contract

- `/` focuses the search field when focus is not already in an editable control.
- `Escape` clears an active search.
- A skip link targets `#main-content`.
- Result count and share completion use polite live status.
- Claim/source anchors have scroll offsets suitable for the sticky header.
- Reduced-motion preferences disable smooth scrolling through existing CSS.
- Interactive evidence-matrix rows support keyboard activation through `@rocksoul/ui`.

## Shared implementation ownership

`rocksoul-assets` owns visual truth.

`@rocksoul/ui` owns reusable implementation semantics including qualified-reference parsing, domain ownership, status variants, confidence presentation, evidence matrix behavior, and record-field rendering.

`rocksoul-superhero` owns PERSON data and the composition of those primitives into the observatory.

Consumer code must not reintroduce prefix parsers or duplicate semantic status resolvers.

## Search metadata

The Vite build injects:

- canonical title and description;
- robots and application metadata;
- canonical URL;
- OpenGraph/Twitter metadata;
- canonical Rocksoul asset preconnect;
- Dataset JSON-LD containing the deployment dataset hash, schema version, snapshot download URL, and visible count metrics.

## Production security

Vercel delivery includes:

- Content Security Policy;
- frame denial;
- permissions policy;
- strict referrer policy;
- `nosniff`;
- cross-origin opener isolation;
- immutable caching for fingerprinted bundles;
- explicit revalidation for the deployment snapshot.

See [Production Operations](OPERATIONS.md) for the release and rollback path.
