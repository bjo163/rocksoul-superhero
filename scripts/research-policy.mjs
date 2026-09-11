const STATE_BASE = Object.freeze({
  merged: 0,
  canonicalized: 5,
  ready_for_observation: 92,
  source_inspected: 100,
  needs_sources: 72,
  triaged: 60,
  discovered: 35,
  rejected: -100,
  duplicate: -100
})

const TERMINAL = new Set(["merged", "rejected", "duplicate"])
const SIMILARITY_ONLY = new Set(["same_name", "same_spelling", "same_title", "same_url", "same_embedding", "shared_event", "text_reference"])

export function metadata(body = "", key) {
  const matches = [...String(body).matchAll(new RegExp(`${key}:([^\\n]+)`, "g"))]
  return matches.at(-1)?.[1]?.trim() ?? null
}

export function issueState(issue = {}) {
  return metadata(issue.body, "ROCKSOUL-RESEARCH-STATE") ?? "discovered"
}

export function countLifecycle(issues = []) {
  return issues.reduce((counts, issue) => {
    const state = typeof issue === "string" ? issue : issueState(issue)
    counts[state] = (counts[state] ?? 0) + 1
    return counts
  }, {})
}

export function wipPressure({ issues = [], candidateCount = 0 } = {}) {
  const counts = countLifecycle(issues)
  const actionable = (counts.triaged ?? 0) + (counts.needs_sources ?? 0) + (counts.source_inspected ?? 0) + (counts.ready_for_observation ?? 0)
  const advanced = (counts.source_inspected ?? 0) + (counts.ready_for_observation ?? 0) + Number(candidateCount || 0)
  const level = advanced >= 4 || actionable >= 8 ? "HARD" : advanced >= 2 || actionable >= 4 ? "SOFT" : "CLEAR"
  return {
    level,
    actionable,
    advanced,
    candidate_count: Number(candidateCount || 0),
    suppress_discovery: level !== "CLEAR",
    reason_codes: level === "HARD"
      ? ["PERSON_WIP_HARD_LIMIT", "PROGRESS_EXISTING_WORK_FIRST"]
      : level === "SOFT"
        ? ["PERSON_WIP_SOFT_LIMIT", "PREFER_EXISTING_WORK"]
        : []
  }
}

export function rpsV1(item = {}, context = {}) {
  const state = item.state ?? issueState(item)
  const pressure = context.pressure ?? wipPressure({ issues: context.issues ?? [], candidateCount: context.candidateCount ?? 0 })
  const components = {
    lifecycle_progression: STATE_BASE[state] ?? 0,
    evidence_gain: Math.max(0, Math.min(25, Number(item.evidence_gain ?? item.evidenceGain ?? 0))),
    uncertainty_reduction: Math.max(0, Math.min(20, Number(item.uncertainty_reduction ?? item.uncertaintyReduction ?? 0))),
    convergence_value: Math.max(0, Math.min(15, Number(item.convergence_value ?? item.convergenceValue ?? 0))),
    diversity_bonus: Math.max(0, Math.min(10, Number(item.diversity_bonus ?? item.diversityBonus ?? 0))),
    redundancy_penalty: -Math.max(0, Math.min(20, Number(item.redundancy_penalty ?? item.redundancyPenalty ?? 0))),
    discovery_wip_penalty: state === "discovered" && pressure.suppress_discovery ? (pressure.level === "HARD" ? -80 : -35) : 0
  }
  const score = Object.values(components).reduce((sum, value) => sum + value, 0)
  return {
    schema_version: "RPS_V1",
    score,
    components,
    note: "Priority score only; never a truth, confidence, identity, or canonicality score."
  }
}

export function rankResearchIssues(issues = [], options = {}) {
  const open = issues.filter((issue) => !TERMINAL.has(issueState(issue)))
  const pressure = wipPressure({ issues: open, candidateCount: options.candidateCount ?? 0 })
  return open.map((issue) => {
    const state = issueState(issue)
    const rps = rpsV1({ ...issue, state }, { pressure })
    return { ...issue, research_state: state, rps }
  }).sort((a, b) => b.rps.score - a.rps.score || Number(a.number ?? a.id ?? 0) - Number(b.number ?? b.id ?? 0))
}

export function assessIdentityEvidence(input = {}) {
  const signals = new Set(input.signals ?? [])
  const independentAuthorities = Number(input.independent_authorities ?? 0)
  const hasIndependentEvidence = independentAuthorities >= 2 || Boolean(input.direct_primary_identity_evidence)
  const conflict = Boolean(input.conflicting_identifiers || input.unresolved_identity_conflict)
  const privacyBlocked = Boolean(input.living_person_sensitive_inference || input.anonymization_required)
  const onlySimilarity = signals.size > 0 && [...signals].every((signal) => SIMILARITY_ONLY.has(signal))

  if (privacyBlocked) return { decision: "HOLD", auto_merge: false, reason_codes: ["PRIVACY_OR_ANONYMIZATION_BOUNDARY"] }
  if (onlySimilarity || !hasIndependentEvidence) {
    return {
      decision: "HOLD",
      auto_merge: false,
      reason_codes: onlySimilarity ? ["SIMILARITY_IS_NOT_IDENTITY"] : ["INSUFFICIENT_INDEPENDENT_IDENTITY_EVIDENCE"]
    }
  }
  if (conflict) return { decision: "HOLD", auto_merge: false, reason_codes: ["UNRESOLVED_IDENTITY_CONFLICT"] }
  return {
    decision: "IDENTITY_REVIEW_ELIGIBLE",
    auto_merge: false,
    reason_codes: ["INDEPENDENT_IDENTITY_EVIDENCE_PRESENT", "HUMAN_REVIEW_REQUIRED"]
  }
}

export function relationshipHandoffEligibility(input = {}) {
  const refs = Array.isArray(input.qualified_refs) ? input.qualified_refs.filter((ref) => /^[a-z][a-z0-9-]*:.+/.test(String(ref))) : []
  const supports = Array.isArray(input.supporting_evidence) ? input.supporting_evidence.filter(Boolean) : []
  const alternatives = Array.isArray(input.alternatives) ? input.alternatives.filter(Boolean) : []
  const counterevidence = Array.isArray(input.counterevidence) ? input.counterevidence.filter(Boolean) : []
  const confidence = Number(input.confidence ?? 0)
  const basis = new Set(input.basis ?? [])
  const similarityOnly = basis.size > 0 && [...basis].every((value) => SIMILARITY_ONLY.has(value))
  const privacyBlocked = Boolean(input.privacy_blocked)
  const eligible = refs.length >= 2 && supports.length >= 1 && alternatives.length >= 1 && counterevidence.length >= 1 && confidence >= 0.65 && !similarityOnly && !privacyBlocked

  return {
    schema_version: "rocksoul.relationship-handoff.v1",
    decision: eligible ? "ELIGIBLE_FOR_EVENT_DRIVEN_REVIEW" : "HOLD",
    canonical_edge_created: false,
    reason_codes: eligible
      ? ["QUALIFIED_CROSS_DOMAIN_REFS", "EVIDENCE_AND_ALTERNATIVES_PRESENT", "CORRELATION_REVIEW_REQUIRED"]
      : [
          ...(refs.length < 2 ? ["INSUFFICIENT_QUALIFIED_REFS"] : []),
          ...(supports.length < 1 ? ["MISSING_SUPPORTING_EVIDENCE"] : []),
          ...(alternatives.length < 1 ? ["MISSING_ALTERNATIVES"] : []),
          ...(counterevidence.length < 1 ? ["MISSING_COUNTEREVIDENCE"] : []),
          ...(confidence < 0.65 ? ["CONFIDENCE_BELOW_HANDOFF_GATE"] : []),
          ...(similarityOnly ? ["SIMILARITY_ONLY_CONVERGENCE"] : []),
          ...(privacyBlocked ? ["PRIVACY_BOUNDARY"] : [])
        ]
  }
}

export function buildResearchSignal(input = {}) {
  const signal = {
    schema_version: "rocksoul.research-signal.v1",
    domain: "PERSON",
    owner_repo: "bjo163/rocksoul-superhero",
    outcome: input.outcome ?? "NO_UPDATE",
    issue_ref: input.issue_ref ?? null,
    state: input.state ?? null,
    priority: input.priority ?? null,
    reason_codes: input.reason_codes ?? [],
    wip: input.wip ?? { level: "CLEAR", suppress_discovery: false },
    identity: input.identity ?? { decision: "NOT_EVALUATED", auto_merge: false },
    convergence: input.convergence ?? { detected: false },
    relationship_handoff: input.relationship_handoff ?? { decision: "NOT_EVALUATED", canonical_edge_created: false },
    constraints: [
      "ISSUE_FIRST_SOURCE_SECOND_CANON_LAST",
      "IDENTITY_BY_EVIDENCE",
      "TEXT_REFERENCE_DOES_NOT_MINT_PERSON",
      "SIMILARITY_DOES_NOT_MERGE_IDENTITY",
      "RELATIONSHIP_HANDOFF_DOES_NOT_MINT_EDGE",
      "PRIVACY_AND_ANONYMIZATION_BOUNDARIES_PRESERVED"
    ]
  }
  return signal
}

export function validateResearchSignal(signal) {
  return Boolean(
    signal &&
    signal.schema_version === "rocksoul.research-signal.v1" &&
    signal.domain === "PERSON" &&
    signal.owner_repo === "bjo163/rocksoul-superhero" &&
    typeof signal.outcome === "string" &&
    Array.isArray(signal.reason_codes) &&
    Array.isArray(signal.constraints) &&
    signal.identity?.auto_merge === false &&
    signal.relationship_handoff?.canonical_edge_created === false
  )
}

export function chooseNextWork(issues = [], options = {}) {
  const ranked = rankResearchIssues(issues, options)
  const pressure = wipPressure({ issues: ranked, candidateCount: options.candidateCount ?? 0 })
  const selected = ranked[0]
  if (selected) {
    return {
      outcome: "PROGRESS_EXISTING_RESEARCH",
      issue: selected,
      wip: pressure,
      reason_codes: ["EXISTING_PERSON_BACKLOG_SELECTED", ...(pressure.reason_codes ?? [])]
    }
  }
  if (pressure.suppress_discovery || !options.discovery_candidate) {
    return { outcome: "NO_UPDATE", issue: null, wip: pressure, reason_codes: pressure.suppress_discovery ? pressure.reason_codes : ["NO_ACTIONABLE_EXISTING_OR_NEW_PERSON_WORK"] }
  }
  return { outcome: "DISCOVERY_CANDIDATE", issue: null, discovery_candidate: options.discovery_candidate, wip: pressure, reason_codes: ["NO_EXISTING_PERSON_BACKLOG", "DISCOVERY_ALLOWED"] }
}
