// app/admin/settings/page.tsx — staff account management (admin side).
import { notFound } from 'next/navigation'
import { db } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'
import { can } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const staffMemberships = db.staffMemberships
    .where((s) => s.restaurantId === restaurant.id)
    .sort((a, b) => a.id.localeCompare(b.id))

  const rows = staffMemberships.map((m) => ({
    id: m.id,
    name: (db.users.find(m.userId) ?? { name: m.userId, role: m.role, phone: '' }).name,
    role: m.role,
    phone: db.users.find(m.userId)?.phone ?? '',
    email: db.users.find(m.userId)?.email ?? '',
    status: m.status,
    joinedAt: m.joinedAt,
    updatedAt: m.updatedAt,
  }))

  return (
    <>
      <h1 style={{ fontWeight: 700, marginBottom: 16 }}>স্টাফ প্যানেল</h1>
      <div>
        <AdminStripedTable
          headers={['নাম', 'রোল', 'ফোন', 'ইমেল', 'স্ট্যাটাস', 'জয়েন্ড', 'আপডেট', 'আইডি']}
          columns={[
            { label: 'নাম', key: 'name', width: '20%' },
            { label: 'রোল', key: 'role', width: '10%' },
            { label: 'ফোন', key: 'phone', width: '12%' },
            { label: 'ইমেল', key: 'email', width: '18%' },
            { label: 'স্ট্যাটাস', key: 'status', width: '8%' },
            { label: 'জয়েন্ড', key: 'joinedAt', width: '10%' },
            { label: 'আপডেট', key: 'updatedAt', width: '10%' },
            { label: 'আইডি', key: 'id', width: '10%' },
          ]}
          rows={rows}
          keyField="id"
          maxHeight="70vh"
          toolbarActions={[
            { label: 'নতুন স্টাফ', onClick: () => (window.location.href = `/admin/staff/create/${encodeURIComponent(restaurant.slug)}`) },
          ]}
        />
      </div>
    </>
  )
}
