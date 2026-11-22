// app/admin/reports/page.tsx — admin reports (orders/revenue/sales summary).
import { notFound } from 'next/navigation'
import { db } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'
import { formatBDT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface SalesRow {
  id: string
  code: string
  total: string
  status: string
  date: string
  closedAt: string
}

export default async function ReportsPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const bills = db.bills
    .where((b) => b.paymentStatus === 'paid')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const rows: SalesRow[] = bills.map((b) => ({
    id: b.id,
    code: b.id,
    total: formatBDT(b.total),
    status: b.paymentStatus,
    date: b.createdAt.slice(0, 10),
    closedAt: b.printedAt ?? b.updatedAt,
  }))

  return (
    <>
      <h1 style={{ fontWeight: 700, marginBottom: 16 }}>রিপোর্টস — সেলস অডিট</h1>
      <AdminStripedTable
        headers={['কোড', 'স্ট্যাটাস', 'দিন', 'ক্লোজড অ্যাট', 'অ্যামাউন্ট']}
        columns={[
          { label: 'কোড', key: 'code', width: '20%' },
          { label: 'স্ট্যাটাস', key: 'status', width: '20%' },
          { label: 'দিন', key: 'date', width: '20%' },
          { label: 'ক্লোজড অ্যাট', key: 'closedAt', width: '20%' },
          { label: 'অ্যামাউন্ট', key: 'total', width: '20%' },
        ]}
        rows={rows}
        keyField="id"
        maxHeight="70vh"
      />
    </>
  )
}
