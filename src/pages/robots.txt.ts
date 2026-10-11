import type { APIContext } from "astro"

export function GET(context: APIContext) {
  const sitemap = new URL("sitemap.xml", context.site ?? context.url.origin)
  const body = ["User-agent: *", "Disallow: /_actions/", "", `Sitemap: ${sitemap}`, ""].join("\n")
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
