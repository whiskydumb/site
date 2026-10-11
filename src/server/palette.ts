import type { AstroCookies } from "astro"
import { isPalette, PALETTE_COOKIE, type Palette, randomPalette } from "~/lib/palettes"

export const resolvePalette = (cookies: AstroCookies): Palette => {
  const saved = cookies.get(PALETTE_COOKIE.name)?.value
  if (isPalette(saved)) return saved
  const palette = randomPalette()
  cookies.set(PALETTE_COOKIE.name, palette, {
    path: "/",
    maxAge: PALETTE_COOKIE.maxAge,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  })
  return palette
}
