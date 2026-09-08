import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"

const root = process.cwd()

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"))
}

function readJsonDirectory(relativePath) {
  const directory = path.join(root, relativePath)
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .sort()
    .map((name) => readJson(path.join(relativePath, name)))
}

const index = readJson("data/index.json")
const ui = readJson("config/public-observatory.json")
const taxonomy = readJson("taxonomy/relations.json")
const schemas = Object.fromEntries(
  ["person", "claim", "evidence", "relationship", "source"].map((name) => [
    name,
    readJson(`schemas/${name}.schema.json`),
  ]),
)

const records = {
  people: readJsonDirectory("data/people"),
  candidates: readJsonDirectory("data/candidates"),
  claims: readJsonDirectory("data/claims"),
  evidence: readJsonDirectory("data/evidence"),
  relationships: readJsonDirectory("data/relationships"),
  sources: readJsonDirectory("data/sources"),
}

const publicContract = { records, taxonomy, schemas, ui }
const datasetSha256 = createHash("sha256").update(JSON.stringify(publicContract)).digest("hex")

const snapshot = {
  schema_version: index.schema_version,
  source: {
    repository: ui.source.repository,
    ref: ui.source.ref,
    dataset_sha256: datasetSha256,
  },
  counts: index.counts,
  ...records,
  taxonomy,
  schemas,
  ui,
}

const targetDir = path.join(root, "public", "data")
fs.mkdirSync(targetDir, { recursive: true })
fs.writeFileSync(path.join(targetDir, "superhero.snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n")
console.log(
  `SUPERHERO web snapshot: ${snapshot.people.length} people / ${snapshot.candidates.length} candidates / ${snapshot.claims.length} claims / ${snapshot.evidence.length} evidence / ${snapshot.sources.length} sources / dataset ${snapshot.source.dataset_sha256.slice(0, 12)}`,
)
