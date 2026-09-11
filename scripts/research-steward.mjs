import fs from "node:fs"
import path from "node:path"
import {
  assessIdentityEvidence,
  buildResearchSignal,
  chooseNextWork,
  issueState,
  relationshipHandoffEligibility,
  validateResearchSignal
} from "./research-policy.mjs"

const root = process.cwd()

function countCandidates() {
  const dir = path.join(root, "data", "candidates")
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).filter((name) => name.endsWith(".json")).length
}

function metadataValues(body = "", key) {
  return [...String(body).matchAll(new RegExp(`${key}:([^\\n]+)`, "g"))].map((match) => match[1].trim()).filter(Boolean)
}

function qualifiedRefs(body = "") {
  return [...new Set(String(body).match(/\b(?:mftl|legend|rgbl|superhero|aws|jizz):[A-Za-z0-9._:-]+/g) ?? [])]
}

function convergenceFromIssue(issue) {
  const body = String(issue?.body ?? "")
  const refs = qualifiedRefs(body)
  const basis = metadataValues(body, "ROCKSOUL-CONVERGENCE-BASIS")
  const supportingEvidence = metadataValues(body, "ROCKSOUL-CONVERGENCE-SUPPORT")
  const counterevidence = metadataValues(body, "ROCKSOUL-CONVERGENCE-COUNTEREVIDENCE")
  const alternatives = metadataValues(body, "ROCKSOUL-CONVERGENCE-ALTERNATIVE")
  const confidence = Number(metadataValues(body, "ROCKSOUL-CONVERGENCE-CONFIDENCE").at(-1) ?? 0)
  const handoff = relationshipHandoffEligibility({
    qualified_refs: refs,
    supporting_evidence: supportingEvidence,
    counterevidence,
    alternatives,
    confidence,
    basis,
    privacy_blocked: /living person.*sensitive|anonymization required/i.test(body)
  })
  return {
    detected: refs.length >= 2,
    qualified_refs: refs,
    basis,
    handoff
  }
}

export function personSignalForSelection(selection) {
  const selected = selection.issue
  if (!selected) {
    return buildResearchSignal({
      outcome: selection.outcome,
      reason_codes: selection.reason_codes,
      wip: selection.wip
    })
  }
  const convergence = convergenceFromIssue(selected)
  const identity = assessIdentityEvidence({
    signals: [],
    independent_authorities: 0
  })
  return buildResearchSignal({
    outcome: selection.outcome,
    issue_ref: `bjo163/rocksoul-superhero#${selected.number}`,
    state: issueState(selected),
    priority: selected.rps,
    reason_codes: selection.reason_codes,
    wip: selection.wip,
    identity,
    convergence: {
      detected: convergence.detected,
      qualified_refs: convergence.qualified_refs,
      basis: convergence.basis
    },
    relationship_handoff: convergence.handoff
  })
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "rocksoul-superhero-steward-v2",
      "x-github-api-version": "2022-11-28"
    },
    signal: AbortSignal.timeout(20000)
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
  return response.json()
}

export async function runPersonSteward({ repo, token, discoveryCandidate = null } = {}) {
  if (!repo || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required")
  const [owner, name] = repo.split("/")
  const all = await githubJson(`https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=100`, token)
  const issues = all.filter((issue) => !issue.pull_request && /(?:\[AUTO-RESEARCH\]|\[RESEARCH\]|^Research:)/.test(issue.title ?? ""))
  const selection = chooseNextWork(issues, {
    candidateCount: countCandidates(),
    discovery_candidate: discoveryCandidate
  })
  const signal = personSignalForSelection(selection)
  if (!validateResearchSignal(signal)) throw new Error("INVALID_RESEARCH_SIGNAL")
  return signal
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const signal = await runPersonSteward({
    repo: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
    discoveryCandidate: null
  })
  process.stdout.write(`${JSON.stringify(signal, null, 2)}\n`)
}
