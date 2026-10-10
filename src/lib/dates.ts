const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const

const SUFFIXES: Readonly<Record<number, string>> = { 1: "st", 2: "nd", 3: "rd" }

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return "th"
  return SUFFIXES[day % 10] ?? "th"
}

export interface PostDate {
  iso: string
  month: string
  day: number
  suffix: string
  year: number
}

export function postDate(date: Date): PostDate {
  const day = date.getUTCDate()
  return {
    iso: date.toISOString().slice(0, 10),
    month: MONTHS[date.getUTCMonth()] ?? "",
    day,
    suffix: ordinal(day),
    year: date.getUTCFullYear(),
  }
}
