import { PALETTE_COLORS, PALETTES } from "./palettes"

const SCALE = 2

const ARROW = ["OO.....", "OPO....", "OWLO...", "OWPLO..", "OWWLLO.", "OWWPLLO", "OWWOOO.", "OWO....", "OOO...."]

const HAND = [
  ".OO.....",
  ".OWO....",
  ".OWO....",
  ".OWO....",
  "OOLWOOO.",
  "OWPWWOLO",
  "OWLWWWWO",
  "OWWWWWWO",
  ".OWWWPLO",
  "..OOOOOO",
]

type Shade = "O" | "W" | "P" | "L"

interface Sprite {
  readonly pixels: readonly string[]
  readonly hotspot: readonly [number, number]
  readonly fallback: string
}

const SPRITES = {
  default: { pixels: ARROW, hotspot: [0, 0], fallback: "auto" },
  pointer: { pixels: HAND, hotspot: [2, 0], fallback: "pointer" },
} as const satisfies Record<string, Sprite>

const rowPath = (row: string, y: number, shade: Shade): string => {
  let path = ""
  let x = 0
  while (x < row.length) {
    if (row[x] !== shade) {
      x++
      continue
    }
    const start = x
    while (row[x] === shade) x++
    path += `M${start} ${y}h${x - start}v1h${start - x}z`
  }
  return path
}

const encodeSvg = (svg: string): string =>
  svg.replaceAll('"', "'").replaceAll("#", "%23").replaceAll("<", "%3C").replaceAll(">", "%3E")

const cursorValue = ({ pixels, hotspot, fallback }: Sprite, colors: Record<Shade, string>): string => {
  const width = pixels[0]?.length ?? 0
  const height = pixels.length
  const paths = (Object.keys(colors) as Shade[])
    .map((shade) => {
      const path = pixels.map((row, y) => rowPath(row, y, shade)).join("")
      return path ? `<path fill="${colors[shade]}" d="${path}"/>` : ""
    })
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * SCALE}" height="${height * SCALE}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${paths}</svg>`
  const [hotspotX, hotspotY] = hotspot
  return `url("data:image/svg+xml,${encodeSvg(svg)}") ${hotspotX * SCALE} ${hotspotY * SCALE}, ${fallback}`
}

export const cursorCss = (): string =>
  PALETTES.map((palette) => {
    const { accent, accent2 } = PALETTE_COLORS[palette]
    const colors = { O: "#000000", W: "#ffffff", P: accent, L: accent2 }
    return `[data-palette="${palette}"] {\n  --cursor-default: ${cursorValue(SPRITES.default, colors)};\n  --cursor-pointer: ${cursorValue(SPRITES.pointer, colors)};\n}\n`
  }).join("\n")
