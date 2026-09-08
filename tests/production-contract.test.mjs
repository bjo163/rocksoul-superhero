import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const html = fs.readFileSync("index.html", "utf8")
const vite = fs.readFileSync("vite.config.js", "utf8")
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"))
const config = JSON.parse(fs.readFileSync("config/public-observatory.json", "utf8"))

function headerMap(rule) {
  return new Map((rule?.headers ?? []).map((header) => [header.key.toLowerCase(), header.value]))
}

test("HTML shell exposes search metadata, canonical asset preconnect, structured data and no-JS fallback", () => {
  assert.match(html, /<html lang="__SITE_LANGUAGE__">/)
  assert.match(html, /name="robots"/)
  assert.match(html, /rel="preconnect" href="__ASSET_ORIGIN__"/)
  assert.match(html, /application\/ld\+json/)
  assert.match(html, /<noscript>/)
  assert.match(vite, /"@type": "Dataset"/)
  assert.match(vite, /dataset_sha256/)
  assert.match(vite, /variableMeasured/)
})

test("Vercel production contract uses canonical build, restrictive security headers and explicit cache policy", () => {
  assert.equal(vercel.buildCommand, "npm run build")
  const globalRule = vercel.headers.find((rule) => rule.source === "/(.*)")
  const security = headerMap(globalRule)
  assert.match(security.get("content-security-policy") ?? "", /default-src 'self'/)
  assert.match(security.get("content-security-policy") ?? "", /frame-ancestors 'none'/)
  assert.match(security.get("content-security-policy") ?? "", /https:\/\/raw\.githubusercontent\.com/)
  assert.equal(security.get("x-content-type-options"), "nosniff")
  assert.equal(security.get("x-frame-options"), "DENY")
  assert.equal(security.get("referrer-policy"), "strict-origin-when-cross-origin")
  assert.ok(security.has("permissions-policy"))

  const assets = headerMap(vercel.headers.find((rule) => rule.source === "/assets/(.*)"))
  assert.match(assets.get("cache-control") ?? "", /immutable/)

  const snapshot = headerMap(vercel.headers.find((rule) => rule.source === "/data/superhero.snapshot.json"))
  assert.match(snapshot.get("cache-control") ?? "", /must-revalidate/)
})

test("public observatory metadata contract is explicit", () => {
  assert.equal(config.site.url, "https://rocksoul-superhero.vercel.app/")
  assert.equal(config.site.language, "en")
  assert.equal(config.site.robots, "index,follow")
  assert.equal(config.schema_version, "1.1")
})


test("main-only enforcement preserves only ephemeral dependency automation branches", () => {
  const workflow = fs.readFileSync(".github/workflows/validate.yml", "utf8")
  const branching = fs.readFileSync("docs/BRANCHING.md", "utf8")
  const dependabot = fs.readFileSync(".github/dependabot.yml", "utf8")
  assert.match(workflow, /dependabot\/\*/)
  assert.match(workflow, /grep -v '\^dependabot\/'/)
  assert.match(branching, /only canonical, long-lived SUPERHERO branch/)
  assert.match(branching, /dependabot\/\*/)
  assert.match(dependabot, /target-branch: "main"/)
})
