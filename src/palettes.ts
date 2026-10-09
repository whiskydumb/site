export const PALETTES = ["rose", "seafoam", "sage", "periwinkle", "lavender"] as const

export type Palette = (typeof PALETTES)[number]

export const DEFAULT_PALETTE: Palette = "rose"
