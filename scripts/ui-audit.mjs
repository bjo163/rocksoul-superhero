import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const main = read("src/main.tsx")
const pkg = JSON.parse(read("package.json"))
const vercel = JSON.parse(read("vercel.json"))
const workflow = read(".github/workflows/validate.yml")
const snapshot = JSON.parse(read("public/data/superhero.snapshot.json"))
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
]) {
  if (!main.includes(required)) failures.push(`missing @rocksoul/ui usage: ${required}`)
}
if (main.includes("api.github.com") || main.includes("raw.githubusercontent.com/bjo163/rocksoul-superhero")) {
  failures.push("runtime GitHub data dependency")
}
if (!main.includes('fetch("/data/superhero.snapshot.json"')) failures.push("deployment snapshot consumption")
if (!main.includes("evidence") || !main.includes("sources")) failures.push("evidence/source surface")
if (!main.includes("URLSearchParams") || !main.includes("history.replaceState")) failures.push("person deep-link contract")
if (!main.includes("identityFilter") || !main.includes("relationFilter")) failures.push("search/filter contract")
if (pkg.scripts?.build !== "npm run build:data && npm run typecheck && vite build") failures.push("build gate")
if (vercel.buildCommand !== "npm run build") failures.push("Vercel must run canonical build")
if (!workflow.includes("npm run ci")) failures.push("frontend CI gate")
if (snapshot.people.length !== snapshot.counts.canonical_people) failures.push("snapshot people count mismatch")
if (snapshot.evidence.length !== snapshot.counts.evidence_edges) failures.push("snapshot evidence count mismatch")
if (snapshot.sources.length !== snapshot.counts.sources) failures.push("snapshot source count mismatch")

if (failures.length) {
  console.error("SUPERHERO UI audit failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("SUPERHERO UI audit passed.")
