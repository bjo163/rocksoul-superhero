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
  "EvidenceMatrix",
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
if (!main.includes("value.candidates") || !main.includes("candidatePeople") || !main.includes("candidateIds")) failures.push("candidate PERSON visualization")
if (!main.includes("URLSearchParams") || !main.includes("history.replaceState") || !main.includes("history[mode === \"push\" ? \"pushState\" : \"replaceState\"]")) failures.push("shareable URL-state contract")
if (!main.includes("identityFilter") || !main.includes("relationFilter") || !main.includes('id="superhero-search"')) failures.push("search/filter contract")
if (!main.includes("QualitySection") || !main.includes("selectedSourceIds") || !main.includes("matrix_relation_map")) failures.push("research quality coverage contract")
if (!main.includes("navigator.share") || !main.includes("fallbackCopy")) failures.push("dossier share contract")
if (!main.includes("skip-link") || !main.includes('id="main-content"')) failures.push("skip navigation contract")
if (!main.includes('event.key === "/"') || !main.includes('event.key === "Escape"')) failures.push("keyboard navigation contract")
if (pkg.scripts?.build !== "npm run build:data && npm run typecheck && vite build") failures.push("build gate")
if (vercel.buildCommand !== "npm run build") failures.push("Vercel must run canonical build")
const allHeaders = (vercel.headers ?? []).flatMap((rule) => rule.headers ?? [])
const headerMap = new Map(allHeaders.map((header) => [header.key.toLowerCase(), header.value]))
if (!headerMap.get("content-security-policy")?.includes("frame-ancestors 'none'")) failures.push("production CSP")
if (headerMap.get("x-content-type-options") !== "nosniff") failures.push("nosniff header")
if (headerMap.get("x-frame-options") !== "DENY") failures.push("frame denial header")
if (!headerMap.has("permissions-policy")) failures.push("permissions policy header")
if (!(vercel.headers ?? []).some((rule) => rule.source === "/assets/(.*)" && rule.headers?.some((header) => header.value.includes("immutable")))) failures.push("immutable asset cache")
if (!(vercel.headers ?? []).some((rule) => rule.source === "/data/superhero.snapshot.json" && rule.headers?.some((header) => header.value.includes("must-revalidate")))) failures.push("snapshot revalidation cache")
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
if (!config.sections.some((section) => section.id === "quality")) failures.push("quality section presentation contract")
const routeParams = Object.values(config.routing)
if (new Set(routeParams).size !== routeParams.length) failures.push("routing parameter collision")
if (!config.quality?.matrix_relation_map || !Object.keys(config.quality.matrix_relation_map).length) failures.push("evidence matrix relation map")

if (failures.length) {
  console.error("SUPERHERO UI audit failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("SUPERHERO UI audit passed: no local domain/status resolver hardcoding and complete public visualization contract.")
