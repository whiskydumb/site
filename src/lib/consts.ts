export const SITE = {
  title: "whisky",
  description: "",
} as const

export interface SocialLink {
  label: string
  href: string
}

export const LINKS: readonly SocialLink[] = [
  { label: "github", href: "https://github.com/whiskydumb" },
  { label: "gitlab", href: "https://gitlab.com/whisky.sh" },
  { label: "bluesky", href: "https://bsky.app/profile/whisky.sh" },
]

export const COUNTER = {
  origin: "https://counter.whisky.sh",
  name: "whisky.sh",
  pad: 6,
} as const
