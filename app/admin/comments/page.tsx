// app/admin/comments/page.tsx — comments moderation (integrated into admin).
import { notFound } from 'next/navigation'
import { db } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'

export const dynamic = 'force-dynamic'

export default async function CommentsPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const comments = db.comments
    .where((c) => c.restaurantId === restaurant.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const rows = comments.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.comment.slice(0, 30) + (c.comment.length > 30 ? '…' : ''),
    body: c.comment,
    status: c.status,
    createdAt: c.createdAt,
    phone: c.phone,
  }))

  return (
    <>
      <h1 style={{ fontWeight: 700, marginBottom: 16 }}>কমেন্টস</h1>
      <AdminStripedTable
        headers={['নাম', 'কমেন্ট', 'স্ট্যাটাস', 'ফোন', 'সময়', 'বডি']}
        columns={[
          { label: 'নাম', key: 'name', width: '12%' },
          { label: 'কমেন্ট', key: 'subject', width: '30%' },
          { label: 'স্ট্যাটাস', key: 'status', width: '12%' },
          { label: 'ফোন', key: 'phone', width: '12%' },
          { label: 'সময়', key: 'createdAt', width: '15%' },
          { label: 'বডি', key: 'body', width: '25%' },
        ]}
        rows={rows}
        keyField="id"
        maxHeight="70vh"
        interactive
      />
    </>
  )
}
