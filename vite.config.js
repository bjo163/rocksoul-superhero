import fs from "node:fs"
import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { MOONWITNESS_STABLE_REPOSITORY_BASE } from "@rocksoul/ui"

const config = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "config/public-observatory.json"), "utf8"),
)

function assetUrl(relativePath) {
  return `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness/${relativePath.replace(/^\/+/, "")}`
}

const replacements = {
  "__SITE_TITLE__": config.site.title,
  "__SITE_DESCRIPTION__": config.site.description,
  "__SITE_THEME_COLOR__": config.site.theme_color,
  "__SITE_URL__": config.site.url,
  "__SITE_FAVICON__": assetUrl(config.site.favicon_asset),
  "__SITE_APPLE_TOUCH__": assetUrl(config.site.apple_touch_asset),
  "__SITE_OG_IMAGE__": assetUrl(config.site.og_asset),
  "__SITE_TWITTER_CARD__": config.site.twitter_card,
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
  },
})
