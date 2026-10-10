import { defineHastPlugin } from "satteri"

const isExternal = (href: string, siteHost: string): boolean => {
  if (!/^https?:\/\//i.test(href) || !URL.canParse(href)) return false
  const { hostname } = new URL(href)
  return hostname !== siteHost && !hostname.endsWith(`.${siteHost}`)
}

export const externalLinks = (site: string) => {
  const siteHost = new URL(site).hostname
  return defineHastPlugin({
    name: "external-links",
    element: {
      filter: ["a"],
      visit(link, ctx) {
        const { href } = link.properties
        if (typeof href !== "string" || !isExternal(href, siteHost)) return
        ctx.setProperty(link, "target", "_blank")
        ctx.setProperty(link, "rel", "noopener")
      },
    },
  })
}
