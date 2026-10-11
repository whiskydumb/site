import { ActionError, defineAction } from "astro:actions"
import { z } from "astro/zod"
import { type SubmitRejection, submitEntry } from "~/server/guestbook/guestbook"
import { hashIp } from "~/server/guestbook/ip-hash"

const DEFAULT_NAME = "anon"

const REJECTIONS: Record<SubmitRejection, { code: ActionError["code"]; message: string }> = {
  links: { code: "BAD_REQUEST", message: "no links please" },
  too_many_lines: { code: "BAD_REQUEST", message: "keep it under 5 lines" },
  banned: { code: "FORBIDDEN", message: "you can't post here" },
  rate_limited: { code: "TOO_MANY_REQUESTS", message: "slow down a little and try again later" },
  queue_full: { code: "SERVICE_UNAVAILABLE", message: "too many messages waiting, try again later" },
}

export const server = {
  guestbook: {
    send: defineAction({
      accept: "form",
      input: z.object({
        message: z.string().trim().min(3, "message is too short").max(280, "message is too long"),
        sender: z.string().trim().max(32, "name is too long").optional(),
        dm: z.boolean().default(false),
        website: z.string().optional(),
      }),
      handler: async ({ message, sender, dm, website }, context) => {
        if (website) return { isPrivate: dm }
        const result = await submitEntry({
          name: sender || DEFAULT_NAME,
          message,
          isPrivate: dm,
          ipHash: await hashIp(context.clientAddress),
        })
        if (!result.ok) throw new ActionError(REJECTIONS[result.reason])
        return { isPrivate: dm }
      },
    }),
  },
}
