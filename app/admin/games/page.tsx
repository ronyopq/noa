// app/admin/games/page.tsx — games browser/playbook (assets for games).
import { notFound } from 'next/navigation'
import { db, nextId, now } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import AdminStripedTable from '@/components/AdminStripedTable'
import { Add, ArrowBack, Refresh } from '@mui/icons-material'
import { can } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface GameRow {
  id: string
  name: string
  status: string
  stageOrder: string
  themeVersion: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

export default async function GamesPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const games = db.games
    .where((g) => g.restaurantId === restaurant.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const rows: GameRow[] = games.map((g) => ({
    id: g.id,
    name: g.name,
    status: g.isPublished ? 'published' : 'draft',
    stageOrder: String(g.stageOrder),
    themeVersion: g.themeVersion,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    deletedAt: g.updatedAt,
  }))

  return (
    <>
      <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, marginBottom: 16 }}>
        গেমস
        <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, fontWeight: 500 }}>
          <button type="button" onClick={() => window.location.reload()} style={buttonStyle} aria-label="রিফ্রেশ">
            <Refresh fontSize="small" />
            রিফ্রেশ
          </button>
          {can(staff, 'games:add') ? (
            <button
              type="button"
              onClick={() => {
                const newGame = {
                  id: nextId('game'),
                  restaurantId: restaurant.id,
                  name: 'নতুন গেম',
                  coverImage: '',
                  assets: [],
                  description: '',
                  isPublished: false,
                  stageOrder: 0,
                  themeVersion: 'v1.0.0',
                  createdAt: now(),
                  updatedAt: now(),
                }
                const gamesCollection = db.games as unknown as { push(item: unknown): void }
                gamesCollection.push(newGame)
                window.location.reload()
              }}
              style={buttonStyle}
            >
              <Add fontSize="small" />
              নতুন গেম
            </button>
          ) : null}
        </span>
      </h1>

      <div>
        <AdminStripedTable
          headers={['নাম', 'স্ট্যাটাস', 'ডিভেলপার আইডি', 'তৈরি হয়েছে', 'আপডেট', 'পাবলিশ', 'আইডি']}
          columns={[
            { label: 'নাম', key: 'name', width: '20%' },
            { label: 'স্ট্যাটাস', key: 'status', width: '10%' },
            { label: 'স্টেজ', key: 'stageOrder', width: '5%' },
            { label: 'তৈরি হয়েছে', key: 'createdAt', width: '10%' },
            { label: 'আপডেট', key: 'updatedAt', width: '10%' },
            { label: 'পাবলিশ', key: 'isPublished', width: '5%' },
            { label: 'আইডি', key: 'id', width: '10%' },
          ]}
          rows={rows}
          keyField="id"
          maxHeight="70vh"
          rowActions={[
            { label: 'সংযুক্ষ ভিউ', icon: <ArrowBack />, tooltip: 'সংযুক্ষ ভিউ', onClick: (row: any) => (window.location.href = `/admin/games/${encodeURIComponent(row.id)}`) },
            { label: 'প্লে লিংক', icon: <ArrowBack />, tooltip: 'প্লে লিংক', onClick: (row: any) => (window.location.href = `/play/${encodeURIComponent(row.id)}`) },
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
