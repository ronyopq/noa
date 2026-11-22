// app/api/orders/checkout/route.ts — public checkout:
// validates server-side prices/availability, creates an order, returns idempotently.
import { randomBytes } from 'node:crypto'
import { db, createOrderCode, nextId, now, publicFoods } from '@/db/store'
import type { Order, OrderItem } from '@/db/types'

interface Body {
  restaurantId: string
  items: { foodId: string; qty?: number; price?: number }[]
  customerName?: string
  customerPhone?: string
  note?: string
  source?: 'web' | 'whatsapp' | 'pos'
  idempotencyKey?: string
  discount?: number
  tax?: number
  serviceCharge?: number
}

export async function POST(req: Request): Promise<Response> {
  let body: Body = { restaurantId: '', items: [] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json', warnings: [] }, { status: 400 })
  }

  const restaurant = db.restaurants.find(typeof body.restaurantId === 'string' ? body.restaurantId : '')
  if (!restaurant) {
    return Response.json({ ok: false, error: 'not_found', warnings: [] }, { status: 404 })
  }

  const rawItems = Array.isArray(body.items) ? body.items : []
  if (rawItems.length === 0) {
    return Response.json({ ok: false, error: 'no_items', warnings: [] }, { status: 400 })
  }

  // Idempotency: same checkout retry → same order (master: transaction + unique constraint).
  if (typeof body.idempotencyKey === 'string' && body.idempotencyKey) {
    const existing = db.orders.findOne((o) => o.idempotencyKey === body.idempotencyKey)
    if (existing) {
      return Response.json({
        ok: true,
        existing: true,
        order: { id: existing.id, code: existing.code, total: existing.total },
      })
    }
  }

  // Server-validated snapshot: current price + availability.
  const at = new Date()
  const foods = publicFoods(restaurant.id, at)

  // 1. Availability: all foods must be published + available today.
  const notAvailable: { name: string; foodId: string }[] = []
  for (const raw of rawItems) {
    const food = foods.find((f) => f.id === raw.foodId)
    if (!food || !food.available) {
      notAvailable.push({ name: food?.name ?? String(raw.foodId ?? ''), foodId: String(raw.foodId ?? '') })
    }
  }
  if (notAvailable.length > 0) {
    return Response.json(
      {
        ok: false,
        error: 'not_available',
        warnings: ['কিছু খাবার আপাতত পাওয়া যায়নি, কার্ট থেকে সরান।'],
        items: notAvailable,
      },
      { status: 200 },
    )
  }

  // 2. Price validation: server current price re-checked against the cart price.
  const changedItems: { name: string; newPrice: number }[] = []
  const orderItems: OrderItem[] = []
  for (const raw of rawItems) {
    const food = foods.find((f) => f.id === raw.foodId)!
    const qty = Math.max(1, Math.floor(typeof raw.qty === 'number' && Number.isFinite(raw.qty) ? raw.qty : 1))
    if (typeof raw.price === 'number' && Math.abs(raw.price - food.price) > 0.009) {
      changedItems.push({ name: food.name, newPrice: food.price })
    }
    orderItems.push({
      id: nextId('OI', 6),
      orderId: '',
      foodId: food.id,
      foodName: food.name,
      price: food.price,
      qty,
      discount: 0,
      createdAt: now(),
    })
  }

  if (changedItems.length > 0) {
    const newTotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    return Response.json(
      {
        ok: false,
        error: 'price_changed',
        warnings: [`মেনুর দাম পরিবর্তন: ${changedItems.length}টি খাবারের দাম বদলেছে।`],
        newTotal,
        changedItems,
      },
      { status: 200 },
    )
  }

  // 3. Totals.
  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)
  const discount = Math.min(typeof body.discount === 'number' && Number.isFinite(body.discount) ? Math.max(0, body.discount) : 0, subtotal)
  const tax = typeof body.tax === 'number' && Number.isFinite(body.tax) ? Math.max(0, body.tax) : 0
  const serviceCharge = typeof body.serviceCharge === 'number' && Number.isFinite(body.serviceCharge) ? Math.max(0, body.serviceCharge) : 0
  const total = subtotal - discount + tax + serviceCharge

  // 4. Create the order with a unique code (master: XXX-YYMMXXXX).
  const order: Order = {
    id: nextId('ORD', 6),
    code: createOrderCode(restaurant),
    idempotencyKey: body.idempotencyKey ?? randomBytes(8).toString('hex'),
    restaurantId: restaurant.id,
    status: 'pending',
    source: body.source === 'pos' ? 'pos' : body.source === 'whatsapp' ? 'whatsapp' : 'web',
    customerName: typeof body.customerName === 'string' && body.customerName.trim() ? body.customerName.trim() : undefined,
    customerPhone: typeof body.customerPhone === 'string' && body.customerPhone.trim() ? body.customerPhone.trim() : undefined,
    customerNote: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined,
    items: orderItems.map((item) => ({ ...item, orderId: order.id })),
    subtotal,
    discount,
    tax,
    serviceCharge,
    total,
    paymentMethod: 'none',
    paymentStatus: 'pending',
    guestToken: randomBytes(8).toString('hex'),
    createdAt: now(),
    updatedAt: now(),
  }
  db.orders.add(order)

  return Response.json({
    ok: true,
    order: { id: order.id, code: order.code, total: order.total },
    warnings: [],
  })
}
