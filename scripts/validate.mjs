import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";

const root=process.cwd();
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const ajv=new Ajv({allErrors:true,strict:false});

const personValidator=ajv.compile(readJson("schemas/person.schema.json"));
const schemas={
  people:personValidator,
  candidates:personValidator,
  sources:ajv.compile(readJson("schemas/source.schema.json")),
  claims:ajv.compile(readJson("schemas/claim.schema.json")),
  evidence:ajv.compile(readJson("schemas/evidence.schema.json")),
  relationships:ajv.compile(readJson("schemas/relationship.schema.json"))
};

const taxonomy=readJson("taxonomy/relations.json");
const relationIds=new Set(taxonomy.relations.map((x)=>x.id));

function jsonFiles(dir){
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((n)=>n.endsWith(".json")&&n!=="index.json").map((n)=>path.join(abs,n));
}

function loadRegistry(kind){
  const items=new Map();
  for(const file of jsonFiles(`data/${kind}`)){
    const data=JSON.parse(fs.readFileSync(file,"utf8"));
    items.set(data.id,{data,file});
  }
  return items;
}

let failures=0;
const fail=(message)=>{ failures++; console.error(`GRAPH INVALID: ${message}`); };

for(const [kind,validate] of Object.entries(schemas)){
  for(const file of jsonFiles(`data/${kind}`)){
    const data=JSON.parse(fs.readFileSync(file,"utf8"));
    if(!validate(data)){
      failures++;
      console.error(`INVALID ${path.relative(root,file)}`);
      console.error(validate.errors);
      continue;
    }
    if(kind==="relationships"&&!relationIds.has(data.relation)){
      failures++;
      console.error(`INVALID RELATION ${path.relative(root,file)}: ${data.relation}`);
    }
  }
}

const codes=taxonomy.relations.map((x)=>x.code);
const ids=taxonomy.relations.map((x)=>x.id);
if(new Set(codes).size!==codes.length||new Set(ids).size!==ids.length){
  failures++;
  console.error("taxonomy/relations.json contains duplicate codes or ids");
}

const registries={
  people:loadRegistry("people"),
  candidates:loadRegistry("candidates"),
  sources:loadRegistry("sources"),
  claims:loadRegistry("claims"),
  evidence:loadRegistry("evidence"),
  relationships:loadRegistry("relationships")
};

const localById=new Map();
for(const [kind,registry] of Object.entries(registries)){
  for(const [id,entry] of registry){
    if(localById.has(id)) fail(`duplicate local id ${id} in ${kind} and ${localById.get(id).kind}`);
    else localById.set(id,{kind,...entry});
  }
}

const allowed={
  mftl:new Set(["MYTH","ENTITY","CLAIM","SOURCE","EVIDENCE","CAND"]),
  legend:new Set(["EVT","SRC","CLM","EVD","REL","PLC","ART"]),
  superhero:new Set(["PER","SRC","CLM","EVD","REL"])
};

function parseRef(ref,context){
  const match=/^(mftl|legend|superhero):(.+)$/.exec(ref);
  if(!match){ fail(`${context} has malformed qualified ref ${ref}`); return null; }
  const [,repo,id]=match;
  const prefix=id.split("-")[0];
  if(!allowed[repo].has(prefix)) fail(`${context} uses namespace ${repo} with invalid id prefix ${prefix}`);
  if(repo==="superhero"&&!localById.has(id)) fail(`${context} references missing local object ${id}`);
  return {repo,id,prefix};
}

function validateSourceRef(ref,context){
  const parsed=parseRef(ref,context);
  if(!parsed) return;
  if(parsed.repo==="superhero"&&parsed.prefix!=="SRC") fail(`${context} expects a source ref, got ${ref}`);
  if(parsed.repo==="mftl"&&parsed.prefix!=="SOURCE") fail(`${context} expects an MFTL SOURCE-* ref, got ${ref}`);
  if(parsed.repo==="legend"&&parsed.prefix!=="SRC") fail(`${context} expects a LEGEND SRC-* ref, got ${ref}`);
}

for(const [id,{data}] of registries.people){
  for(const ref of data.source_refs) validateSourceRef(ref,`person ${id}`);
  for(const ref of data.claim_refs){
    const claim=registries.claims.get(ref)?.data;
    if(!claim) fail(`person ${id} references missing claim ${ref}`);
    else if(claim.subject_id!==id) fail(`person ${id} includes claim ${ref} whose subject_id is ${claim.subject_id}`);
  }
  for(const ref of data.relationship_refs){
    const relation=registries.relationships.get(ref)?.data;
    if(!relation) fail(`person ${id} references missing relationship ${ref}`);
    else if(relation.subject_id!==id) fail(`person ${id} includes relationship ${ref} whose subject_id is ${relation.subject_id}`);
  }
  for(const ref of data.place_refs){
    const parsed=parseRef(ref,`person ${id} place ref`);
    if(parsed&&(parsed.repo!=="legend"||parsed.prefix!=="PLC")) fail(`person ${id} place ref must be legend:PLC-*, got ${ref}`);
  }
}

for(const [id,{data}] of registries.candidates){
  for(const ref of data.source_refs) validateSourceRef(ref,`candidate ${id}`);
  for(const ref of data.claim_refs) if(!registries.claims.has(ref)) fail(`candidate ${id} references missing claim ${ref}`);
  for(const ref of data.relationship_refs) if(!registries.relationships.has(ref)) fail(`candidate ${id} references missing relationship ${ref}`);
}

for(const [id,{data}] of registries.claims){
  if(!registries.people.has(data.subject_id)&&!registries.candidates.has(data.subject_id)){
    fail(`claim ${id} references missing person/candidate ${data.subject_id}`);
  }
  for(const ref of data.source_refs) validateSourceRef(ref,`claim ${id}`);
}

for(const [id,{data}] of registries.evidence){
  if(!registries.claims.has(data.claim_id)) fail(`evidence ${id} references missing claim ${data.claim_id}`);
  for(const ref of data.source_refs) validateSourceRef(ref,`evidence ${id}`);
}

for(const [id,{data}] of registries.relationships){
  if(!registries.people.has(data.subject_id)&&!registries.candidates.has(data.subject_id)){
    fail(`relationship ${id} references missing subject ${data.subject_id}`);
  }
  parseRef(data.object_ref,`relationship ${id} object`);
  for(const ref of data.source_refs) validateSourceRef(ref,`relationship ${id}`);
}

if(failures){
  console.error(`Validation failed with ${failures} problem(s).`);
  process.exit(1);
}
console.log("SUPERHERO schema + graph validation OK");
