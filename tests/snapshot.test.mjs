import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const snapshot = JSON.parse(fs.readFileSync("public/data/superhero.snapshot.json", "utf8"))

function localId(ref) {
  return ref.startsWith("superhero:") ? ref.slice("superhero:".length) : null
}

test("snapshot counts match canonical index", () => {
  assert.equal(snapshot.people.length, snapshot.counts.canonical_people)
  assert.equal(snapshot.claims.length, snapshot.counts.claims)
  assert.equal(snapshot.evidence.length, snapshot.counts.evidence_edges)
  assert.equal(snapshot.relationships.length, snapshot.counts.relationships)
  assert.equal(snapshot.sources.length, snapshot.counts.sources)
})

test("deployment snapshot is content-addressed", () => {
  assert.match(snapshot.source.dataset_sha256, /^[a-f0-9]{64}$/)
})

test("every person claim and relationship ref resolves locally", () => {
  const claims = new Set(snapshot.claims.map((item) => item.id))
  const relationships = new Set(snapshot.relationships.map((item) => item.id))
  for (const person of snapshot.people) {
    for (const ref of person.claim_refs) assert.ok(claims.has(ref), `${person.id} missing claim ${ref}`)
    for (const ref of person.relationship_refs) assert.ok(relationships.has(ref), `${person.id} missing relationship ${ref}`)
  }
})

test("every evidence edge resolves to a claim", () => {
  const claims = new Set(snapshot.claims.map((item) => item.id))
  for (const evidence of snapshot.evidence) assert.ok(claims.has(evidence.claim_id), `${evidence.id} missing claim ${evidence.claim_id}`)
})

test("every local source reference resolves", () => {
  const sources = new Set(snapshot.sources.map((item) => item.id))
  const refs = [
    ...snapshot.people.flatMap((item) => item.source_refs),
    ...snapshot.claims.flatMap((item) => item.source_refs),
    ...snapshot.evidence.flatMap((item) => item.source_refs),
    ...snapshot.relationships.flatMap((item) => item.source_refs),
  ]
  for (const ref of refs) {
    const id = localId(ref)
    if (id) assert.ok(sources.has(id), `missing local source ${ref}`)
  }
})
