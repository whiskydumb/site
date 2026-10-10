import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import {
  definePlugin,
  pluginFramesTexts,
  type AstroExpressiveCodeOptions,
  type ExpressiveCodePlugin,
} from "astro-expressive-code"
import { setInlineStyle } from "astro-expressive-code/hast"
import type { Palette } from "./palettes"

pluginFramesTexts.overrideTexts(undefined, { copyButtonCopied: "copied" })

const PLAIN_LANGS = "ansi,bash,console,powershell,ps,ps1,sh,shell,shellscript,shellsession,text,txt,zsh"

const CODE_THEMES = {
  rose: "rose-pine",
  seafoam: "everforest-dark",
  sage: "catppuccin-macchiato",
  periwinkle: "tokyo-night",
  lavender: "catppuccin-mocha",
} as const satisfies Record<Palette, string>

const paletteByTheme = new Map<string, string>(Object.entries(CODE_THEMES).map(([palette, theme]) => [theme, palette]))

const CODE_BACKGROUND = "var(--layer-1)"
const BAR_BACKGROUND = "var(--layer-2)"

const greatestCommonDivisor = (a: number, b: number): number => (b === 0 ? a : greatestCommonDivisor(b, a % b))

const leadingSpaces = (text: string): number => /^ */.exec(text)?.[0].length ?? 0

function pluginGuideStep(): ExpressiveCodePlugin {
  return definePlugin({
    name: "Guide Step",
    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        const step = codeBlock
          .getLines()
          .map((line) => leadingSpaces(line.text))
          .reduce(greatestCommonDivisor, 0)
        if (step >= 2) setInlineStyle(renderData.blockAst, "--guide-step", `${step}ch`)
      },
    },
  })
}

export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
  themes: Object.values(CODE_THEMES),
  themeCssSelector: (theme) => {
    const palette = paletteByTheme.get(theme.name)
    return palette ? `[data-palette='${palette}']` : false
  },
  useDarkModeMediaQuery: false,
  plugins: [pluginLineNumbers(), pluginGuideStep()],
  defaultProps: {
    wrap: true,
    showLineNumbers: true,
    overridesByLang: {
      [PLAIN_LANGS]: { showLineNumbers: false },
    },
  },
  styleOverrides: {
    codeFontFamily: "var(--font-mono)",
    codeFontSize: "0.9em",
    codeBackground: CODE_BACKGROUND,
    borderColor: "transparent",
    borderWidth: "0",
    borderRadius: "6px",
    gutterBorderWidth: "0px",
    uiFontFamily: "var(--font-sans)",
    lineNumbers: {
      foreground: "var(--muted)",
    },
    frames: {
      editorActiveTabForeground: "var(--muted)",
      editorActiveTabBackground: "transparent",
      editorActiveTabIndicatorBottomColor: "transparent",
      editorActiveTabIndicatorTopColor: "transparent",
      editorTabBorderRadius: "0",
      editorTabBarBackground: BAR_BACKGROUND,
      editorTabBarBorderBottomColor: "transparent",
      frameBoxShadowCssValue: "none",
      terminalBackground: CODE_BACKGROUND,
      terminalTitlebarBackground: BAR_BACKGROUND,
      terminalTitlebarBorderBottomColor: "transparent",
      terminalTitlebarForeground: "var(--muted)",
      terminalTitlebarDotsForeground: "var(--muted)",
      inlineButtonForeground: "var(--muted)",
      inlineButtonBorder: "var(--line)",
      tooltipSuccessBackground: "var(--accent)",
      tooltipSuccessForeground: "var(--bg)",
    },
  },
}
