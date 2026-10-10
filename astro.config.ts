import { satteri } from "@astrojs/markdown-satteri"
import mdx from "@astrojs/mdx"
import expressiveCode from "astro-expressive-code"
import { defineConfig, fontProviders } from "astro/config"
import { expressiveCodeOptions } from "./src/lib/expressive-code"
import { externalLinks } from "./src/lib/external-links"
import { figures } from "./src/lib/figures"
import { tableScroll } from "./src/lib/table-scroll"

const SITE = "https://whisky.sh"

const PLEX_MONO_SUBSETS = {
  latin: [
    "U+0000-00FF",
    "U+0131",
    "U+0152-0153",
    "U+02BB-02BC",
    "U+02C6",
    "U+02DA",
    "U+02DC",
    "U+0304",
    "U+0308",
    "U+0329",
    "U+2000-206F",
    "U+20AC",
    "U+2122",
    "U+2191",
    "U+2193",
    "U+2212",
    "U+2215",
    "U+FEFF",
    "U+FFFD",
  ],
  cyrillic: ["U+0301", "U+0400-045F", "U+0490-0491", "U+04B0-04B1", "U+2116"],
} as const

const plexMonoVariants = (["400", "600"] as const).flatMap((weight) =>
  (["normal", "italic"] as const).flatMap((style) =>
    Object.entries(PLEX_MONO_SUBSETS).map(([subset, ranges]) => ({
      src: [`./node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-${subset}-${weight}-${style}.woff2`] as [string],
      weight,
      style,
      unicodeRange: [...ranges] as [string, ...string[]],
    })),
  ),
)

const [firstPlexMonoVariant, ...restPlexMonoVariants] = plexMonoVariants
if (!firstPlexMonoVariant) throw new Error("ibm plex mono: no font variants configured")

export default defineConfig({
  site: SITE,
  integrations: [expressiveCode(expressiveCodeOptions), mdx()],
  markdown: {
    processor: satteri({ hastPlugins: [tableScroll, figures, externalLinks(SITE)] }),
  },
  fonts: [
    {
      provider: fontProviders.npm(),
      name: "IBM Plex Sans Variable",
      cssVariable: "--font-plex-sans",
      options: { package: "@fontsource-variable/ibm-plex-sans" },
      weights: ["100 700"],
      styles: ["normal"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.local(),
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      options: { variants: [firstPlexMonoVariant, ...restPlexMonoVariants] },
      fallbacks: ["ui-monospace", "Consolas", "monospace"],
    },
  ],
})
