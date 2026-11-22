// app/admin/specials/page.tsx — specials overview (integrated specials in admin).
import { notFound } from 'next/navigation'
import { Add, ArrowBack, Refresh } from '@mui/icons-material'
import { db, nextId, now } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'

export const dynamic = 'force-dynamic'

interface SpecialRow {
  id: string
  name: string
  foodIds: string
  from: string
  to: string
}

export default async function SpecialsPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const specials = db.specials
    .where((s) => s.restaurantId === restaurant.id)

  const rows: SpecialRow[] = specials.map((s) => ({
    id: s.id,
    name: s.name,
    foodIds: s.foodIds.join(', '),
    from: s.from ?? '',
    to: s.to ?? '',
  }))

  const columns = [
    { label: 'স্পেশাল নাম', key: 'name', width: '2fr' },
    { label: 'ফুডস্ (সব)', key: 'foodIds', width: '3fr' },
    { label: 'সক্রিয় অ্যাট', key: 'from', width: '1fr' },
    { label: 'সক্রিয় থেকে', key: 'to', width: '1fr' },
    { label: 'আইডি', key: 'id', width: '1fr', center: true },
  ]

  return (
    <>
      <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, marginBottom: 24 }}>
        স্পেশালস
        <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, fontWeight: 500 }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={buttonStyle}
            aria-label="রিফ্রেশ"
          >
            <Refresh fontSize="small" />
            রিফ্রেশ
          </button>
          <button
            type="button"
            onClick={() => {
              const newSpecial = {
                id: nextId('special'),
                restaurantId: restaurant.id,
                name: 'নতুন স্পেশাল',
                foodIds: [],
                order: 0,
                isActive: true,
                createdAt: now(),
                updatedAt: now(),
              }
              const specialsCollection = db.specials as unknown as { push(item: unknown): void }
              specialsCollection.push(newSpecial)
              window.location.reload()
            }}
            style={buttonStyle}
          >
            <Add fontSize="small" />
            নতুন স্পেশাল
          </button>
        </span>
      </h1>

      <div>
        <AdminStripedTable
          headers={['স্পেশাল নাম', 'ফুডস্ (সব)', 'সক্রিয় অ্যাট', 'সক্রিয় থেকে', 'আইডি']}
          columns={columns}
          rows={rows}
          keyField="id"
          maxHeight="70vh"
          toolbarActions={[{ label: 'আপডেট স্পেশালস', icon: <Refresh />, onClick: () => window.location.reload() }]}
        />
      </div>
    </>
  )
}

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontWeight: 600,
  background: 'none',
  border: '1px solid #eae7e2',
  borderRadius: '8px',
  padding: '4px 10px',
  paddingHorizontal: '10px',
  cursor: 'pointer',
} as const
