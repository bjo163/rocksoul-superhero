import fs from "node:fs"
import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { MOONWITNESS_STABLE_REPOSITORY_BASE } from "@rocksoul/ui"

const config = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "config/public-observatory.json"), "utf8"),
)
const snapshotFile = path.resolve(process.cwd(), "public/data/superhero.snapshot.json")
const snapshot = fs.existsSync(snapshotFile)
  ? JSON.parse(fs.readFileSync(snapshotFile, "utf8"))
  : null

function assetUrl(relativePath) {
  return `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness/${relativePath.replace(/^\\/+/, "")}`
}

const assetOrigin = new URL(MOONWITNESS_STABLE_REPOSITORY_BASE).origin
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: config.site.title,
  alternateName: config.site.application_name,
  description: config.site.description,
  url: config.site.url,
  inLanguage: config.site.language,
  isAccessibleForFree: true,
  identifier: snapshot?.source?.dataset_sha256,
  version: snapshot?.schema_version,
  keywords: ["provenance", "person", "authorship", "witnessing", "transmission", "research"],
  distribution: [
    {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: new URL(config.source.snapshot_path, config.site.url).href,
    },
  ],
  variableMeasured: config.metrics.map((metric) => ({
    "@type": "PropertyValue",
    name: metric.label,
    value: snapshot?.counts?.[metric.key] ?? null,
  })),
}

const replacements = {
  "__SITE_TITLE__": config.site.title,
  "__SITE_APPLICATION_NAME__": config.site.application_name,
  "__SITE_DESCRIPTION__": config.site.description,
  "__SITE_LANGUAGE__": config.site.language,
  "__SITE_ROBOTS__": config.site.robots,
  "__SITE_THEME_COLOR__": config.site.theme_color,
  "__SITE_URL__": config.site.url,
  "__SITE_FAVICON__": assetUrl(config.site.favicon_asset),
  "__SITE_APPLE_TOUCH__": assetUrl(config.site.apple_touch_asset),
  "__SITE_OG_IMAGE__": assetUrl(config.site.og_asset),
  "__SITE_TWITTER_CARD__": config.site.twitter_card,
  "__ASSET_ORIGIN__": assetOrigin,
  "__SITE_STRUCTURED_DATA__": JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "superhero-public-contract",
      transformIndexHtml(html) {
        return Object.entries(replacements).reduce(
          (output, [token, value]) => output.replaceAll(token, String(value)),
          html,
        )
      },
    },
  ],
  build: {
    target: "es2022",
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
})
