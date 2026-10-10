import type { APIRoute } from "astro"
import { cursorCss } from "~/lib/cursor"

export const GET: APIRoute = () => new Response(cursorCss(), { headers: { "Content-Type": "text/css; charset=utf-8" } })
