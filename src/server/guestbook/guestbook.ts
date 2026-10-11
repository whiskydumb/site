import { and, desc, eq, gt, isNull, or } from "drizzle-orm"
import { db } from "~/server/db/client"
import { guestbookBans, guestbookEntries } from "~/server/db/schema"

const PUBLIC_ENTRIES_LIMIT = 50
const RATE_LIMIT_COUNT = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const MAX_PENDING = 50
const MAX_PUBLIC_LINES = 5
const LINK_PATTERN = /https?:\/\/|www\.|[\w-]+\.[a-z]{2,}\//i

export interface NewEntry {
  readonly name: string
  readonly message: string
  readonly isPrivate: boolean
  readonly ipHash: string
}

export type SubmitRejection = "links" | "too_many_lines" | "banned" | "rate_limited" | "queue_full"

export type SubmitResult = { readonly ok: true } | { readonly ok: false; readonly reason: SubmitRejection }

const contentRejection = ({ name, message, isPrivate }: NewEntry): SubmitRejection | null => {
  if (LINK_PATTERN.test(name)) return "links"
  if (isPrivate) return null
  if (LINK_PATTERN.test(message)) return "links"
  if (message.split("\n").length > MAX_PUBLIC_LINES) return "too_many_lines"
  return null
}

const isBanned = async (ipHash: string, now: Date): Promise<boolean> =>
  (await db.$count(
    guestbookBans,
    and(
      eq(guestbookBans.ipHash, ipHash),
      or(isNull(guestbookBans.expiresAt), gt(guestbookBans.expiresAt, now)),
    ),
  )) > 0

const isRateLimited = async (ipHash: string, now: Date): Promise<boolean> =>
  (await db.$count(
    guestbookEntries,
    and(
      eq(guestbookEntries.ipHash, ipHash),
      gt(guestbookEntries.createdAt, new Date(now.getTime() - RATE_LIMIT_WINDOW_MS)),
    ),
  )) >= RATE_LIMIT_COUNT

const isQueueFull = async (): Promise<boolean> =>
  (await db.$count(
    guestbookEntries,
    and(eq(guestbookEntries.status, "pending"), eq(guestbookEntries.isPrivate, false)),
  )) >= MAX_PENDING

const rejection = async (entry: NewEntry, now: Date): Promise<SubmitRejection | null> => {
  const content = contentRejection(entry)
  if (content) return content
  if (await isBanned(entry.ipHash, now)) return "banned"
  if (await isRateLimited(entry.ipHash, now)) return "rate_limited"
  if (!entry.isPrivate && (await isQueueFull())) return "queue_full"
  return null
}

export const submitEntry = async (entry: NewEntry): Promise<SubmitResult> => {
  const now = new Date()
  const reason = await rejection(entry, now)
  if (reason) return { ok: false, reason }
  await db.insert(guestbookEntries).values({ ...entry, createdAt: now })
  return { ok: true }
}

export interface PublicEntry {
  readonly id: number
  readonly name: string
  readonly message: string
  readonly reply: string | null
}

export const listPublicEntries = (): Promise<PublicEntry[]> =>
  db
    .select({
      id: guestbookEntries.id,
      name: guestbookEntries.name,
      message: guestbookEntries.message,
      reply: guestbookEntries.reply,
    })
    .from(guestbookEntries)
    .where(and(eq(guestbookEntries.status, "approved"), eq(guestbookEntries.isPrivate, false)))
    .orderBy(desc(guestbookEntries.createdAt), desc(guestbookEntries.id))
    .limit(PUBLIC_ENTRIES_LIMIT)
