import { GUESTBOOK_IP_SECRET } from "astro:env/server"

const encoder = new TextEncoder()

const hmacKey = crypto.subtle.importKey(
  "raw",
  encoder.encode(GUESTBOOK_IP_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
)

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("")

export const hashIp = async (ip: string): Promise<string> =>
  toHex(await crypto.subtle.sign("HMAC", await hmacKey, encoder.encode(ip)))
