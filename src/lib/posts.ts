import { getCollection, type CollectionEntry } from "astro:content"

export type Post = CollectionEntry<"blog">

const WORDS_PER_MINUTE = 200

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", (post) => import.meta.env.DEV || !post.data.draft)
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export function readingMinutes(post: Post): number {
  const words = post.body?.split(/\s+/).filter(Boolean).length ?? 0
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export function postUrl(post: Post): string {
  return `/blog/${post.id}`
}
