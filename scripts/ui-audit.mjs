import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const main = read("src/main.tsx")
const pkg = JSON.parse(read("package.json"))
const vercel = JSON.parse(read("vercel.json"))
const workflow = read(".github/workflows/validate.yml")
const snapshot = JSON.parse(read("public/data/superhero.snapshot.json"))
const config = JSON.parse(read("config/public-observatory.json"))
const failures = []

for (const required of [
  "MWHeader",
  "MoonWitnessPersonMark",
  "DossierHeader",
  "ProvenanceRail",
  "EvidenceCard",
  "SourceBlock",
  "Citation",
  "Input",
  "Select",
  "ObservatorySectionNav",
  "QualifiedReferenceView",
  "ConfidenceMeter",
  "RecordFieldGrid",
  "parseQualifiedReference",
  "semanticStatusVariant",
  "canonicalOwnerFor",
]) {
  if (!main.includes(required)) failures.push(`missing @rocksoul/ui contract usage: ${required}`)
}

for (const forbidden of [
  "function claimVariant",
  "function relationVariant",
  "function evidenceStatus",
  "function kindFromRef",
  'startsWith("legend:',
  'startsWith("mftl:',
  'startsWith("rgbl:',
  'startsWith("aws:',
  'startsWith("superhero:',
]) {
  if (main.includes(forbidden)) failures.push(`consumer hardcode remains: ${forbidden}`)
}

if (main.includes("api.github.com") || main.includes("raw.githubusercontent.com/bjo163/rocksoul-superhero")) {
  failures.push("runtime GitHub data dependency")
}
if (!main.includes("bootConfig.source.snapshot_path")) failures.push("contract-driven deployment snapshot consumption")
if (!main.includes("publicRecordCollections")) failures.push("automatic public record ledger")
if (!main.includes("snapshot.taxonomy.relations") || !main.includes("snapshot.taxonomy.proximity")) failures.push("taxonomy visualization")
if (!main.includes("Object.entries(snapshot.schemas)")) failures.push("schema visualization")
if (!main.includes("snapshot.candidates")) failures.push("candidate PERSON visualization")
if (!main.includes("URLSearchParams") || !main.includes("history.replaceState")) failures.push("person deep-link contract")
if (!main.includes("identityFilter") || !main.includes("relationFilter")) failures.push("search/filter contract")
if (pkg.scripts?.build !== "npm run build:data && npm run typecheck && vite build") failures.push("build gate")
if (vercel.buildCommand !== "npm run build") failures.push("Vercel must run canonical build")
if (!workflow.includes("npm run ci")) failures.push("frontend CI gate")

if (snapshot.people.length !== snapshot.counts.canonical_people) failures.push("snapshot people count mismatch")
if (snapshot.candidates.length !== snapshot.counts.candidates) failures.push("snapshot candidate count mismatch")
if (snapshot.claims.length !== snapshot.counts.claims) failures.push("snapshot claim count mismatch")
if (snapshot.evidence.length !== snapshot.counts.evidence_edges) failures.push("snapshot evidence count mismatch")
if (snapshot.relationships.length !== snapshot.counts.relationships) failures.push("snapshot relationship count mismatch")
if (snapshot.sources.length !== snapshot.counts.sources) failures.push("snapshot source count mismatch")
if (snapshot.taxonomy.relations.length !== snapshot.counts.relation_types) failures.push("snapshot relation taxonomy count mismatch")
if (Object.keys(snapshot.schemas ?? {}).length < 5) failures.push("complete schema registry")
if (JSON.stringify(snapshot.ui) !== JSON.stringify(config)) failures.push("snapshot presentation contract drift")

if (failures.length) {
  console.error("SUPERHERO UI audit failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("SUPERHERO UI audit passed: no local domain/status resolver hardcoding and complete public visualization contract.")
