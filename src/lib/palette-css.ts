import { DEFAULT_PALETTE, PALETTE_COLORS, PALETTES, type Palette, type PaletteColors } from "./palettes"

const CSS_VARIABLES: Record<keyof PaletteColors, string> = {
  bg: "--bg",
  surface: "--surface",
  line: "--line",
  fg: "--fg",
  muted: "--muted",
  accent: "--accent",
  accent2: "--accent-2",
}

const selector = (palette: Palette): string =>
  palette === DEFAULT_PALETTE ? `:root,\n[data-palette="${palette}"]` : `[data-palette="${palette}"]`

const declarations = (colors: PaletteColors): string =>
  (Object.keys(CSS_VARIABLES) as (keyof PaletteColors)[])
    .map((key) => `  ${CSS_VARIABLES[key]}: ${colors[key]};`)
    .join("\n")

export const paletteCss = (): string =>
  PALETTES.map((palette) => `${selector(palette)} {\n${declarations(PALETTE_COLORS[palette])}\n}`).join("\n\n")
