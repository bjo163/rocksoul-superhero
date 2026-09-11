import test from "node:test"
import assert from "node:assert/strict"
import {
  assessIdentityEvidence,
  buildResearchSignal,
  chooseNextWork,
  relationshipHandoffEligibility,
  validateResearchSignal
} from "../scripts/research-policy.mjs"
import { personSignalForSelection } from "../scripts/research-steward.mjs"

function issue(number, state, body = "") {
  return {
    number,
    title: `[AUTO-RESEARCH] PERSON · fixture ${number}`,
    body: `${body}\nROCKSOUL-RESEARCH-STATE:${state}`
  }
}

test("existing actionable PERSON issue is selected before new discovery", () => {
  const selection = chooseNextWork([
    issue(2, "discovered"),
    issue(1, "source_inspected")
  ], { discovery_candidate: { title: "new lead" } })
  assert.equal(selection.outcome, "PROGRESS_EXISTING_RESEARCH")
  assert.equal(selection.issue.number, 1)
  assert.equal(selection.issue.research_state, "source_inspected")
  assert.ok(selection.issue.rps.score > 0)
})

test("same-name identity collision never auto-merges", () => {
  const result = assessIdentityEvidence({
    signals: ["same_name", "same_spelling", "same_url", "same_embedding"],
    independent_authorities: 0
  })
  assert.equal(result.decision, "HOLD")
  assert.equal(result.auto_merge, false)
  assert.ok(result.reason_codes.includes("SIMILARITY_IS_NOT_IDENTITY"))
})

test("TEXT reference does not automatically create or resolve canonical PERSON", () => {
  const result = assessIdentityEvidence({
    signals: ["text_reference"],
    independent_authorities: 0
  })
  assert.equal(result.decision, "HOLD")
  assert.equal(result.auto_merge, false)
})

test("qualified convergence may create event-driven handoff eligibility but never a canonical edge", () => {
  const result = relationshipHandoffEligibility({
    qualified_refs: [
      "superhero:PER-JERUSALEM-FLAVIUS-JOSEPHUS",
      "legend:EVT-JERUSALEM-SECOND-TEMPLE-DESTRUCTION-70"
    ],
    supporting_evidence: ["independent owner-domain support"],
    counterevidence: ["role and chronology limitations remain explicit"],
    alternatives: ["shared subject matter without direct relationship"],
    confidence: 0.82,
    basis: ["independent_domain_evidence", "chronology_compatible"]
  })
  assert.equal(result.decision, "ELIGIBLE_FOR_EVENT_DRIVEN_REVIEW")
  assert.equal(result.canonical_edge_created, false)
})

test("similarity-only convergence does not create relationship handoff", () => {
  const result = relationshipHandoffEligibility({
    qualified_refs: ["superhero:PER-EXAMPLE-A", "legend:EVT-EXAMPLE-A"],
    supporting_evidence: ["semantic overlap"],
    counterevidence: ["identity unresolved"],
    alternatives: ["coincidental similarity"],
    confidence: 0.95,
    basis: ["same_name", "same_embedding"]
  })
  assert.equal(result.decision, "HOLD")
  assert.equal(result.canonical_edge_created, false)
  assert.ok(result.reason_codes.includes("SIMILARITY_ONLY_CONVERGENCE"))
})

test("NO_UPDATE is a valid steward outcome", () => {
  const selection = chooseNextWork([], {})
  assert.equal(selection.outcome, "NO_UPDATE")
  const signal = personSignalForSelection(selection)
  assert.equal(signal.outcome, "NO_UPDATE")
  assert.equal(validateResearchSignal(signal), true)
})

test("Research Signal validates and preserves PERSON safety constraints", () => {
  const signal = buildResearchSignal({
    outcome: "PROGRESS_EXISTING_RESEARCH",
    issue_ref: "bjo163/rocksoul-superhero#18",
    state: "source_inspected",
    reason_codes: ["EXISTING_PERSON_BACKLOG_SELECTED"],
    identity: { decision: "HOLD", auto_merge: false },
    relationship_handoff: { decision: "HOLD", canonical_edge_created: false }
  })
  assert.equal(validateResearchSignal(signal), true)
  assert.ok(signal.constraints.includes("TEXT_REFERENCE_DOES_NOT_MINT_PERSON"))
  assert.ok(signal.constraints.includes("SIMILARITY_DOES_NOT_MERGE_IDENTITY"))
})

test("living-person privacy boundary prevents identity promotion", () => {
  const result = assessIdentityEvidence({
    signals: [],
    independent_authorities: 3,
    living_person_sensitive_inference: true
  })
  assert.equal(result.decision, "HOLD")
  assert.equal(result.auto_merge, false)
  assert.ok(result.reason_codes.includes("PRIVACY_OR_ANONYMIZATION_BOUNDARY"))
})
