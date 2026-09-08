import { StrictMode, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  Badge,
  Button,
  DossierHeader,
  MoonWitnessAssetProvider,
  MoonWitnessPersonaAvatar,
  MOONWITNESS_STABLE_REPOSITORY_BASE,
  ProvenanceRail,
  ThemeToggle,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import "./styles.css"
import repoIndex from "../data/index.json"

const peopleModules = import.meta.glob("../data/people/*.json", { eager: true, import: "default" })
const claimModules = import.meta.glob("../data/claims/*.json", { eager: true, import: "default" })
const relationshipModules = import.meta.glob("../data/relationships/*.json", { eager: true, import: "default" })

const people = Object.values(peopleModules).sort((a, b) => a.canonical_name.localeCompare(b.canonical_name))
const claims = Object.values(claimModules)
const relationships = Object.values(relationshipModules)

const assetBase = `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness`

function titleCase(value = "") {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function claimVariant(status = "") {
  if (status.includes("strongly") || status.includes("supported")) return "supported"
  if (status.includes("probable") || status.includes("partial")) return "partial"
  if (status.includes("disputed") || status.includes("contested")) return "disputed"
  return "unresolved"
}

function relationVariant(status = "") {
  if (status === "supported" || status === "canonical") return "supported"
  if (status === "partial" || status === "probable") return "partial"
  return "unresolved"
}

function kindFromRef(ref = "") {
  if (ref.startsWith("legend:EVT")) return "event"
  if (ref.startsWith("legend:")) return "location"
  if (ref.startsWith("mftl:")) return "story"
  if (ref.startsWith("rgbl:")) return "text"
  if (ref.startsWith("aws:")) return "law"
  if (ref.includes(":SRC-")) return "source"
  if (ref.includes(":PER-")) return "person"
  return "source"
}

function labelFromRef(ref = "") {
  return ref.split(":").at(-1)?.replaceAll("-", " ") ?? ref
}

function AppHeader() {
  return (
    <header className="superhero-header">
      <a className="brand-lockup" href="#top" aria-label="MoonWitness SUPERHERO home">
        <img src={`${assetBase}/brand/logo-horizontal.svg`} alt="MoonWitness" />
        <span>SUPERHERO</span>
      </a>
      <nav aria-label="SUPERHERO sections">
        <a href="#people">People</a>
        <a href="#transmission">Transmission</a>
        <a href="#claims">Claims</a>
        <a href="#uncertainty">Uncertainty</a>
      </nav>
      <div className="header-tools">
        <span className="live-signal"><i /> PERSON INTELLIGENCE</span>
        <ThemeToggle />
      </div>
    </header>
  )
}

function SystemIntro() {
  const counts = repoIndex.counts
  const stats = [
    ["Canonical people", counts.canonical_people],
    ["Claims", counts.claims],
    ["Evidence edges", counts.evidence_edges],
    ["Relationships", counts.relationships],
    ["Relation types", counts.relation_types],
  ]

  return (
    <section id="top" className="system-intro">
      <div className="intro-copy">
        <p className="eyebrow">MOONWITNESS / ROCKSOUL RESEARCH / PERSON</p>
        <h1>TRACE THE PERSON.<br /><em>KEEP THE CHAIN.</em></h1>
        <p className="lede">
          Actor & transmission intelligence for reconstructing identity, witnessing, authorship,
          recording, interpretation, and narrative chain of custody without turning attribution into verdict.
        </p>
        <div className="rule-strip" aria-label="Research rules">
          <span>IDENTITY ≠ ROLE</span>
          <span>WITNESS ≠ PERFECT WITNESS</span>
          <span>UNCERTAINTY IS DATA</span>
        </div>
      </div>
      <div className="intro-visual" aria-hidden="true">
        <img src={`${assetBase}/ui/v2/24-resources.svg`} alt="" />
      </div>
      <div className="stats-grid">
        {stats.map(([label, value]) => (
          <div key={label}>
            <strong>{String(value).padStart(2, "0")}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function PersonIndex({ selectedId, onSelect }) {
  return (
    <aside className="person-index" aria-label="Canonical people">
      <div className="index-heading">
        <span>CANONICAL PEOPLE</span>
        <strong>{String(people.length).padStart(2, "0")}</strong>
      </div>
      {people.map((person, index) => {
        const active = selectedId === person.id
        return (
          <button key={person.id} className={active ? "active" : ""} onClick={() => onSelect(person.id)}>
            <span className="record-no">{String(index + 1).padStart(2, "0")}</span>
            <span className="person-label">
              <strong>{person.canonical_name}</strong>
              <small>{titleCase(person.identity_status)} · {person.active_period?.start ?? "unknown"}</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        )
      })}
      <div className="index-note">
        <p>SUPERHERO is a brand, not a verdict.</p>
        <span>People are modeled as source-relative actors, not ranked heroes or villains.</span>
      </div>
    </aside>
  )
}

function PersonDossier({ person, personClaims, personRelations }) {
  const activePeriod = [person.active_period?.start, person.active_period?.end].filter(Boolean).join(" → ") || "Unknown"
  const identityVariant = person.identity_status === "attested" ? "verified" : "unresolved"

  return (
    <div className="dossier-stack">
      <DossierHeader
        eyebrow="PERSON / ACTOR DOSSIER"
        title={person.canonical_name}
        summary={person.review?.note}
        recordId={person.id}
        status={{ label: titleCase(person.identity_status), variant: identityVariant }}
        metadata={[
          { label: "Review", value: person.review?.status ?? "unknown" },
          { label: "Active period", value: activePeriod },
          { label: "Claims", value: String(personClaims.length) },
          { label: "Relations", value: String(personRelations.length) },
        ]}
        actions={
          <>
            <Button onClick={() => document.getElementById("transmission")?.scrollIntoView({ behavior: "smooth" })}>Trace transmission</Button>
            <Button variant="secondary" onClick={() => document.getElementById("uncertainty")?.scrollIntoView({ behavior: "smooth" })}>Inspect uncertainty</Button>
          </>
        }
      />

      <div className="identity-panel">
        <div className="persona-card">
          <MoonWitnessPersonaAvatar
            persona={person.identity_status === "anonymous" ? "anonymous-source" : "researcher"}
            alt=""
            className="persona-avatar"
          />
          <div>
            <p className="eyebrow">IDENTITY RECORD</p>
            <h3>{person.canonical_name}</h3>
            <span>{person.aliases?.length ? person.aliases.join(" · ") : "No aliases recorded"}</span>
          </div>
        </div>
        <dl className="identity-grid">
          <div><dt>Identity status</dt><dd>{titleCase(person.identity_status)}</dd></div>
          <div><dt>Birth / start</dt><dd>{person.lifespan?.start ?? "Unresolved"}</dd></div>
          <div><dt>Death / end</dt><dd>{person.lifespan?.end ?? "Unresolved"}</dd></div>
          <div><dt>Sources</dt><dd>{person.source_refs?.length ?? 0}</dd></div>
        </dl>
        {person.lifespan?.note ? <p className="scope-note">{person.lifespan.note}</p> : null}
      </div>
    </div>
  )
}

function TransmissionSection({ person, personRelations }) {
  const nodes = [
    {
      id: person.id,
      kind: "person",
      label: person.canonical_name,
      detail: titleCase(person.identity_status),
      active: true,
    },
    ...personRelations.slice(0, 4).map((relation) => ({
      id: relation.id,
      kind: kindFromRef(relation.object_ref),
      label: labelFromRef(relation.object_ref),
      detail: titleCase(relation.relation),
      external: !relation.object_ref?.startsWith("superhero:"),
      unresolved: relation.status && relation.status !== "supported",
    })),
  ]

  return (
    <section id="transmission" className="research-section">
      <header className="section-header">
        <div>
          <p className="eyebrow">02 / TRANSMISSION</p>
          <h2>FOLLOW THE HUMAN CHAIN.</h2>
        </div>
        <p>Relationships stay explicit about role, proximity, and repository ownership. A recorded version is not automatically an origin.</p>
      </header>

      <ProvenanceRail
        nodes={nodes}
        description={nodes.map((node) => `${node.kind.toUpperCase()}: ${node.label}`).join(" → ")}
      />

      <div className="relation-grid">
        {personRelations.length ? personRelations.map((relation) => (
          <article key={relation.id} className="relation-card">
            <div className="relation-topline">
              <Badge variant={relationVariant(relation.status)}>{relation.status ?? "linked"}</Badge>
              <span>{titleCase(relation.proximity ?? "proximity not recorded")}</span>
            </div>
            <p className="relation-type">{titleCase(relation.relation)}</p>
            <code>{relation.object_ref}</code>
            <div className="route-line">
              <span>{person.id}</span>
              <b aria-hidden="true">→</b>
              <span>{relation.object_ref}</span>
            </div>
          </article>
        )) : (
          <div className="empty-state">No direct SUPERHERO relationships are recorded for this person yet.</div>
        )}
      </div>
    </section>
  )
}

function ClaimsSection({ personClaims }) {
  return (
    <section id="claims" className="research-section claims-section">
      <header className="section-header">
        <div>
          <p className="eyebrow">03 / CLAIMS + EVIDENCE</p>
          <h2>ATTRIBUTION NEEDS SUPPORT.</h2>
        </div>
        <p>Atomic claims preserve epistemic state and source references. Documentary attestation is shown as attestation, not promoted into certainty.</p>
      </header>
      <div className="claim-list">
        {personClaims.length ? personClaims.map((claim, index) => (
          <article key={claim.id} className="claim-row">
            <span className="claim-no">{String(index + 1).padStart(2, "0")}</span>
            <div className="claim-body">
              <div className="claim-meta">
                <span>{titleCase(claim.claim_type)}</span>
                <Badge variant={claimVariant(claim.epistemic_status)}>{titleCase(claim.epistemic_status)}</Badge>
              </div>
              <h3>{claim.statement}</h3>
              <div className="source-chips">
                {(claim.source_refs ?? []).map((ref) => <code key={ref}>{ref}</code>)}
              </div>
            </div>
            <span className="claim-id">{claim.id}</span>
          </article>
        )) : <div className="empty-state">No atomic claims are recorded for this canonical person yet.</div>}
      </div>
    </section>
  )
}

function UncertaintySection({ person }) {
  return (
    <section id="uncertainty" className="uncertainty-section">
      <div className="uncertainty-title">
        <p className="eyebrow">04 / UNCERTAINTY REGISTER</p>
        <h2>GAPS ARE DATA.</h2>
        <p>Witness proximity, historical identity, authorship, and transmission can be strong in one dimension and unresolved in another.</p>
      </div>
      <div className="uncertainty-list">
        {(person.uncertainty ?? []).map((item, index) => (
          <article key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="superhero-footer">
      <img src={`${assetBase}/brand/rocksoul-lockup.svg`} alt="Rocksoul" />
      <p>PEOPLE LEAVE TRACES. TRACE THE CHAIN.</p>
      <span>SUPERHERO / MoonWitness · Rocksoul Research</span>
    </footer>
  )
}

function App() {
  const [selectedId, setSelectedId] = useState(people[0]?.id)
  const person = people.find((item) => item.id === selectedId) ?? people[0]

  const personClaims = useMemo(
    () => claims.filter((claim) => claim.subject_id === person?.id),
    [person?.id],
  )
  const personRelations = useMemo(
    () => relationships.filter((relation) => relation.subject_id === person?.id),
    [person?.id],
  )

  if (!person) return <main className="empty-state">No canonical people found.</main>

  return (
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <div className="superhero-app">
        <AppHeader />
        <main>
          <SystemIntro />
          <section id="people" className="people-workbench">
            <PersonIndex selectedId={person.id} onSelect={setSelectedId} />
            <PersonDossier person={person} personClaims={personClaims} personRelations={personRelations} />
          </section>
          <TransmissionSection person={person} personRelations={personRelations} />
          <ClaimsSection personClaims={personClaims} />
          <UncertaintySection person={person} />
        </main>
        <Footer />
      </div>
    </MoonWitnessAssetProvider>
  )
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>)
