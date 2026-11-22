// app/admin/pos/page.tsx — admin-side POS (transactions, status counting).
import { notFound } from 'next/navigation'
import { db } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'
import { formatBDT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PosPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const bills = db.bills
    .where((b) => b.orderId !== '')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const rows = bills.map((b) => ({
    id: b.id,
    order: b.orderId,
    code: b.id,
    table: '—',
    status: b.paymentStatus,
    items: String(b.lineItems.length),
    total: formatBDT(b.total),
    staff: b.orderId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }))

  return (
    <>
      <h1 style={{ fontWeight: 700, marginBottom: 16 }}>POS — {restaurant.name}</h1>
      <AdminStripedTable
        headers={['কোড', 'স্ট্যাটাস', 'আইটেমস্', 'আমাউন্ট', 'তৈরি হয়েছে', 'আপডেট']}
        columns={[
          { label: 'কোড', key: 'code', width: '15%' },
          { label: 'অর্ডার', key: 'order', width: '15%' },
          { label: 'স্ট্যাটাস', key: 'status', width: '10%' },
          { label: 'আইটেমস্', key: 'items', width: '5%' },
          { label: 'আমাউন্ট', key: 'total', width: '10%' },
          { label: 'তৈরি হয়েছে', key: 'createdAt', width: '20%' },
          { label: 'আপডেট', key: 'updatedAt', width: '20%' },
        ]}
        rows={rows}
        keyField="id"
        maxHeight="70vh"
      />
    </>
  )
}
