// lib/utils.ts — pure helpers: Bangla digits/words, BDT formatting, misc.

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function toBnDigits(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + String(Math.abs(Math.round(n)))
    .split('')
    .map((d) => BN_DIGITS[+d] ?? d)
    .join('')
}

// ৳৬৩০ — Bengali-digit formatted BDT price.
export function formatBDT(amount: number): string {
  return `৳${toBnDigits(amount)}`
}

export function formatDigits(amount: number): string {
  return toBnDigits(amount)
}

const ONES: Record<number, string> = {
  1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়',
  7: 'সাত', 8: 'আট', 9: 'নয়',
}
const TEENS: Record<number, string> = {
  10: 'দশ', 11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চোদ্দো',
  15: 'পনেরো', 16: 'ষোলো', 17: 'সত্রো', 18: 'আঠারো', 19: 'উনিশ',
}
const TENS: Record<number, string> = {
  20: 'বিশ', 30: 'ত্রিশ', 40: 'চল্লিশ', 50: 'পঞ্চাশ', 60: 'ষাট',
  70: 'সপ্তাশ', 80: 'আশি', 90: 'নব্বই',
}
const HUNDREDS: Record<number, string> = {
  1: 'একশ', 2: 'দুইশ', 3: 'তিনশ', 4: 'চারশ', 5: 'পাঁচশ', 6: 'ছয়শ',
  7: 'সাতশো', 8: 'আটশ', 9: 'নয়শ',
}
const LAKHS: Record<number, string> = {
  1: 'এক লক্ষ', 2: 'দুই লক্ষ', 3: 'তিন লক্ষ', 4: 'চার লক্ষ',
  5: 'পাঁচ লক্ষ', 6: 'ছয় লক্ষ', 7: 'সাত লক্ষ', 8: 'আট লক্ষ',
  9: 'নয় লক্ষ',
}

function below1000(n: number): string {
  const parts: string[] = []
  if (n >= 100) {
    const h = Math.floor(n / 100)
    parts.push(HUNDREDS[h] ?? `${h}শ`)
    n -= h * 100
  }
  if (n >= 20) {
    const t = Math.floor(n / 10) * 10
    const o = n % 10
    if (o === 0) parts.push(TENS[t])
    else parts.push(`${TENS[t]} ${ONES[o] ?? o}`)
  } else if (n >= 10) {
    parts.push(TEENS[n])
  } else if (n >= 1) {
    parts.push(ONES[n])
  }
  return parts.filter(Boolean).join(' ')
}

// Bangla number to words: 630 → "ছয়শ ত্রিশ"
export function numberToBanglaWords(n: number): string {
  if (!Number.isFinite(n)) return ''
  if (n === 0) return 'শূন্য'
  const num = Math.abs(n)
  const parts: string[] = []
  const lacks = Math.floor(num / 100000)
  if (lacks > 0) parts.push(LAKHS[lacks] ?? `${lacks} লক্ষ`)
  const rest = num % 100000
  if (rest >= 1000) {
    const thousands = Math.floor(rest / 1000)
    const thousandWords = below1000(thousands)
    parts.push(`${thousandWords} হাজার`)
    const rem = below1000(rest % 1000)
    if (rem) parts.push(rem)
  } else {
    const words = below1000(rest)
    if (words) parts.push(words)
  }
  return parts.filter(Boolean).join(' ')
}

// WhatsApp amount phrase: "ছয়শ ত্রিশ টাকা" / empty string when zero
export function banglaAmountWords(amount: number): string {
  const words = numberToBanglaWords(amount)
  return words ? `${words} টাকা` : ''
}

export function truncate(text: string, max = 160): string {
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// slug helper for URL-safe identifiers (used for public food/menu links where needed)
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function randomHex(bytes = 16): string {
  return [...globalThis.crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
