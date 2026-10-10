import rss from "@astrojs/rss"
import type { APIContext } from "astro"
import { SITE } from "~/lib/consts"
import { getPosts, postUrl } from "~/lib/posts"

export async function GET(context: APIContext) {
  const posts = await getPosts()

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? context.url.origin,
    customData: "<language>en</language>",
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
    })),
  })
}
