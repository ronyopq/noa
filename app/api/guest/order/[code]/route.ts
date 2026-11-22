// app/api/guest/order/[code]/route.ts — guest order status tracking.
// Requires the order code; an optional separate guest access token is also checked.
import { db } from '@/db/store'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  const { code } = await params
  const order = db.orders.findOne((o) => o.code === code)
  if (!order) return json({ ok: false, error: 'not_found' }, 404)

  const url = new URL(req.url)
  const token = url.searchParams.get('token') ?? undefined
  if (order.guestToken && token && order.guestToken !== token) {
    return json({ ok: false, error: 'forbidden' }, 403)
  }

  return json({
    ok: true,
    order: {
      code: order.code,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.foodName,
        qty: item.qty,
        price: item.price,
      })),
    },
  })
}
