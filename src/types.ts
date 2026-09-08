export interface TimeRange {
  start: string | null
  end: string | null
  precision: string
  note?: string | null
}

export interface PersonRecord {
  id: string
  canonical_name: string
  names?: Array<{ value: string; language: string; script?: string | null }>
  aliases?: string[]
  identity_status: string
  lifespan: TimeRange
  active_period: TimeRange
  place_refs: string[]
  source_refs: string[]
  claim_refs: string[]
  relationship_refs: string[]
  uncertainty: string[]
  review: { status: string; reviewed_by?: string | null; note?: string | null }
}

export interface ClaimRecord {
  id: string
  subject_id: string
  statement: string
  claim_type: string
  epistemic_status: string
  source_refs: string[]
  notes: string[]
}

export interface EvidenceRecord {
  id: string
  claim_id: string
  relation: string
  evidence_type: string
  summary: string
  source_refs: string[]
  confidence: number
  limitations: string[]
}

export interface RelationshipRecord {
  id: string
  subject_id: string
  relation: string
  object_ref: string
  proximity: string
  status: string
  confidence: number
  source_refs: string[]
  uncertainty: string[]
  note?: string | null
}

export interface SourceRecord {
  id: string
  title: string
  source_type: string
  creator?: string | null
  date?: string | null
  language?: string | null
  locator?: string | null
  provenance: string
  quality?: string | null
  notes: string[]
}

export interface SuperheroSnapshot {
  schema_version: string
  source: { repository: string; ref: string; commit: string; dataset_sha256: string }
  counts: {
    canonical_people: number
    candidates: number
    sources: number
    claims: number
    evidence_edges: number
    relationships: number
    relation_types: number
  }
  people: PersonRecord[]
  claims: ClaimRecord[]
  evidence: EvidenceRecord[]
  relationships: RelationshipRecord[]
  sources: SourceRecord[]
}
