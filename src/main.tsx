import { StrictMode, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  Badge,
  Button,
  Citation,
  ConfidenceMeter,
  DossierHeader,
  EvidenceCard,
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

function queryPersonId(config: ObservatoryConfig) {
  return new URLSearchParams(window.location.search).get(config.routing.person_param) ?? ""
}

function updatePersonUrl(config: ObservatoryConfig, personId: string) {
  const url = new URL(window.location.href)
  url.searchParams.set(config.routing.person_param, personId)
  window.history.replaceState({}, "", url)
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
}) {
  const { filters } = snapshot.ui
  return (
    <section id="search" className="filter-panel" aria-label={section.label}>
      <div className="filter-heading">
        <div>
          <p className="rs-eyebrow">{section.index} / {section.eyebrow}</p>
          <h2>{section.headline}</h2>
        </div>
        <Badge variant="neutral">{count} {filters.matching_suffix}</Badge>
      </div>
      <div className="filter-grid">
        <Input
          label={filters.search_label}
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
}: {
  snapshot: SuperheroSnapshot
  person: PersonRecord
  claims: ClaimRecord[]
  relationships: RelationshipRecord[]
  candidate: boolean
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
          </>
        }
      />
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
    <article className="claim-block">
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

function SourcesSection({ snapshot }: { snapshot: SuperheroSnapshot }) {
  const section = sectionFor(snapshot.ui, "sources")
  return (
    <section id={section.id} className="research-section source-section">
      <SectionHeader section={section} />
      <div className="source-grid">
        {snapshot.sources.map((source) => {
          const href = externalHttpHref(source.locator)
          return (
            <article key={source.id} id={`source-${source.id}`} className="source-wrapper">
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
  const [selectedId, setSelectedId] = useState(queryPersonId(bootConfig))
  const [query, setQuery] = useState("")
  const [identityFilter, setIdentityFilter] = useState("all")
  const [relationFilter, setRelationFilter] = useState("all")

  useEffect(() => {
    let active = true
    loadSnapshot()
      .then((value) => {
        if (!active) return
        setSnapshot(value)
        const records = [...value.people, ...value.candidates]
        const requested = queryPersonId(value.ui)
        const valid = records.some((person) => person.id === requested)
        const initial = valid ? requested : records[0]?.id ?? ""
        setSelectedId(initial)
        if (initial) updatePersonUrl(value.ui, initial)
      })
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : String(cause)))
    return () => { active = false }
  }, [])

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
      <main className="boot-state" role={error ? "alert" : "status"}>
        <p className="rs-eyebrow">{error ? states.error_eyebrow : states.loading_eyebrow}</p>
        <h1>{error ? states.error_headline : states.loading_headline}</h1>
        <p>{error || states.loading_copy}</p>
      </main>
    )
  }

  const person = allPeople.find((item) => item.id === selectedId) ?? allPeople[0]
  if (!person) return <main className="boot-state">{snapshot.ui.states.no_people}</main>

  const personClaims = claimByPerson.get(person.id) ?? []
  const personRelationships = relationshipByPerson.get(person.id) ?? []
  const personEvidence = snapshot.evidence.filter((item) => personClaims.some((claim) => claim.id === item.claim_id))
  const canonicalFiltered = filteredPeople.filter((item) => !candidateIds.has(item.id))
  const candidateFiltered = filteredPeople.filter((item) => candidateIds.has(item.id))

  const selectPerson = (id: string) => {
    setSelectedId(id)
    updatePersonUrl(snapshot.ui, id)
    document.getElementById("people")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const navItems = snapshot.ui.sections.filter((section) => section.nav).map((section) => ({ label: section.label, href: `#${section.id}` }))

  return (
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <div className="superhero-app">
        <MWHeader
          variant="auto"
          brandLabel={snapshot.ui.header.brand_label}
          liveLabel={snapshot.ui.header.live_label}
          navItems={navItems}
          searchHref={snapshot.ui.header.search_href}
        />
        <main>
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
            />
          </section>
          <TransmissionSection snapshot={snapshot} person={person} relationships={personRelationships} />
          <ClaimsEvidenceSection snapshot={snapshot} claims={personClaims} evidence={personEvidence} />
          <SourcesSection snapshot={snapshot} />
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
