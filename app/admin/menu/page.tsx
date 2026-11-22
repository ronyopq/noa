// app/admin/menu/page.tsx — menu CRUD: categories, foods, specials overview.
import { notFound } from 'next/navigation'
import { db } from '@/db/store'
import { requireStaff } from '@/lib/auth'
import { Add, ArrowBack, Delete, Edit, Refresh, Settings } from '@mui/icons-material'
import AdminStripedTable from '@/components/AdminStripedTable'
import { menuLinks, formatSpecialsInput, loadMenuLinks } from '@/lib/menu-links'

export const dynamic = 'force-dynamic'

interface MenuLinkRow {
  id: string
  catName: string
  name: string
  updated: string
  status: string
}

interface SpecialsRow {
  id: string
  name: string
  foods: string
  status: string
}

export default async function MenuPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  // Server-side data fetch
  const menuLinksList = menuLinks(restaurant.id)
  const links = await loadMenuLinks(restaurant.id)
  const specials = await formatSpecialsInput(db.specials.where((s) => s.restaurantId === restaurant.id))

  const menuRows: MenuLinkRow[] = links.map((link: any) => ({
    id: link.id,
    catName: link.catName,
    name: link.name,
    updated: link.updated,
    status: link.status,
  }))

  const specialsRows: SpecialsRow[] = specials.map((special: any) => ({
    id: special.id,
    name: special.name,
    foods: special.foods,
    status: special.status,
  }))

  const categoryColumns = [
    { label: 'ক্যাটাগরি', key: 'catName', width: '2fr' },
    { label: 'খাবার (সব)', key: 'name', width: '5fr' },
    { label: 'আপডেট', key: 'updated', width: '1fr', center: true },
    { label: 'স্ট্যাটাস', key: 'status', width: '1fr', center: true },
    { label: 'আইডি', key: 'id', width: '1fr', center: true },
  ]

  return (
    <>
      <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, marginBottom: 24 }}>
        মেনু ম্যানেজমেন্ট
        <span style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, fontWeight: 500 }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={buttonStyle}
            aria-label="রিফ্রেশ"
          >
            <Refresh fontSize="small" />
            রিফ্রেশ
          </button>
          <button type="button" onClick={() => (window.location.href = `/admin/menu/${encodeURIComponent(restaurant.slug)}/categories`)} style={buttonStyle}>
            <Add fontSize="small" />
            নতুন ক্যাটাগরি
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = `/admin/menu/${encodeURIComponent(restaurant.slug)}/specials`)}
            style={buttonStyle}
          >
            <Settings fontSize="small" />
            স্পেশালস
          </button>
        </span>
      </h1>

      <div>
        <AdminStripedTable
          headers={['ক্যাটাগরি', 'খাবার (সব)', 'আপডেট', 'স্ট্যাটাস', 'আইডি']}
          columns={categoryColumns}
          rows={menuRows}
          keyField="id"
          maxHeight="70vh"
          rowActions={[
            {
              label: 'সংযুক্ষ ভিউ',
              icon: <ArrowBack />,
              tooltip: 'সংযুক্ষ ভিউ',
              onClick: (row: any) =>
                (window.location.href = `/admin/menu/${encodeURIComponent(restaurant.slug)}/categories/${encodeURIComponent(row.id)}`),
            },
            {
              label: 'পরিবর্তন',
              icon: <Edit />,
              tooltip: 'পরিবর্তন',
              onClick: (row: any) =>
                (window.location.href = `/admin/menu/${encodeURIComponent(restaurant.slug)}/categories/${encodeURIComponent(row.id)}/edit`),
            },
            {
              label: 'মুছুন',
              icon: <Delete />,
              tooltip: 'মুছুন',
              color: 'error',
              onClick: async (row: any) => {
                await fetch('/api/menu/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'delete', restaurantId: restaurant.id, id: row.id }),
                })
                window.location.reload()
              },
            },
          ]}
        />
      </div>

      <div style={{ marginTop: 32 }}>
        <AdminStripedTable
          headers={['স্পেশাল নাম', 'ফুডস্', 'স্ট্যাটাস', 'আইডি']}
          columns={[
            { label: 'স্পেশাল নাম', key: 'name', width: '3fr' },
            { label: 'ফুডস্', key: 'foods', width: '2fr' },
            { label: 'স্ট্যাটাস', key: 'status', width: '1fr', center: true },
            { label: 'আইডি', key: 'id', width: '1fr', center: true },
          ]}
          rows={specialsRows}
          keyField="id"
          maxHeight="40vh"
          toolbarActions={[{ label: 'নতুন স্পেশাল', icon: <Add />, onClick: () => (window.location.href = `/admin/menu/${encodeURIComponent(restaurant.slug)}/specials`) }]}
          rowActions={[{ label: 'সংযুক্ষ ভিউ', icon: <ArrowBack />, tooltip: 'সংযুক্ষ ভিউ', onClick: (row: any) => (window.location.href = `/admin/menu/${encodeURIComponent(restaurant.slug)}/specials/${encodeURIComponent(row.id)}`) }]}
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
