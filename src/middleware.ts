import { defineMiddleware } from "astro:middleware"
import { resolvePalette } from "~/server/palette"
import { withSecurityHeaders } from "~/server/security-headers"

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next()
  context.locals.palette = resolvePalette(context.cookies)
  return withSecurityHeaders(await next())
})
