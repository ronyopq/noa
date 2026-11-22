// app/admin/heroes/page.tsx — hero management (src 1.0.3 CLI).
import { notFound } from 'next/navigation'
import { db, nextId, now } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import { Add, ArrowBack, CheckCircleOutlined, Delete, Edit, Refresh } from '@mui/icons-material'
import AdminStripedTable from '@/components/AdminStripedTable'

export const dynamic = 'force-dynamic'

interface HeroRow {
  id: string
  title: string
  images: string
  order: string
  isPublished: string
  portalPath: string
}

export default async function HeroesPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const heroes = db.heroes
    .where((h) => h.restaurantId === restaurant.id)
    .sort((a, b) => a.order - b.order)

  const columns = [
    { label: 'হিরো টাইটেল', key: 'title', width: '3fr' },
    { label: 'ছবি (সব)', key: 'images', width: '2fr' },
    { label: 'স্ট্যাটাস', key: 'isPublished', width: '1fr', center: true },
    { label: 'পোর্টাল লিংক', key: 'portalPath', width: '2fr' },
    { label: 'আইডি', key: 'id', width: '1fr', center: true },
  ]

  const rows: HeroRow[] = heroes.map((h) => ({
    id: h.id,
    title: h.title,
    images: h.images.join(', '),
    order: String(h.order),
    isPublished: h.isPublished ? 'published' : 'draft',
    portalPath: `/hero/${encodeURIComponent(h.id)}`,
  }))

  return (
    <>
      <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, marginBottom: 24 }}>
        হিরোস
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
              const newHero = {
                id: nextId('hero'),
                restaurantId: restaurant.id,
                title: 'নতুন হিরো',
                images: [] as string[],
                order: 0,
                isPublished: true,
                createdAt: now(),
                updatedAt: now(),
              }
              const heroicCollection = db.heroes as unknown as { push(item: unknown): void }
              heroicCollection.push(newHero)
              window.location.reload()
            }}
            style={buttonStyle}
          >
            <Add fontSize="small" />
            নতুন হিরো
          </button>
        </span>
      </h1>

      <div>
        <AdminStripedTable
          headers={['হিরো টাইটেল', 'ছবি (সব)', 'স্ট্যাটাস', 'পোর্টাল লিংক', 'আইডি']}
          columns={columns}
          rows={rows}
          keyField="id"
          maxHeight="70vh"
          toolbarActions={[{ label: 'আপডেট হিরোস', icon: <Refresh />, onClick: () => window.location.reload() }]}
          rowActions={[
            {
              label: 'সংযুক্ষ ভিউ',
              icon: <ArrowBack />,
              tooltip: 'সংযুক্ষ ভিউ',
              onClick: (row: any) =>
                (window.location.href = `/admin/heroes/${encodeURIComponent(restaurant.slug)}/${encodeURIComponent(row.id)}`),
            },
            {
              label: 'সংযুক্ষ আপডেট',
              icon: <Edit />,
              tooltip: 'সংযুক্ষ আপডেট',
              onClick: (row: any) =>
                (window.location.href = `/admin/heroes/${encodeURIComponent(restaurant.slug)}/${encodeURIComponent(row.id)}/edit`),
            },
            {
              label: 'সংযুক্ষ পাবলিশ',
              icon: <CheckCircleOutlined />,
              tooltip: 'সংযুক্ষ পাবলিশ',
              onClick: (row: any) =>
                (window.location.href = `/admin/heroes/${encodeURIComponent(restaurant.slug)}/${encodeURIComponent(row.id)}/publish`),
            },
            {
              label: 'মুছুন',
              icon: <Delete />,
              tooltip: 'মুছুন',
              color: 'error',
              onClick: (row: any) => {
                db.heroes.remove(row.id)
                window.location.reload()
              },
            },
          ]}
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
