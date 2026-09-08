import { StrictMode, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  Badge,
  Button,
  Citation,
  ConfidenceMeter,
  DossierHeader,
  EvidenceCard,
  EvidenceMatrix,
  Input,
  MOONWITNESS_STABLE_REPOSITORY_BASE,
  MWHeader,
  MoonWitnessAssetProvider,
  MoonWitnessPersonMark,
  ObservatorySectionNav,
  ProvenanceRail,
  QualifiedReferenceView,
  RecordFieldGrid,
  Select,
  SourceBlock,
  canonicalOwnerFor,
  parseQualifiedReference,
  semanticStatusVariant,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import "./styles.css"
import observatoryConfigJson from "../config/public-observatory.json"
import type {
  ClaimRecord,
  EvidenceRecord,
  ObservatoryConfig,
  ObservatorySection,
  PersonRecord,
  RelationshipRecord,
  SourceRecord,
  SuperheroSnapshot,
} from "./types"

const bootConfig = observatoryConfigJson as ObservatoryConfig
const assetBase = `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness`
const personOwner = canonicalOwnerFor("PERSON")

function titleCase(value = "") {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sectionFor(config: ObservatoryConfig, id: string) {
  const section = config.sections.find((item) => item.id === id)
  if (!section) throw new Error(`Missing observatory section contract: ${id}`)
  return section
}

function referenceLabel(ref: string) {
  const parsed = parseQualifiedReference(ref)
  return titleCase((parsed?.id ?? ref).replaceAll("-", " "))
}

function localSourceId(ref: string) {
  const parsed = parseQualifiedReference(ref)
  return parsed?.domain === "PERSON" && parsed.kind === "source" ? parsed.id : null
}

function referenceHref(ref: string) {
  const id = localSourceId(ref)
  return id ? `#source-${id}` : undefined
}

function externalHttpHref(value?: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function readUrlState(config: ObservatoryConfig) {
  const params = new URLSearchParams(window.location.search)
  return {
    person: params.get(config.routing.person_param) ?? "",
    query: params.get(config.routing.query_param) ?? "",
    identity: params.get(config.routing.identity_param) ?? "all",
    relation: params.get(config.routing.relation_param) ?? "all",
  }
}

function syncUrlState(
  config: ObservatoryConfig,
  state: { person: string; query: string; identity: string; relation: string },
  mode: "replace" | "push" = "replace",
) {
  const url = new URL(window.location.href)
  const setOptional = (key: string, value: string, emptyValue = "") => {
    if (value && value !== emptyValue) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  setOptional(config.routing.person_param, state.person)
  setOptional(config.routing.query_param, state.query.trim())
  setOptional(config.routing.identity_param, state.identity, "all")
  setOptional(config.routing.relation_param, state.relation, "all")
  window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", url)
}

function fallbackCopy(text: string) {
  const node = document.createElement("textarea")
  node.value = text
  node.setAttribute("readonly", "")
  node.style.position = "fixed"
  node.style.opacity = "0"
  document.body.appendChild(node)
  node.select()
  const copied = document.execCommand("copy")
  node.remove()
  if (!copied) throw new Error("Copy command was rejected")
}

async function loadSnapshot() {
  const response = await fetch(bootConfig.source.snapshot_path, { cache: "no-cache" })
  if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`)
  return response.json() as Promise<SuperheroSnapshot>
}

function SectionHeader({ section }: { section: ObservatorySection }) {
  return (
    <header className="section-header">
      <div>
        <p className="rs-eyebrow">{section.index} / {section.eyebrow}</p>
        <h2>{section.headline}</h2>
      </div>
      <p>{section.description}</p>
    </header>
  )
}

function MetricStrip({ snapshot }: { snapshot: SuperheroSnapshot }) {
  return (
    <div className="metric-strip" aria-label={snapshot.ui.header.brand_label}>
      {snapshot.ui.metrics.map((metric) => (
        <div key={metric.key}>
          <strong>{String(snapshot.counts[metric.key]).padStart(2, "0")}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </div>
  )
}

function Hero({ snapshot }: { snapshot: SuperheroSnapshot }) {
  const { hero } = snapshot.ui
  return (
    <section id="top" className="superhero-hero">
      <div className="hero-grid">
        <div>
          <p className="rs-eyebrow">{hero.eyebrow}</p>
          <h1>{hero.headline}<br /><em>{hero.accent}</em></h1>
          <p className="hero-copy">{hero.copy}</p>
          <div className="rule-strip">
            {hero.rules.map((rule) => <span key={rule}>{rule}</span>)}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <img src={`${assetBase}/${hero.asset}`} alt="" />
        </div>
      </div>
      <MetricStrip snapshot={snapshot} />
      <div className="snapshot-bar">
        <span>{hero.snapshot_label}</span>
        <code>{snapshot.source.repository} · dataset:{snapshot.source.dataset_sha256}</code>
        <span>{hero.schema_label} {snapshot.schema_version}</span>
      </div>
    </section>
  )
}

function Filters({
  snapshot,
  section,
  query,
  setQuery,
  identityFilter,
  setIdentityFilter,
  relationFilter,
  setRelationFilter,
  identityOptions,
  count,
  hasFilters,
  onReset,
}: {
  snapshot: SuperheroSnapshot
  section: ObservatorySection
  query: string
  setQuery: (value: string) => void
  identityFilter: string
  setIdentityFilter: (value: string) => void
  relationFilter: string
  setRelationFilter: (value: string) => void
  identityOptions: string[]
  count: number
  hasFilters: boolean
  onReset: () => void
}) {
  const { filters } = snapshot.ui
  return (
    <section id="search" className="filter-panel" aria-label={section.label}>
      <div className="filter-heading">
        <div>
          <p className="rs-eyebrow">{section.index} / {section.eyebrow}</p>
          <h2>{section.headline}</h2>
        </div>
        <div className="filter-meta">
          <span aria-live="polite"><Badge variant="neutral">{count} {filters.matching_suffix}</Badge></span>
          {hasFilters ? <Button variant="ghost" onClick={onReset}>{filters.reset_label}</Button> : null}
        </div>
      </div>
      <div className="filter-grid">
        <Input
          id="superhero-search"
          label={filters.search_label}
          helper={filters.search_hint}
          variant="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={filters.search_placeholder}
        />
        <Select
          label={filters.identity_label}
          value={identityFilter}
          onChange={(event) => setIdentityFilter(event.currentTarget.value)}
          options={[
            { label: filters.identity_all_label, value: "all" },
            ...identityOptions.map((value) => ({ label: titleCase(value), value })),
          ]}
        />
        <Select
          label={filters.relation_label}
          value={relationFilter}
          onChange={(event) => setRelationFilter(event.currentTarget.value)}
          options={[
            { label: filters.relation_all_label, value: "all" },
            ...snapshot.taxonomy.relations.map((relation) => ({ label: relation.label, value: relation.id })),
          ]}
        />
      </div>
    </section>
  )
}

function PersonIndexGroup({
  title,
  people,
  selectedId,
  onSelect,
  empty,
  badge,
}: {
  title: string
  people: PersonRecord[]
  selectedId: string
  onSelect: (id: string) => void
  empty: string
  badge?: string
}) {
  return (
    <div className="person-index-group">
      <div className="index-heading">
        <span>{title}</span>
        <strong>{String(people.length).padStart(2, "0")}</strong>
      </div>
      {people.map((person, index) => (
        <button
          key={person.id}
          className={selectedId === person.id ? "active" : ""}
          onClick={() => onSelect(person.id)}
          aria-current={selectedId === person.id ? "true" : undefined}
        >
          <span className="record-no">{String(index + 1).padStart(2, "0")}</span>
          <span className="person-label">
            <strong>{person.canonical_name}</strong>
            <small>{titleCase(person.identity_status)} · {person.active_period.start ?? "—"}</small>
            {badge ? <Badge variant="info">{badge}</Badge> : null}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ))}
      {!people.length ? <p className="index-empty">{empty}</p> : null}
    </div>
  )
}

function PersonIndex({
  snapshot,
  canonicalPeople,
  candidatePeople,
  selectedId,
  onSelect,
}: {
  snapshot: SuperheroSnapshot
  canonicalPeople: PersonRecord[]
  candidatePeople: PersonRecord[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const copy = snapshot.ui.person_index
  return (
    <aside className="person-index" aria-label={sectionFor(snapshot.ui, "people").label}>
      <PersonIndexGroup title={copy.title} people={canonicalPeople} selectedId={selectedId} onSelect={onSelect} empty={copy.empty} />
      <PersonIndexGroup
        title={copy.candidate_title}
        people={candidatePeople}
        selectedId={selectedId}
        onSelect={onSelect}
        empty={copy.candidate_empty}
        badge={snapshot.ui.labels.candidate_badge}
      />
      <div className="index-note">
        <p>{copy.principle_title}</p>
        <span>{copy.principle_copy}</span>
      </div>
    </aside>
  )
}

function PersonDossier({
  snapshot,
  person,
  claims,
  relationships,
  candidate,
  onShare,
  shareStatus,
}: {
  snapshot: SuperheroSnapshot
  person: PersonRecord
  claims: ClaimRecord[]
  relationships: RelationshipRecord[]
  candidate: boolean
  onShare: () => void
  shareStatus: string
}) {
  const activePeriod = [person.active_period.start, person.active_period.end].filter(Boolean).join(" → ") || "—"
  const dossier = snapshot.ui.dossier
  const recordClass = candidate ? dossier.candidate_label : dossier.canonical_label

  return (
    <div className="dossier-stack">
      <DossierHeader
        eyebrow={dossier.eyebrow}
        title={person.canonical_name}
        summary={person.review.note ?? undefined}
        recordId={person.id}
        status={{ label: titleCase(person.identity_status), variant: semanticStatusVariant(person.identity_status) }}
        metadata={[
          { label: dossier.metadata.review, value: person.review.status },
          { label: dossier.metadata.active_period, value: activePeriod },
          { label: dossier.metadata.claims, value: String(claims.length) },
          { label: dossier.metadata.relations, value: String(relationships.length) },
          { label: dossier.metadata.record_class, value: recordClass },
        ]}
        actions={
          <>
            <Button onClick={() => document.getElementById("transmission")?.scrollIntoView({ behavior: "smooth" })}>{dossier.actions.transmission}</Button>
            <Button variant="secondary" onClick={() => document.getElementById("claims")?.scrollIntoView({ behavior: "smooth" })}>{dossier.actions.evidence}</Button>
            <Button variant="ghost" onClick={onShare}>{dossier.actions.share}</Button>
          </>
        }
      />
      {shareStatus ? <p className="dossier-share-status" role="status" aria-live="polite">{shareStatus}</p> : null}
      <div className="identity-panel">
        <div className="identity-mark-card">
          <MoonWitnessPersonMark alt="" className="person-mark" />
          <div>
            <p className="rs-eyebrow">{dossier.identity_eyebrow}</p>
            <h3>{person.canonical_name}</h3>
            <Badge variant={candidate ? "info" : "verified"}>{recordClass}</Badge>
          </div>
        </div>
        <div className="record-ledger-panel">
          <p className="rs-eyebrow">{snapshot.ui.labels.record_fields}</p>
          <RecordFieldGrid record={person as unknown as Record<string, unknown>} referenceHref={referenceHref} />
        </div>
      </div>
    </div>
  )
}

function TransmissionSection({
  snapshot,
  person,
  relationships,
}: {
  snapshot: SuperheroSnapshot
  person: PersonRecord
  relationships: RelationshipRecord[]
}) {
  const section = sectionFor(snapshot.ui, "transmission")
  const nodes = [
    { id: person.id, kind: "person" as const, label: person.canonical_name, detail: titleCase(person.identity_status), active: true },
    ...relationships.map((relationship) => {
      const parsed = parseQualifiedReference(relationship.object_ref)
      const variant = semanticStatusVariant(relationship.status)
      return {
        id: relationship.id,
        kind: parsed?.kind ?? personOwner.defaultKind,
        label: referenceLabel(relationship.object_ref),
        detail: titleCase(relationship.relation),
        external: parsed ? parsed.domain !== "PERSON" : true,
        unresolved: variant === "unresolved" || variant === "contested" || variant === "disputed",
      }
    }),
  ]

  return (
    <section id={section.id} className="research-section">
      <SectionHeader section={section} />
      <ProvenanceRail nodes={nodes} description={nodes.map((node) => `${node.kind.toUpperCase()}: ${node.label}`).join(" → ")} />
      <div className="relationship-grid">
        {relationships.map((relationship) => (
          <article key={relationship.id} className="relationship-card">
            <div className="relationship-head">
              <Badge variant={semanticStatusVariant(relationship.status)}>{titleCase(relationship.status)}</Badge>
              <QualifiedReferenceView value={relationship.object_ref} href={referenceHref(relationship.object_ref)} compact />
            </div>
            <p className="relationship-type">{titleCase(relationship.relation)}</p>
            <ConfidenceMeter value={relationship.confidence} label={snapshot.ui.labels.confidence} detail={titleCase(relationship.proximity)} />
            <RecordFieldGrid
              record={relationship as unknown as Record<string, unknown>}
              referenceHref={referenceHref}
              className="relationship-record-grid"
            />
          </article>
        ))}
        {!relationships.length ? <div className="empty-state">{snapshot.ui.labels.no_relationships}</div> : null}
      </div>
    </section>
  )
}

function EvidenceForClaim({
  snapshot,
  claim,
  evidence,
}: {
  snapshot: SuperheroSnapshot
  claim: ClaimRecord
  evidence: EvidenceRecord[]
}) {
  return (
    <article id={`claim-${claim.id}`} className="claim-block">
      <div className="claim-heading">
        <div>
          <p className="rs-eyebrow">{titleCase(claim.claim_type)}</p>
          <h3>{claim.statement}</h3>
        </div>
        <Badge variant={semanticStatusVariant(claim.epistemic_status)}>{titleCase(claim.epistemic_status)}</Badge>
      </div>
      <RecordFieldGrid
        record={claim as unknown as Record<string, unknown>}
        referenceHref={referenceHref}
        className="claim-record-grid"
      />
      <div className="evidence-grid">
        {evidence.map((item) => {
          const status = semanticStatusVariant(item.relation)
          return (
            <div key={item.id} className="evidence-item">
              <EvidenceCard
                domain="PERSON"
                recordId={item.id}
                repo={personOwner.repository}
                claim={item.summary}
                provenance={item.source_refs.join(" · ")}
                verification={titleCase(item.evidence_type)}
                status={status}
                canonical
                flagged={status === "disputed" || status === "contested"}
                sourceHref={referenceHref(item.source_refs[0] ?? "")}
              />
              <ConfidenceMeter value={item.confidence} label={snapshot.ui.labels.confidence} />
              <RecordFieldGrid
                record={item as unknown as Record<string, unknown>}
                referenceHref={referenceHref}
                className="evidence-record-grid"
              />
            </div>
          )
        })}
        {!evidence.length ? <div className="empty-state">{snapshot.ui.labels.no_evidence}</div> : null}
      </div>
    </article>
  )
}

function ClaimsEvidenceSection({
  snapshot,
  claims,
  evidence,
}: {
  snapshot: SuperheroSnapshot
  claims: ClaimRecord[]
  evidence: EvidenceRecord[]
}) {
  const section = sectionFor(snapshot.ui, "claims")
  return (
    <section id={section.id} className="research-section">
      <SectionHeader section={section} />
      <div className="claim-stack">
        {claims.map((claim) => (
          <EvidenceForClaim
            key={claim.id}
            snapshot={snapshot}
            claim={claim}
            evidence={evidence.filter((item) => item.claim_id === claim.id)}
          />
        ))}
        {!claims.length ? <div className="empty-state">{snapshot.ui.labels.no_claims}</div> : null}
      </div>
    </section>
  )
}

function sourceIdsForPerson(
  person: PersonRecord,
  claims: ClaimRecord[],
  evidence: EvidenceRecord[],
  relationships: RelationshipRecord[],
) {
  const refs = [
    ...person.source_refs,
    ...claims.flatMap((claim) => claim.source_refs),
    ...evidence.flatMap((item) => item.source_refs),
    ...relationships.flatMap((relationship) => relationship.source_refs),
  ]
  return new Set(refs.map(localSourceId).filter((id): id is string => Boolean(id)))
}

function QualitySection({
  snapshot,
  person,
  claims,
  evidence,
  relationships,
  selectedSourceIds,
}: {
  snapshot: SuperheroSnapshot
  person: PersonRecord
  claims: ClaimRecord[]
  evidence: EvidenceRecord[]
  relationships: RelationshipRecord[]
  selectedSourceIds: Set<string>
}) {
  const section = sectionFor(snapshot.ui, "quality")
  const rows = claims.map((claim) => {
    const claimEvidence = evidence.filter((item) => item.claim_id === claim.id)
    const values: Partial<Record<"support" | "counter" | "context" | "alternative", number>> = {}
    for (const item of claimEvidence) {
      const stance = snapshot.ui.quality.matrix_relation_map[item.relation]
      if (stance) values[stance] = (values[stance] ?? 0) + 1
    }
    return {
      id: claim.id,
      label: claim.statement,
      context: claim.id,
      epistemic: titleCase(claim.epistemic_status),
      sourceCount: new Set([...claim.source_refs, ...claimEvidence.flatMap((item) => item.source_refs)]).size,
      values,
    }
  })

  const evidencedClaims = new Set(evidence.map((item) => item.claim_id)).size
  const meanConfidence = evidence.length
    ? evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length
    : null
  const externalDomains = new Set<string>()
  const refs = [
    ...person.place_refs,
    ...person.source_refs,
    ...claims.flatMap((claim) => claim.source_refs),
    ...evidence.flatMap((item) => item.source_refs),
    ...relationships.flatMap((relationship) => [relationship.object_ref, ...relationship.source_refs]),
  ]
  for (const ref of refs) {
    const parsed = parseQualifiedReference(ref)
    if (parsed && parsed.domain !== "PERSON") externalDomains.add(parsed.domain)
  }
  const explicitCaveats =
    person.uncertainty.length +
    relationships.reduce((sum, relationship) => sum + relationship.uncertainty.length, 0) +
    evidence.reduce((sum, item) => sum + item.limitations.length, 0)
  const unresolvedEdges = evidence.filter((item) => !snapshot.ui.quality.matrix_relation_map[item.relation]).length

  const metrics = [
    {
      label: snapshot.ui.quality.claim_coverage,
      value: `${evidencedClaims}/${claims.length}`,
      detail: claims.length ? `${Math.round((evidencedClaims / claims.length) * 100)}%` : "—",
    },
    { label: snapshot.ui.quality.evidence_edges, value: String(evidence.length), detail: person.id },
    {
      label: snapshot.ui.quality.mean_confidence,
      value: meanConfidence === null ? "—" : `${Math.round(meanConfidence * 100)}%`,
      detail: evidence.length ? `${evidence.length} edges` : "no edges",
    },
    { label: snapshot.ui.quality.source_coverage, value: String(selectedSourceIds.size), detail: `${snapshot.sources.length} registry total` },
    { label: snapshot.ui.quality.external_domains, value: String(externalDomains.size), detail: [...externalDomains].sort().join(" · ") || "none" },
    { label: snapshot.ui.quality.explicit_caveats, value: String(explicitCaveats), detail: snapshot.ui.quality.unresolved_edges + `: ${unresolvedEdges}` },
  ]

  return (
    <section id={section.id} className="research-section quality-section">
      <SectionHeader section={section} />
      <div className="quality-principle">
        <Badge variant="info">coverage ≠ truth</Badge>
        <p>{snapshot.ui.quality.disclaimer}</p>
      </div>
      <div className="quality-metrics" aria-label={section.label}>
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>
      <EvidenceMatrix
        className="quality-matrix"
        rows={rows}
        caption={snapshot.ui.quality.matrix_caption}
        onActivateRow={(row) => document.getElementById(`claim-${row.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
    </section>
  )
}

function SourcesSection({
  snapshot,
  selectedSourceIds,
}: {
  snapshot: SuperheroSnapshot
  selectedSourceIds: Set<string>
}) {
  const section = sectionFor(snapshot.ui, "sources")
  const selectedCount = snapshot.sources.filter((source) => selectedSourceIds.has(source.id)).length
  return (
    <section id={section.id} className="research-section source-section">
      <SectionHeader section={section} />
      <div className="source-selection-summary">
        <div>
          <p className="rs-eyebrow">{snapshot.ui.labels.selected_sources}</p>
          <p>{snapshot.ui.labels.all_sources}</p>
        </div>
        <Badge variant={selectedCount ? "info" : "neutral"}>{selectedCount}/{snapshot.sources.length}</Badge>
      </div>
      <div className="source-grid">
        {snapshot.sources.map((source) => {
          const href = externalHttpHref(source.locator)
          const selected = selectedSourceIds.has(source.id)
          return (
            <article
              key={source.id}
              id={`source-${source.id}`}
              className="source-wrapper"
              data-selected={selected ? "true" : "false"}
            >
              <SourceBlock
                sourceId={source.id}
                title={source.title}
                excerpt={source.provenance}
                citation={source.id}
                provenance={source.locator ?? snapshot.ui.labels.source_no_locator}
                verification={source.quality ?? source.source_type}
              />
              <RecordFieldGrid record={source as unknown as Record<string, unknown>} referenceHref={referenceHref} />
              <div className="source-actions">
                <Citation
                  code={source.id}
                  source={source.title}
                  locator={source.locator ?? snapshot.ui.labels.source_no_locator}
                  variant="block"
                />
                {href ? (
                  <a className="source-open" href={href} target="_blank" rel="noreferrer">{snapshot.ui.labels.source_open}</a>
                ) : null}
              </div>
            </article>
          )
        })}
        {!snapshot.sources.length ? <div className="empty-state">{snapshot.ui.labels.no_sources}</div> : null}
      </div>
    </section>
  )
}

function UncertaintySection({ snapshot, person }: { snapshot: SuperheroSnapshot; person: PersonRecord }) {
  const section = sectionFor(snapshot.ui, "uncertainty")
  return (
    <section id={section.id} className="uncertainty-section">
      <div>
        <p className="rs-eyebrow">{section.index} / {section.eyebrow}</p>
        <h2>{section.headline}</h2>
        <p className="uncertainty-copy">{section.description}</p>
      </div>
      <div className="uncertainty-list">
        {person.uncertainty.map((item, index) => (
          <article key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </article>
        ))}
        {!person.uncertainty.length ? <div className="empty-state">{snapshot.ui.labels.no_uncertainty}</div> : null}
      </div>
    </section>
  )
}

function TaxonomySection({ snapshot }: { snapshot: SuperheroSnapshot }) {
  const section = sectionFor(snapshot.ui, "taxonomy")
  return (
    <section id={section.id} className="research-section taxonomy-section">
      <SectionHeader section={section} />
      <div className="taxonomy-block">
        <p className="rs-eyebrow">{snapshot.ui.labels.taxonomy_relations} · {snapshot.taxonomy.relations.length}</p>
        <div className="taxonomy-grid">
          {snapshot.taxonomy.relations.map((relation) => (
            <RecordFieldGrid key={relation.id} record={relation as unknown as Record<string, unknown>} />
          ))}
        </div>
      </div>
      <div className="taxonomy-block">
        <p className="rs-eyebrow">{snapshot.ui.labels.taxonomy_proximity} · {snapshot.taxonomy.proximity.length}</p>
        <div className="proximity-grid">
          {snapshot.taxonomy.proximity.map((value) => <Badge key={value} variant="neutral">{titleCase(value)}</Badge>)}
        </div>
      </div>
    </section>
  )
}

function publicRecordCollections(snapshot: SuperheroSnapshot) {
  return Object.entries(snapshot)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => [
      key,
      (value as unknown[]).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)),
    ] as const)
}

function ContractSection({ snapshot }: { snapshot: SuperheroSnapshot }) {
  const section = sectionFor(snapshot.ui, "contract")
  const collections = publicRecordCollections(snapshot)

  return (
    <section id={section.id} className="research-section contract-section">
      <SectionHeader section={section} />
      <div className="contract-block">
        <div className="contract-heading">
          <p className="rs-eyebrow">{snapshot.ui.labels.schemas}</p>
          <p>{snapshot.ui.labels.schema_copy}</p>
        </div>
        <div className="schema-stack">
          {Object.entries(snapshot.schemas).map(([name, schema]) => (
            <details key={name} open>
              <summary>
                <strong>{schema.title ?? titleCase(name)}</strong>
                <code>{schema.$id ?? name}</code>
              </summary>
              <RecordFieldGrid record={schema as Record<string, unknown>} />
            </details>
          ))}
        </div>
      </div>
      <div className="contract-block">
        <div className="contract-heading">
          <p className="rs-eyebrow">{snapshot.ui.labels.record_ledger}</p>
          <p>{snapshot.ui.labels.ledger_copy}</p>
        </div>
        <div className="ledger-stack">
          {collections.map(([name, records]) => (
            <details key={name}>
              <summary>
                <strong>{titleCase(name)}</strong>
                <Badge variant="neutral">{records.length}</Badge>
              </summary>
              <div className="ledger-records">
                {records.map((record, index) => (
                  <details key={String(record.id ?? `${name}-${index}`)}>
                    <summary>
                      <code>{String(record.id ?? `${name}-${index + 1}`)}</code>
                    </summary>
                    <RecordFieldGrid record={record} referenceHref={referenceHref} />
                  </details>
                ))}
                {!records.length ? <div className="empty-state">0</div> : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer({ snapshot }: { snapshot: SuperheroSnapshot }) {
  return (
    <footer className="superhero-footer">
      <img src={`${assetBase}/${snapshot.ui.footer.asset}`} alt="Rocksoul" />
      <p>{snapshot.ui.footer.slogan}</p>
      <span>{snapshot.source.repository} · {snapshot.source.dataset_sha256}</span>
    </footer>
  )
}

function App() {
  const [snapshot, setSnapshot] = useState<SuperheroSnapshot | null>(null)
  const [error, setError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [shareStatus, setShareStatus] = useState("")
  const [selectedId, setSelectedId] = useState(() => readUrlState(bootConfig).person)
  const [query, setQuery] = useState(() => readUrlState(bootConfig).query)
  const [identityFilter, setIdentityFilter] = useState(() => readUrlState(bootConfig).identity)
  const [relationFilter, setRelationFilter] = useState(() => readUrlState(bootConfig).relation)

  useEffect(() => {
    let active = true
    setError("")
    loadSnapshot()
      .then((value) => {
        if (!active) return
        setSnapshot(value)
        const records = [...value.people, ...value.candidates]
        const urlState = readUrlState(value.ui)
        const validIdentity = new Set(records.map((person) => person.identity_status))
        const validRelations = new Set(value.taxonomy.relations.map((relation) => relation.id))
        const validPerson = records.some((person) => person.id === urlState.person)
        const initial = validPerson ? urlState.person : records[0]?.id ?? ""
        setSelectedId(initial)
        setQuery(urlState.query)
        setIdentityFilter(urlState.identity === "all" || validIdentity.has(urlState.identity) ? urlState.identity : "all")
        setRelationFilter(urlState.relation === "all" || validRelations.has(urlState.relation) ? urlState.relation : "all")
      })
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : String(cause)))
    return () => { active = false }
  }, [loadAttempt])

  const allPeople = useMemo(() => [...(snapshot?.people ?? []), ...(snapshot?.candidates ?? [])], [snapshot])
  const candidateIds = useMemo(() => new Set((snapshot?.candidates ?? []).map((person) => person.id)), [snapshot])

  const relationshipByPerson = useMemo(() => {
    const map = new Map<string, RelationshipRecord[]>()
    for (const relationship of snapshot?.relationships ?? []) {
      const current = map.get(relationship.subject_id) ?? []
      current.push(relationship)
      map.set(relationship.subject_id, current)
    }
    return map
  }, [snapshot])

  const claimByPerson = useMemo(() => {
    const map = new Map<string, ClaimRecord[]>()
    for (const claim of snapshot?.claims ?? []) {
      const current = map.get(claim.subject_id) ?? []
      current.push(claim)
      map.set(claim.subject_id, current)
    }
    return map
  }, [snapshot])

  const sourceMap = useMemo(() => new Map((snapshot?.sources ?? []).map((source) => [source.id, source])), [snapshot])
  const identityOptions = useMemo(() => [...new Set(allPeople.map((person) => person.identity_status))].sort(), [allPeople])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const editable = target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)
      if (event.key === "/" && !editable && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        document.getElementById("superhero-search")?.focus()
      }
      if (event.key === "Escape" && document.activeElement?.id === "superhero-search" && query) {
        setQuery("")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [query])

  useEffect(() => {
    if (!snapshot) return
    syncUrlState(snapshot.ui, {
      person: selectedId,
      query,
      identity: identityFilter,
      relation: relationFilter,
    })
  }, [snapshot, selectedId, query, identityFilter, relationFilter])

  useEffect(() => {
    if (!snapshot) return
    const onPopState = () => {
      const state = readUrlState(snapshot.ui)
      const validPerson = allPeople.some((person) => person.id === state.person)
      setSelectedId(validPerson ? state.person : allPeople[0]?.id ?? "")
      setQuery(state.query)
      setIdentityFilter(state.identity)
      setRelationFilter(state.relation)
      setShareStatus("")
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [snapshot, allPeople])

  useEffect(() => {
    if (!snapshot) return
    const person = allPeople.find((item) => item.id === selectedId)
    document.title = person ? `${person.canonical_name} · ${snapshot.ui.site.title}` : snapshot.ui.site.title
  }, [snapshot, selectedId, allPeople])

  const filteredPeople = useMemo(() => {
    if (!snapshot) return []
    const needle = query.trim().toLowerCase()
    return allPeople.filter((person) => {
      if (identityFilter !== "all" && person.identity_status !== identityFilter) return false
      const personRelations = relationshipByPerson.get(person.id) ?? []
      if (relationFilter !== "all" && !personRelations.some((item) => item.relation === relationFilter)) return false
      if (!needle) return true
      const personClaims = claimByPerson.get(person.id) ?? []
      const refIds = new Set([
        ...person.source_refs,
        ...personClaims.flatMap((claim) => claim.source_refs),
        ...personRelations.flatMap((relationship) => relationship.source_refs),
      ].map(localSourceId).filter((id): id is string => Boolean(id)))
      const sourceTitles = [...refIds].map((id) => sourceMap.get(id)?.title ?? "")
      const haystack = [
        person.id,
        person.canonical_name,
        ...(person.aliases ?? []),
        ...personClaims.map((claim) => claim.statement),
        ...personRelations.map((relationship) => `${relationship.relation} ${relationship.object_ref}`),
        ...sourceTitles,
      ].join(" ").toLowerCase()
      return haystack.includes(needle)
    })
  }, [snapshot, allPeople, query, identityFilter, relationFilter, relationshipByPerson, claimByPerson, sourceMap])

  if (!snapshot) {
    const states = bootConfig.states
    return (
      <main className="boot-state" role={error ? "alert" : "status"} aria-busy={error ? undefined : true}>
        <p className="rs-eyebrow">{error ? states.error_eyebrow : states.loading_eyebrow}</p>
        <h1>{error ? states.error_headline : states.loading_headline}</h1>
        <p>{error || states.loading_copy}</p>
        {error ? <Button onClick={() => setLoadAttempt((value) => value + 1)}>{states.retry_label}</Button> : null}
      </main>
    )
  }

  const person = allPeople.find((item) => item.id === selectedId) ?? allPeople[0]
  if (!person) return <main className="boot-state">{snapshot.ui.states.no_people}</main>

  const personClaims = claimByPerson.get(person.id) ?? []
  const personRelationships = relationshipByPerson.get(person.id) ?? []
  const personEvidence = snapshot.evidence.filter((item) => personClaims.some((claim) => claim.id === item.claim_id))
  const selectedSourceIds = sourceIdsForPerson(person, personClaims, personEvidence, personRelationships)
  const canonicalFiltered = filteredPeople.filter((item) => !candidateIds.has(item.id))
  const candidateFiltered = filteredPeople.filter((item) => candidateIds.has(item.id))
  const hasFilters = Boolean(query.trim()) || identityFilter !== "all" || relationFilter !== "all"

  const resetFilters = () => {
    setQuery("")
    setIdentityFilter("all")
    setRelationFilter("all")
  }

  const selectPerson = (id: string) => {
    setSelectedId(id)
    setShareStatus("")
    syncUrlState(snapshot.ui, {
      person: id,
      query,
      identity: identityFilter,
      relation: relationFilter,
    }, "push")
    document.getElementById("people")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const sharePerson = async () => {
    const url = window.location.href
    const shareData = {
      title: `${person.canonical_name} · ${snapshot.ui.site.title}`,
      text: person.review.note ?? snapshot.ui.site.description,
      url,
    }
    setShareStatus("")
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData)
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        fallbackCopy(url)
      }
      setShareStatus(snapshot.ui.dossier.share_success)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return
      setShareStatus(snapshot.ui.dossier.share_error)
    }
  }

  const navItems = snapshot.ui.sections.filter((section) => section.nav).map((section) => ({ label: section.label, href: `#${section.id}` }))

  return (
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <div className="superhero-app">
        <a className="skip-link" href="#main-content">{snapshot.ui.labels.skip_to_content}</a>
        <MWHeader
          variant="auto"
          brandLabel={snapshot.ui.header.brand_label}
          liveLabel={snapshot.ui.header.live_label}
          navItems={navItems}
          searchHref={snapshot.ui.header.search_href}
        />
        <main id="main-content" tabIndex={-1}>
          <Hero snapshot={snapshot} />
          <ObservatorySectionNav
            className="observatory-nav"
            items={snapshot.ui.sections.filter((section) => section.nav).map((section) => ({ id: section.id, label: section.label }))}
          />
          <Filters
            snapshot={snapshot}
            section={sectionFor(snapshot.ui, "people")}
            query={query}
            setQuery={setQuery}
            identityFilter={identityFilter}
            setIdentityFilter={setIdentityFilter}
            relationFilter={relationFilter}
            setRelationFilter={setRelationFilter}
            identityOptions={identityOptions}
            count={filteredPeople.length}
            hasFilters={hasFilters}
            onReset={resetFilters}
          />
          <section id="people" className="people-workbench">
            <PersonIndex
              snapshot={snapshot}
              canonicalPeople={canonicalFiltered}
              candidatePeople={candidateFiltered}
              selectedId={person.id}
              onSelect={selectPerson}
            />
            <PersonDossier
              snapshot={snapshot}
              person={person}
              claims={personClaims}
              relationships={personRelationships}
              candidate={candidateIds.has(person.id)}
              onShare={() => { void sharePerson() }}
              shareStatus={shareStatus}
            />
          </section>
          <TransmissionSection snapshot={snapshot} person={person} relationships={personRelationships} />
          <ClaimsEvidenceSection snapshot={snapshot} claims={personClaims} evidence={personEvidence} />
          <QualitySection
            snapshot={snapshot}
            person={person}
            claims={personClaims}
            evidence={personEvidence}
            relationships={personRelationships}
            selectedSourceIds={selectedSourceIds}
          />
          <SourcesSection snapshot={snapshot} selectedSourceIds={selectedSourceIds} />
          <UncertaintySection snapshot={snapshot} person={person} />
          <TaxonomySection snapshot={snapshot} />
          <ContractSection snapshot={snapshot} />
        </main>
        <Footer snapshot={snapshot} />
      </div>
    </MoonWitnessAssetProvider>
  )
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>)
