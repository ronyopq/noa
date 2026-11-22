// lib/whatsapp.ts — build WhatsApp prefill messages; open wa.me links in phone.
import { banglaAmountWords, formatBDT, toBnDigits } from '@/lib/utils'
import type { CartItem } from '@/lib/cart'

export function formatTotalLine(total: number): string {
  return `মোট: ${formatBDT(total)}`
}

export function formatWordsLine(total: number): string {
  const words = banglaAmountWords(total)
  return words ? `কথ়ায়: ${words} টাকা মাত্র।` : 'কথ়ায়: কোনো অঙ্ক নেই।'
}

export function buildWhatsAppMessage(input: {
  code: string
  items: CartItem[]
  discount?: number
  tax?: number
  serviceCharge?: number
  total: number
}): string {
  const lines: string[] = []
  lines.push(`অর্ডার কোড: ${input.code}`)
  lines.push('খাবার:')
  for (const item of input.items) {
    lines.push(
      `• ${item.name} × ${toBnDigits(item.qty)} — ${formatBDT(item.price * item.qty)}`,
    )
  }
  if (input.discount && input.discount > 0) {
    lines.push(`ছাড়: ${formatBDT(input.discount)}`)
  }
  if (input.tax && input.tax > 0) lines.push(`কর: ${formatBDT(input.tax)}`)
  if (input.serviceCharge && input.serviceCharge > 0) {
    lines.push(`সার্ভিস চার্জ: ${formatBDT(input.serviceCharge)}`)
  }
  lines.push(formatTotalLine(input.total))
  lines.push(formatWordsLine(input.total))
  return lines.join('\n')
}

// Opens the phone's WhatsApp app with the prefilled message.
export function openWhatsApp(phone: string, message: string): boolean {
  const digits = phone.replace(/[^0-9]/g, '')
  if (!digits) return false
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  try {
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  } catch {
    return false
  }
}
