export const PALETTES = ["rose", "seafoam", "sage", "periwinkle", "lavender"] as const

export type Palette = (typeof PALETTES)[number]

export const DEFAULT_PALETTE: Palette = "rose"

export interface PaletteColors {
  readonly bg: string
  readonly surface: string
  readonly line: string
  readonly fg: string
  readonly muted: string
  readonly accent: string
  readonly accent2: string
}

export const PALETTE_COLORS: Record<Palette, PaletteColors> = {
  rose: {
    bg: "#09090b",
    surface: "#111113",
    line: "#222226",
    fg: "#f0f0f2",
    muted: "#a8a8b0",
    accent: "#f2b8c8",
    accent2: "#db2777",
  },
  seafoam: {
    bg: "#0a110f",
    surface: "#111a17",
    line: "#21302b",
    fg: "#b6d6ca",
    muted: "#6a887d",
    accent: "#95cdb9",
    accent2: "#64b59c",
  },
  sage: {
    bg: "#13151b",
    surface: "#1d202a",
    line: "#2c303c",
    fg: "#e9ebf3",
    muted: "#a8aec2",
    accent: "#9ed3ae",
    accent2: "#a99bd8",
  },
  periwinkle: {
    bg: "#151b28",
    surface: "#1d2331",
    line: "#2c3548",
    fg: "#dfe9ed",
    muted: "#9fb3bd",
    accent: "#9a9ae0",
    accent2: "#5e5db8",
  },
  lavender: {
    bg: "#141316",
    surface: "#1c1b1f",
    line: "#2e2c33",
    fg: "#e6e1e5",
    muted: "#938f99",
    accent: "#d0bcff",
    accent2: "#ffc234",
  },
}

export const PALETTE_COOKIE = { name: "palette", maxAge: 60 * 60 * 24 * 365 } as const

export const isPalette = (value: unknown): value is Palette => PALETTES.some((palette) => palette === value)

export const randomPalette = (): Palette => PALETTES[Math.floor(Math.random() * PALETTES.length)] ?? DEFAULT_PALETTE

export const THEME_COLORS: Record<Palette, string> = Object.fromEntries(
  PALETTES.map((palette) => [palette, PALETTE_COLORS[palette].bg]),
) as Record<Palette, string>

export const applyPalette = (palette: Palette): void => {
  document.documentElement.dataset.palette = palette
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[palette])
  const secure = location.protocol === "https:" ? "; secure" : ""
  document.cookie = `${PALETTE_COOKIE.name}=${palette}; path=/; max-age=${PALETTE_COOKIE.maxAge}; samesite=lax${secure}`
}
