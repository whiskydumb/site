export const PALETTES = ["rose", "seafoam", "sage", "periwinkle", "lavender"] as const

export type Palette = (typeof PALETTES)[number]

export const DEFAULT_PALETTE: Palette = "rose"

export const PALETTE_ACCENTS: Record<Palette, { accent: string; accent2: string }> = {
  rose: { accent: "#f2b8c8", accent2: "#db2777" },
  seafoam: { accent: "#95cdb9", accent2: "#64b59c" },
  sage: { accent: "#9ed3ae", accent2: "#a99bd8" },
  periwinkle: { accent: "#9a9ae0", accent2: "#5e5db8" },
  lavender: { accent: "#d0bcff", accent2: "#ffc234" },
}
