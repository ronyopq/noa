// app/admin/cash-closing/page.tsx — admin-side cash closing (payments audit).
import { notFound } from 'next/navigation'
import { db } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'
import { formatBDT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CashClosingPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const payments = db.bills
    .where((b) => b.paymentStatus === 'paid')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const rows = payments.map((b) => ({
    id: b.id,
    order: b.orderId,
    ref: b.id,
    method: b.paymentMethod,
    amount: formatBDT(b.total),
    net: formatBDT(b.total - b.discount - b.tax - b.serviceCharge),
    status: b.paymentStatus,
    closedAt: b.printedAt ?? b.updatedAt,
    created: b.createdAt,
    discount: formatBDT(b.discount),
    tax: formatBDT(b.tax),
    serviceCharge: formatBDT(b.serviceCharge),
  }))

  return (
    <>
      <h1 style={{ fontWeight: 700, marginBottom: 16 }}>ক্যাশ ক্লোজিং — পেমেন্টস</h1>
      <AdminStripedTable
        headers={['অর্ডার', 'রেফ', 'পদ্ধতি', 'বাক্সসম', 'স্ট্যাটাস', 'ডিসকাউন্ট', 'চার্জ', 'নেট', 'সেটলেড অ্যাট', 'তৈরি হয়েছে', 'সেটলেড']}
        columns={[
          { label: 'অর্ডার', key: 'order', width: '8%' },
          { label: 'রেফ', key: 'ref', width: '8%' },
          { label: 'পদ্ধতি', key: 'method', width: '8%' },
          { label: 'বাক্সসম', key: 'amount', width: '10%' },
          { label: 'স্ট্যাটাস', key: 'status', width: '10%' },
          { label: 'ডিসকাউন্ট', key: 'discount', width: '8%' },
          { label: 'চার্জ', key: 'tax', width: '8%' },
          { label: 'নেট', key: 'net', width: '8%' },
          { label: 'সেটলেড', key: 'closedAt', width: '10%' },
          { label: 'তৈরি হয়েছে', key: 'created', width: '12%' },
          { label: 'সেটলেড', key: 'status', width: '10%' },
        ]}
        rows={rows}
        keyField="id"
        maxHeight="70vh"
      />
    </>
  )
}
