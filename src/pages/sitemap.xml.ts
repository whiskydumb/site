import type { APIContext } from "astro"
import { getPosts, postUrl } from "~/lib/posts"

interface SitemapEntry {
  readonly path: string
  readonly lastModified?: Date
}

const escapeXml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

const urlElement = ({ path, lastModified }: SitemapEntry, site: URL | string): string => {
  const location = `<loc>${escapeXml(new URL(path, site).href)}</loc>`
  const date = lastModified ? `<lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod>` : ""
  return `  <url>${location}${date}</url>`
}

export async function GET(context: APIContext) {
  const site = context.site ?? context.url.origin
  const posts = await getPosts()
  const entries: SitemapEntry[] = [
    { path: "/" },
    ...posts.map((post) => ({ path: postUrl(post), lastModified: post.data.date })),
  ]
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => urlElement(entry, site)),
    "</urlset>",
    "",
  ].join("\n")
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
