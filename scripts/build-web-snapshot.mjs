import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"

const root = process.cwd()

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"))
}

function readJsonDirectory(relativePath) {
  const directory = path.join(root, relativePath)
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(relativePath, name)))
}

const index = readJson("data/index.json")
const records = {
  people: readJsonDirectory("data/people"),
  claims: readJsonDirectory("data/claims"),
  evidence: readJsonDirectory("data/evidence"),
  relationships: readJsonDirectory("data/relationships"),
  sources: readJsonDirectory("data/sources"),
}
const datasetSha256 = createHash("sha256").update(JSON.stringify(records)).digest("hex")
const snapshot = {
  schema_version: index.schema_version,
  source: {
    repository: "bjo163/rocksoul-superhero",
    ref: "main",
    dataset_sha256: datasetSha256,
  },
  counts: index.counts,
  ...records,
}

const targetDir = path.join(root, "public", "data")
fs.mkdirSync(targetDir, { recursive: true })
fs.writeFileSync(path.join(targetDir, "superhero.snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n")
console.log(`SUPERHERO web snapshot: ${snapshot.people.length} people / ${snapshot.claims.length} claims / ${snapshot.evidence.length} evidence / ${snapshot.sources.length} sources / dataset ${snapshot.source.dataset_sha256.slice(0, 12)}`)
