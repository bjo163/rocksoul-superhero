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

export interface RelationTaxonomy {
  schema_version: string
  relations: Array<{ code: string; id: string; label: string }>
  proximity: string[]
}

export interface JsonSchemaContract {
  $schema?: string
  $id?: string
  title?: string
  type?: string
  additionalProperties?: boolean
  required?: string[]
  properties?: Record<string, unknown>
  definitions?: Record<string, unknown>
  [key: string]: unknown
}

export interface ObservatorySection {
  id: string
  nav: boolean
  index: string
  label: string
  eyebrow: string
  headline: string
  description: string
}

export interface ObservatoryConfig {
  schema_version: string
  source: { repository: string; ref: string; snapshot_path: string }
  routing: { person_param: string; query_param: string; identity_param: string; relation_param: string }
  site: {
    url: string
    title: string
    description: string
    theme_color: string
    favicon_asset: string
    apple_touch_asset: string
    og_asset: string
    twitter_card: string
    language: string
    robots: string
    application_name: string
  }
  header: { brand_label: string; live_label: string; search_href: string; nav_label: string }
  hero: {
    eyebrow: string
    headline: string
    accent: string
    copy: string
    rules: string[]
    asset: string
    snapshot_label: string
    schema_label: string
  }
  metrics: Array<{ key: keyof SuperheroSnapshot["counts"]; label: string }>
  filters: {
    search_label: string
    search_placeholder: string
    identity_label: string
    identity_all_label: string
    relation_label: string
    relation_all_label: string
    matching_suffix: string
    reset_label: string
    search_hint: string
  }
  sections: ObservatorySection[]
  person_index: {
    title: string
    empty: string
    principle_title: string
    principle_copy: string
    candidate_title: string
    candidate_empty: string
  }
  dossier: {
    eyebrow: string
    actions: { transmission: string; evidence: string; share: string }
    identity_eyebrow: string
    share_success: string
    share_error: string
    metadata: { review: string; active_period: string; claims: string; relations: string; record_class: string }
    canonical_label: string
    candidate_label: string
  }
  states: {
    loading_eyebrow: string
    loading_headline: string
    loading_copy: string
    error_eyebrow: string
    error_headline: string
    no_people: string
    retry_label: string
  }
  labels: {
    confidence: string
    known_uncertainty: string
    limitations: string
    no_relationships: string
    no_claims: string
    no_evidence: string
    no_sources: string
    no_uncertainty: string
    source_open: string
    source_no_locator: string
    record_fields: string
    taxonomy_relations: string
    taxonomy_proximity: string
    schemas: string
    record_ledger: string
    ledger_copy: string
    schema_copy: string
    candidate_badge: string
    canonical_badge: string
    selected_sources: string
    all_sources: string
    skip_to_content: string
  }
  quality: {
    disclaimer: string
    matrix_caption: string
    claim_coverage: string
    evidence_edges: string
    mean_confidence: string
    source_coverage: string
    external_domains: string
    explicit_caveats: string
    unresolved_edges: string
    matrix_relation_map: Record<string, "support" | "counter" | "context" | "alternative">
  }
  footer: { slogan: string; asset: string }
}

export interface SuperheroSnapshot {
  schema_version: string
  source: { repository: string; ref: string; dataset_sha256: string }
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
  candidates: PersonRecord[]
  claims: ClaimRecord[]
  evidence: EvidenceRecord[]
  relationships: RelationshipRecord[]
  sources: SourceRecord[]
  taxonomy: RelationTaxonomy
  schemas: Record<"person" | "claim" | "evidence" | "relationship" | "source", JsonSchemaContract>
  ui: ObservatoryConfig
}
