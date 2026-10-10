import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLogicalShiftDate(baseDate: Date = new Date()): Date {
  // Hitung waktu dalam zona waktu Asia/Jakarta (WIB: UTC+7)
  const jakartaFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = jakartaFormatter.formatToParts(baseDate)
  let year = 1970, month = 1, day = 1, hours = 0, minutes = 0

  for (const part of parts) {
    if (part.type === "year") year = parseInt(part.value, 10)
    if (part.type === "month") month = parseInt(part.value, 10) - 1
    if (part.type === "day") day = parseInt(part.value, 10)
    if (part.type === "hour") hours = parseInt(part.value, 10)
    if (part.type === "minute") minutes = parseInt(part.value, 10)
  }

  // Shift cut-off: Sebelum 08:30 WIB dihitung shift hari kemarin
  const targetDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  const isEarlyMorning = hours < 8 || (hours === 8 && minutes < 30)

  if (isEarlyMorning) {
    targetDate.setUTCDate(targetDate.getUTCDate() - 1)
  }

  return targetDate
}
