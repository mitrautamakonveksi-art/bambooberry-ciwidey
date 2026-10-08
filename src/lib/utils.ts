import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLogicalShiftDate(): Date {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  const isEarlyMorning = hours < 8 || (hours === 8 && minutes < 30)
  
  if (isEarlyMorning) {
    now.setDate(now.getDate() - 1)
  }
  
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}
