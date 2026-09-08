import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { parseQualifiedReference } from "@rocksoul/ui"

const snapshot = JSON.parse(fs.readFileSync("public/data/superhero.snapshot.json", "utf8"))
const config = JSON.parse(fs.readFileSync("config/public-observatory.json", "utf8"))

function localSourceId(ref) {
  const parsed = parseQualifiedReference(ref)
  return parsed?.domain === "PERSON" && parsed.kind === "source" ? parsed.id : null
}

test("snapshot counts match canonical index", () => {
  assert.equal(snapshot.people.length, snapshot.counts.canonical_people)
  assert.equal(snapshot.candidates.length, snapshot.counts.candidates)
  assert.equal(snapshot.claims.length, snapshot.counts.claims)
  assert.equal(snapshot.evidence.length, snapshot.counts.evidence_edges)
  assert.equal(snapshot.relationships.length, snapshot.counts.relationships)
  assert.equal(snapshot.sources.length, snapshot.counts.sources)
  assert.equal(snapshot.taxonomy.relations.length, snapshot.counts.relation_types)
})

test("deployment snapshot is content-addressed and embeds the presentation contract", () => {
  assert.match(snapshot.source.dataset_sha256, /^[a-f0-9]{64}$/)
  assert.deepEqual(snapshot.ui, config)
  assert.equal(snapshot.source.repository, config.source.repository)
  assert.equal(snapshot.source.ref, config.source.ref)
})

test("every public record schema and taxonomy is present", () => {
  assert.deepEqual(Object.keys(snapshot.schemas).sort(), ["claim", "evidence", "person", "relationship", "source"])
  assert.ok(snapshot.taxonomy.relations.length > 0)
  assert.ok(snapshot.taxonomy.proximity.length > 0)
})

test("every person claim and relationship ref resolves locally", () => {
  const claims = new Set(snapshot.claims.map((item) => item.id))
  const relationships = new Set(snapshot.relationships.map((item) => item.id))
  for (const person of [...snapshot.people, ...snapshot.candidates]) {
    for (const ref of person.claim_refs) assert.ok(claims.has(ref), `${person.id} missing claim ${ref}`)
    for (const ref of person.relationship_refs) assert.ok(relationships.has(ref), `${person.id} missing relationship ${ref}`)
  }
})

test("every evidence edge resolves to a claim", () => {
  const claims = new Set(snapshot.claims.map((item) => item.id))
  for (const evidence of snapshot.evidence) assert.ok(claims.has(evidence.claim_id), `${evidence.id} missing claim ${evidence.claim_id}`)
})

test("every local source reference resolves through the shared domain resolver", () => {
  const sources = new Set(snapshot.sources.map((item) => item.id))
  const refs = [
    ...[...snapshot.people, ...snapshot.candidates].flatMap((item) => item.source_refs),
    ...snapshot.claims.flatMap((item) => item.source_refs),
    ...snapshot.evidence.flatMap((item) => item.source_refs),
    ...snapshot.relationships.flatMap((item) => item.source_refs),
  ]
  for (const ref of refs) {
    const id = localSourceId(ref)
    if (id) assert.ok(sources.has(id), `missing local source ${ref}`)
  }
})


test("observatory section order and routing parameters are deterministic", () => {
  const sectionIds = snapshot.ui.sections.map((section) => section.id)
  assert.equal(new Set(sectionIds).size, sectionIds.length)
  assert.deepEqual(
    snapshot.ui.sections.map((section) => section.index),
    snapshot.ui.sections.map((_, index) => String(index + 1).padStart(2, "0")),
  )
  assert.ok(sectionIds.includes("quality"))
  const params = Object.values(snapshot.ui.routing)
  assert.equal(new Set(params).size, params.length)
})

test("quality matrix mapping is schema-backed and intentionally leaves unresolved uncertainty outside stance columns", () => {
  const evidenceRelations = snapshot.schemas.evidence.properties.relation.enum
  const mapped = Object.keys(snapshot.ui.quality.matrix_relation_map)
  for (const relation of mapped) assert.ok(evidenceRelations.includes(relation), `matrix relation missing from schema: ${relation}`)
  assert.deepEqual(
    evidenceRelations.filter((relation) => !mapped.includes(relation)),
    ["unresolved_uncertainty"],
  )
})

test("every current evidence edge is visualizable in the stance matrix", () => {
  for (const edge of snapshot.evidence) {
    assert.ok(snapshot.ui.quality.matrix_relation_map[edge.relation], `${edge.id} has no matrix stance`)
  }
})
