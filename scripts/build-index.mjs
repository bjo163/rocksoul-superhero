import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
function count(dir){
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs)) return 0;
  return fs.readdirSync(abs).filter((n)=>n.endsWith(".json")&&n!=="index.json").length;
}

const taxonomy=JSON.parse(fs.readFileSync(path.join(root,"taxonomy/relations.json"),"utf8"));
const index={schema_version:"0.1",counts:{
  canonical_people:count("data/people"),
  candidates:count("data/candidates"),
  sources:count("data/sources"),
  claims:count("data/claims"),
  evidence_edges:count("data/evidence"),
  relationships:count("data/relationships"),
  relation_types:taxonomy.relations.length
}};

fs.mkdirSync(path.join(root,"data"),{recursive:true});
fs.writeFileSync(path.join(root,"data/index.json"),JSON.stringify(index,null,2)+"\n");
console.log("SUPERHERO index generated");
