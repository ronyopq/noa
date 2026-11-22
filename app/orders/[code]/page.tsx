import { db } from '@/db/store'
import OrderStatusPanel from '@/components/OrderStatusPanel'

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { code } = await params
  const { token } = await searchParams
  const order = db.orders.findOne((o) => o.code === code)
  if (!order) {
    return (
      <main>
        <h1>অর্ডার পাওয়া যায়নি</h1>
        <p>অর্ডার কোডটি সঠিক আছে কি?</p>
      </main>
    )
  }
  return (
    <main>
      <OrderStatusPanel initial={{ code: order.code, status: order.status, total: order.total, items: order.items.map((i) => ({ name: i.foodName, qty: i.qty })) }} token={token} />
    </main>
  )
}
