import { clsx, type ClassValue } from "clsx"
import { differenceInDays, isToday } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDeadline(deadline: Date): string {
  if (isToday(deadline)) return 'Today'
  const days = differenceInDays(deadline, new Date())
  return `${days} days`
}

export function isUrgent(deadline: Date): boolean {
  return differenceInDays(deadline, new Date()) <= 7
}

export function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50'
  if (score >= 50) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
