// lib/checkout.ts — public checkout client.
export interface CheckoutOrderResult {
  id: string
  code: string
  total: number
}

export type CheckoutResult =
  | {
      ok: true
      order: CheckoutOrderResult
      existing?: boolean
    }
  | {
      ok: false
      error: 'not_available' | 'price_changed' | 'no_items' | 'server_error'
      foodId?: string
      newTotal?: number
      changedItems?: { name: string; newPrice: number }[]
      warnings: string[]
    }

export interface CheckoutInput {
  restaurantId: string
  items: { foodId: string; qty?: number }[]
  customerName?: string
  customerPhone?: string
  note?: string
  source?: 'web' | 'whatsapp' | 'pos'
  idempotencyKey?: string
  discount?: number
  tax?: number
  serviceCharge?: number
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const res = await fetch('/api/orders/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: 'server_error', warnings: [body?.message ?? 'Server error'] }
  }
  return (await res.json()) as CheckoutResult
}
