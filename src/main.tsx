import { StrictMode, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  Badge,
  Button,
  Citation,
  DossierHeader,
  EvidenceCard,
  Input,
  MOONWITNESS_STABLE_REPOSITORY_BASE,
  MWHeader,
  MoonWitnessAssetProvider,
  MoonWitnessPersonMark,
  ProvenanceRail,
  Select,
  SourceBlock,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import "./styles.css"
import type {
  ClaimRecord,
  EvidenceRecord,
  PersonRecord,
  RelationshipRecord,
  SourceRecord,
  SuperheroSnapshot,
} from "./types"

const assetBase = `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness`

function titleCase(value = "") {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function claimVariant(status: string) {
  if (status.includes("strongly") || status.includes("supported")) return "supported" as const
  if (status.includes("probable") || status.includes("partial")) return "partial" as const
  if (status.includes("disputed") || status.includes("contradicted")) return "disputed" as const
  return "unresolved" as const
}

function relationVariant(status: string) {
  if (status === "supported") return "supported" as const
  if (status === "probable" || status === "plausible") return "partial" as const
  if (status === "disputed" || status === "rejected") return "disputed" as const
  return "unresolved" as const
}

function evidenceStatus(relation: string) {
  if (relation === "supports") return "supported" as const
  if (relation === "contradicts") return "disputed" as const
  if (relation === "contextualizes") return "partial" as const
  return "unresolved" as const
}

function kindFromRef(ref: string) {
  if (ref.startsWith("legend:EVT")) return "event" as const
  if (ref.startsWith("legend:PLC")) return "location" as const
  if (ref.startsWith("mftl:")) return "story" as const
  if (ref.startsWith("rgbl:")) return "text" as const
  if (ref.startsWith("aws:")) return "law" as const
  if (ref.includes(":SRC-")) return "source" as const
  if (ref.includes(":PER-")) return "person" as const
  return "source" as const
}

function labelFromRef(ref: string) {
  return ref.split(":").at(-1)?.replaceAll("-", " ") ?? ref
}

function localSourceId(ref: string) {
  return ref.startsWith("superhero:") ? ref.slice("superhero:".length) : null
}

function queryPersonId() {
  return new URLSearchParams(window.location.search).get("person") ?? ""
}

function updatePersonUrl(personId: string) {
  const url = new URL(window.location.href)
  url.searchParams.set("person", personId)
  window.history.replaceState({}, "", url)
}

async function loadSnapshot() {
  const response = await fetch("/data/superhero.snapshot.json", { cache: "no-cache" })
  if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`)
  return response.json() as Promise<SuperheroSnapshot>
}

function MetricStrip({ snapshot }: { snapshot: SuperheroSnapshot }) {
  const items = [
    ["Canonical people", snapshot.counts.canonical_people],
    ["Claims", snapshot.counts.claims],
    ["Evidence edges", snapshot.counts.evidence_edges],
    ["Sources", snapshot.counts.sources],
    ["Relationships", snapshot.counts.relationships],
  ]
  return (
    <div className="metric-strip" aria-label="SUPERHERO graph summary">
      {items.map(([label, value]) => (
        <div key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function Hero({ snapshot }: { snapshot: SuperheroSnapshot }) {
  return (
    <section id="top" className="superhero-hero">
      <div className="hero-grid">
        <div>
          <p className="rs-eyebrow">MOONWITNESS / ROCKSOUL RESEARCH / PERSON</p>
          <h1>TRACE THE PERSON.<br /><em>KEEP THE CHAIN.</em></h1>
          <p className="hero-copy">
            Actor & transmission intelligence for reconstructing identity, witnessing, authorship,
            recording, interpretation, and narrative chain of custody without turning attribution into verdict.
          </p>
          <div className="rule-strip">
            <span>IDENTITY ≠ ROLE</span>
            <span>WITNESS ≠ PERFECT WITNESS</span>
            <span>UNCERTAINTY IS DATA</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <img src={`${assetBase}/ui/v2/24-resources.svg`} alt="" />
        </div>
      </div>
      <MetricStrip snapshot={snapshot} />
      <div className="snapshot-bar">
        <span>DEPLOYMENT SNAPSHOT</span>
        <code>{snapshot.source.repository}@{snapshot.source.commit === "unresolved" ? snapshot.source.ref : snapshot.source.commit.slice(0, 12)}</code>
        <span>SCHEMA {snapshot.schema_version}</span>
      </div>
    </section>
  )
}

function Filters({
  query,
  setQuery,
  identityFilter,
  setIdentityFilter,
  relationFilter,
  setRelationFilter,
  identityOptions,
  relationOptions,
  count,
}: {
  query: string
  setQuery: (value: string) => void
  identityFilter: string
  setIdentityFilter: (value: string) => void
  relationFilter: string
  setRelationFilter: (value: string) => void
  identityOptions: string[]
  relationOptions: string[]
  count: number
}) {
  return (
    <section id="search" className="filter-panel" aria-label="Search and filter canonical people">
      <div className="filter-heading">
        <div>
          <p className="rs-eyebrow">01 / PEOPLE INDEX</p>
          <h2>FIND THE ACTOR. INSPECT THE ATTRIBUTION.</h2>
        </div>
        <Badge variant="neutral">{count} matching records</Badge>
      </div>
      <div className="filter-grid">
        <Input
          label="Search person / claim / source"
          variant="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Josephus, Guatavita, witness…"
        />
        <Select
          label="Identity status"
          value={identityFilter}
          onChange={(event) => setIdentityFilter(event.currentTarget.value)}
          options={[
            { label: "All identity states", value: "all" },
            ...identityOptions.map((value) => ({ label: titleCase(value), value })),
          ]}
        />
        <Select
          label="Actor relation"
          value={relationFilter}
          onChange={(event) => setRelationFilter(event.currentTarget.value)}
          options={[
            { label: "All relations", value: "all" },
            ...relationOptions.map((value) => ({ label: titleCase(value), value })),
          ]}
        />
      </div>
    </section>
  )
}

function PersonIndex({
  people,
  selectedId,
  onSelect,
}: {
  people: PersonRecord[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="person-index" aria-label="Canonical people">
      <div className="index-heading">
        <span>CANONICAL PEOPLE</span>
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
            <small>{titleCase(person.identity_status)} · {person.active_period.start ?? "unknown"}</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ))}
      {!people.length ? <p className="index-empty">No person matches the current filters.</p> : null}
      <div className="index-note">
        <p>SUPERHERO is a brand, not a verdict.</p>
        <span>People are modeled as source-relative actors, not ranked heroes or villains.</span>
      </div>
    </aside>
  )
}

function PersonDossier({
  person,
  claims,
  relationships,
}: {
  person: PersonRecord
  claims: ClaimRecord[]
  relationships: RelationshipRecord[]
}) {
  const activePeriod = [person.active_period.start, person.active_period.end].filter(Boolean).join(" → ") || "Unknown"
  const identityVariant = person.identity_status === "attested" ? "verified" : person.identity_status === "anonymous" ? "unresolved" : claimVariant(person.identity_status)

  return (
    <div className="dossier-stack">
      <DossierHeader
        eyebrow="PERSON / ACTOR DOSSIER"
        title={person.canonical_name}
        summary={person.review.note ?? undefined}
        recordId={person.id}
        status={{ label: titleCase(person.identity_status), variant: identityVariant }}
        metadata={[
          { label: "Review", value: person.review.status },
          { label: "Active period", value: activePeriod },
          { label: "Claims", value: String(claims.length) },
          { label: "Relations", value: String(relationships.length) },
        ]}
        actions={
          <>
            <Button onClick={() => document.getElementById("transmission")?.scrollIntoView({ behavior: "smooth" })}>Trace transmission</Button>
            <Button variant="secondary" onClick={() => document.getElementById("claims")?.scrollIntoView({ behavior: "smooth" })}>Inspect evidence</Button>
          </>
        }
      />
      <div className="identity-panel">
        <div className="identity-mark-card">
          <MoonWitnessPersonMark alt="" className="person-mark" />
          <div>
            <p className="rs-eyebrow">IDENTITY RECORD</p>
            <h3>{person.canonical_name}</h3>
            <span>{person.aliases?.length ? person.aliases.join(" · ") : "No aliases recorded"}</span>
          </div>
        </div>
        <dl className="identity-grid">
          <div><dt>Identity status</dt><dd>{titleCase(person.identity_status)}</dd></div>
          <div><dt>Birth / start</dt><dd>{person.lifespan.start ?? "Unresolved"}</dd></div>
          <div><dt>Death / end</dt><dd>{person.lifespan.end ?? "Unresolved"}</dd></div>
          <div><dt>Direct sources</dt><dd>{person.source_refs.length}</dd></div>
        </dl>
        {person.lifespan.note ? <p className="scope-note">{person.lifespan.note}</p> : null}
      </div>
    </div>
  )
}

function SourceRefList({ refs, sources }: { refs: string[]; sources: Map<string, SourceRecord> }) {
  return (
    <div className="ref-list">
      {refs.map((ref) => {
        const id = localSourceId(ref)
        const local = id ? sources.get(id) : undefined
        return local ? (
          <a key={ref} href={`#source-${id}`}><code>{ref}</code></a>
        ) : <code key={ref}>{ref}</code>
      })}
    </div>
  )
}

function TransmissionSection({
  person,
  relationships,
  sourceMap,
}: {
  person: PersonRecord
  relationships: RelationshipRecord[]
  sourceMap: Map<string, SourceRecord>
}) {
  const nodes = [
    { id: person.id, kind: "person" as const, label: person.canonical_name, detail: titleCase(person.identity_status), active: true },
    ...relationships.slice(0, 5).map((relationship) => ({
      id: relationship.id,
      kind: kindFromRef(relationship.object_ref),
      label: labelFromRef(relationship.object_ref),
      detail: titleCase(relationship.relation),
      external: !relationship.object_ref.startsWith("superhero:"),
      unresolved: relationship.status !== "supported",
    })),
  ]

  return (
    <section id="transmission" className="research-section">
      <header className="section-header">
        <div>
          <p className="rs-eyebrow">02 / TRANSMISSION</p>
          <h2>FOLLOW THE HUMAN CHAIN.</h2>
        </div>
        <p>Every actor relationship exposes role, temporal proximity, confidence, supporting sources, and its own uncertainty register.</p>
      </header>
      <ProvenanceRail nodes={nodes} description={nodes.map((node) => `${node.kind.toUpperCase()}: ${node.label}`).join(" → ")} />
      <div className="relationship-grid">
        {relationships.map((relationship) => (
          <article key={relationship.id} className="relationship-card">
            <div className="relationship-head">
              <Badge variant={relationVariant(relationship.status)}>{relationship.status}</Badge>
              <span>{Math.round(relationship.confidence * 100)}% confidence</span>
            </div>
            <p className="relationship-type">{titleCase(relationship.relation)}</p>
            <dl>
              <div><dt>Proximity</dt><dd>{titleCase(relationship.proximity)}</dd></div>
              <div><dt>Target</dt><dd><code>{relationship.object_ref}</code></dd></div>
            </dl>
            <SourceRefList refs={relationship.source_refs} sources={sourceMap} />
            {relationship.uncertainty.length ? (
              <div className="relation-uncertainty">
                <strong>Known uncertainty</strong>
                {relationship.uncertainty.map((item) => <p key={item}>{item}</p>)}
              </div>
            ) : null}
            {relationship.note ? <p className="relation-note">{relationship.note}</p> : null}
          </article>
        ))}
        {!relationships.length ? <div className="empty-state">No direct actor relationships recorded yet.</div> : null}
      </div>
    </section>
  )
}

function EvidenceForClaim({
  claim,
  evidence,
  sourceMap,
}: {
  claim: ClaimRecord
  evidence: EvidenceRecord[]
  sourceMap: Map<string, SourceRecord>
}) {
  return (
    <article className="claim-block">
      <div className="claim-heading">
        <div>
          <p className="rs-eyebrow">{titleCase(claim.claim_type)}</p>
          <h3>{claim.statement}</h3>
        </div>
        <Badge variant={claimVariant(claim.epistemic_status)}>{titleCase(claim.epistemic_status)}</Badge>
      </div>
      <p className="claim-id">{claim.id}</p>
      <SourceRefList refs={claim.source_refs} sources={sourceMap} />
      <div className="evidence-grid">
        {evidence.map((item) => (
          <div key={item.id} className="evidence-item">
            <EvidenceCard
              domain="PERSON"
              recordId={item.id}
              repo="rocksoul-superhero"
              claim={item.summary}
              provenance={item.source_refs.join(" · ")}
              verification={`${titleCase(item.evidence_type)} · ${Math.round(item.confidence * 100)}%`}
              status={evidenceStatus(item.relation)}
              canonical
              flagged={item.relation !== "supports"}
              sourceHref={localSourceId(item.source_refs[0] ?? "") ? `#source-${localSourceId(item.source_refs[0] ?? "")}` : undefined}
            />
            {item.limitations.length ? (
              <div className="evidence-limitations">
                <strong>Limitations</strong>
                {item.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
              </div>
            ) : null}
          </div>
        ))}
        {!evidence.length ? <div className="empty-state">No evidence edge recorded for this claim.</div> : null}
      </div>
    </article>
  )
}

function ClaimsEvidenceSection({
  claims,
  evidence,
  sourceMap,
}: {
  claims: ClaimRecord[]
  evidence: EvidenceRecord[]
  sourceMap: Map<string, SourceRecord>
}) {
  return (
    <section id="claims" className="research-section">
      <header className="section-header">
        <div>
          <p className="rs-eyebrow">03 / CLAIMS + EVIDENCE</p>
          <h2>ATTRIBUTION NEEDS SUPPORT.</h2>
        </div>
        <p>Claims and evidence remain separate records. Confidence, limitations, source refs, and documentary status stay visible at the point of inspection.</p>
      </header>
      <div className="claim-stack">
        {claims.map((claim) => (
          <EvidenceForClaim
            key={claim.id}
            claim={claim}
            evidence={evidence.filter((item) => item.claim_id === claim.id)}
            sourceMap={sourceMap}
          />
        ))}
        {!claims.length ? <div className="empty-state">No atomic claims recorded for this person.</div> : null}
      </div>
    </section>
  )
}

function SourcesSection({ sources }: { sources: SourceRecord[] }) {
  return (
    <section id="sources" className="research-section source-section">
      <header className="section-header">
        <div>
          <p className="rs-eyebrow">04 / SOURCE TRAIL</p>
          <h2>OPEN THE RECORD.</h2>
        </div>
        <p>Local source records expose creator, date, locator, provenance, quality, and citation context. External domain refs remain visibly external.</p>
      </header>
      <div className="source-grid">
        {sources.map((source) => (
          <article key={source.id} id={`source-${source.id}`} className="source-wrapper">
            <SourceBlock
              sourceId={source.id}
              title={source.title}
              excerpt={source.provenance}
              citation={source.id}
              provenance={source.locator ?? "No locator recorded"}
              verification={source.quality ?? source.source_type}
            />
            <dl className="source-meta">
              <div><dt>Type</dt><dd>{titleCase(source.source_type)}</dd></div>
              <div><dt>Creator</dt><dd>{source.creator ?? "Not recorded"}</dd></div>
              <div><dt>Date</dt><dd>{source.date ?? "Not recorded"}</dd></div>
              <div><dt>Language</dt><dd>{source.language ?? "Not recorded"}</dd></div>
            </dl>
            <div className="source-actions">
              <Citation code={source.id} source={source.title} locator={source.locator ?? "No locator recorded"} variant="block" />
              {source.locator?.startsWith("http") ? (
                <a className="source-open" href={source.locator} target="_blank" rel="noreferrer">OPEN PRIMARY LOCATOR ↗</a>
              ) : null}
            </div>
            {source.notes.length ? (
              <div className="source-notes">
                {source.notes.map((note) => <p key={note}>{note}</p>)}
              </div>
            ) : null}
          </article>
        ))}
        {!sources.length ? <div className="empty-state">No local source records resolve for this person.</div> : null}
      </div>
    </section>
  )
}

function UncertaintySection({ person }: { person: PersonRecord }) {
  return (
    <section id="uncertainty" className="uncertainty-section">
      <div>
        <p className="rs-eyebrow">05 / UNCERTAINTY REGISTER</p>
        <h2>GAPS ARE DATA.</h2>
        <p className="uncertainty-copy">A person can be strongly attested in one dimension and unresolved in another. The interface must preserve that separation.</p>
      </div>
      <div className="uncertainty-list">
        {person.uncertainty.map((item, index) => (
          <article key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Footer({ snapshot }: { snapshot: SuperheroSnapshot }) {
  return (
    <footer className="superhero-footer">
      <img src={`${assetBase}/brand/rocksoul-lockup.svg`} alt="Rocksoul" />
      <p>PEOPLE LEAVE TRACES. TRACE THE CHAIN.</p>
      <span>{snapshot.source.repository}@{snapshot.source.commit.slice(0, 12)}</span>
    </footer>
  )
}

function App() {
  const [snapshot, setSnapshot] = useState<SuperheroSnapshot | null>(null)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState(queryPersonId())
  const [query, setQuery] = useState("")
  const [identityFilter, setIdentityFilter] = useState("all")
  const [relationFilter, setRelationFilter] = useState("all")

  useEffect(() => {
    let active = true
    loadSnapshot()
      .then((value) => {
        if (!active) return
        setSnapshot(value)
        const requested = queryPersonId()
        const valid = value.people.some((person) => person.id === requested)
        const initial = valid ? requested : value.people[0]?.id ?? ""
        setSelectedId(initial)
        if (initial) updatePersonUrl(initial)
      })
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : String(cause)))
    return () => { active = false }
  }, [])

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
  const identityOptions = useMemo(() => [...new Set((snapshot?.people ?? []).map((person) => person.identity_status))].sort(), [snapshot])
  const relationOptions = useMemo(() => [...new Set((snapshot?.relationships ?? []).map((relationship) => relationship.relation))].sort(), [snapshot])

  const filteredPeople = useMemo(() => {
    if (!snapshot) return []
    const needle = query.trim().toLowerCase()
    return snapshot.people.filter((person) => {
      if (identityFilter !== "all" && person.identity_status !== identityFilter) return false
      const personRelations = relationshipByPerson.get(person.id) ?? []
      if (relationFilter !== "all" && !personRelations.some((item) => item.relation === relationFilter)) return false
      if (!needle) return true
      const personClaims = claimByPerson.get(person.id) ?? []
      const refIds = new Set([
        ...person.source_refs,
        ...personClaims.flatMap((claim) => claim.source_refs),
        ...personRelations.flatMap((relationship) => relationship.source_refs),
      ].map((ref) => localSourceId(ref)).filter(Boolean))
      const sourceTitles = [...refIds].map((id) => id ? sourceMap.get(id)?.title ?? "" : "")
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
  }, [snapshot, query, identityFilter, relationFilter, relationshipByPerson, claimByPerson, sourceMap])

  if (!snapshot) {
    return (
      <main className="boot-state" role={error ? "alert" : "status"}>
        <p className="rs-eyebrow">{error ? "DATA LOAD ERROR" : "SUPERHERO / PERSON INTELLIGENCE"}</p>
        <h1>{error ? "THE CHAIN COULD NOT BE LOADED." : "LOADING THE HUMAN CHAIN."}</h1>
        <p>{error || "Opening the deployment-pinned canonical snapshot."}</p>
      </main>
    )
  }

  const person = snapshot.people.find((item) => item.id === selectedId) ?? snapshot.people[0]
  if (!person) return <main className="boot-state">No canonical person records.</main>

  const personClaims = claimByPerson.get(person.id) ?? []
  const personRelationships = relationshipByPerson.get(person.id) ?? []
  const personEvidence = snapshot.evidence.filter((item) => personClaims.some((claim) => claim.id === item.claim_id))
  const sourceRefs = new Set([
    ...person.source_refs,
    ...personClaims.flatMap((claim) => claim.source_refs),
    ...personEvidence.flatMap((item) => item.source_refs),
    ...personRelationships.flatMap((relationship) => relationship.source_refs),
  ])
  const personSources = [...sourceRefs]
    .map((ref) => localSourceId(ref))
    .filter((id): id is string => Boolean(id))
    .map((id) => sourceMap.get(id))
    .filter((source): source is SourceRecord => Boolean(source))

  const selectPerson = (id: string) => {
    setSelectedId(id)
    updatePersonUrl(id)
    document.getElementById("people")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <div className="superhero-app">
        <MWHeader
          variant="auto"
          brandLabel="SUPERHERO / PERSON INTELLIGENCE"
          liveLabel="Canonical snapshot"
          navItems={[
            { label: "People", href: "#people" },
            { label: "Transmission", href: "#transmission" },
            { label: "Evidence", href: "#claims" },
            { label: "Sources", href: "#sources" },
            { label: "Uncertainty", href: "#uncertainty" },
          ]}
          searchHref="#search"
        />
        <main>
          <Hero snapshot={snapshot} />
          <Filters
            query={query}
            setQuery={setQuery}
            identityFilter={identityFilter}
            setIdentityFilter={setIdentityFilter}
            relationFilter={relationFilter}
            setRelationFilter={setRelationFilter}
            identityOptions={identityOptions}
            relationOptions={relationOptions}
            count={filteredPeople.length}
          />
          <section id="people" className="people-workbench">
            <PersonIndex people={filteredPeople} selectedId={person.id} onSelect={selectPerson} />
            <PersonDossier person={person} claims={personClaims} relationships={personRelationships} />
          </section>
          <TransmissionSection person={person} relationships={personRelationships} sourceMap={sourceMap} />
          <ClaimsEvidenceSection claims={personClaims} evidence={personEvidence} sourceMap={sourceMap} />
          <SourcesSection sources={personSources} />
          <UncertaintySection person={person} />
        </main>
        <Footer snapshot={snapshot} />
      </div>
    </MoonWitnessAssetProvider>
  )
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>)
