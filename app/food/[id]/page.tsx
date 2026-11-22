// app/food/[id]/page.tsx — public food detail page.
// Every published food has a permanent canonical URL (/food/[id]).
import { notFound } from 'next/navigation'
import { db, publicFoodById } from '@/db/store'
import type { PublicFood } from '@/db/types'
import { formatBDT } from '@/lib/utils'

interface Params {
  id: string
}

function describe(food: PublicFood): string {
  return food.description?.trim() || `${food.name} — ${formatBDT(food.price)}`
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const food = publicFoodById(id, new Date())
  if (!food) {
    return {
      title: 'খাবার পাওয়া যায়নি',
      description: 'খাবার পাওয়া যায়নি।',
    }
  }
  const restaurant = db.restaurants.find(food.restaurantId)
  const canonical = `/food/${encodeURIComponent(id)}`
  return {
    title: food.name,
    description: describe(food),
    openGraph: {
      type: 'website',
      locale: 'bn_BD',
      siteName: restaurant?.name ?? 'NOA Cafe',
      title: food.name,
      description: describe(food),
      url: canonical,
      images: [
        {
          url: food.shareImageUrl ?? `/share/food/${encodeURIComponent(id)}/image`,
          width: 1200,
          height: 630,
          alt: food.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: restaurant?.name ?? 'NOA Cafe',
      title: food.name,
      description: describe(food),
    },
    alternates: { canonical },
  }
}

export default async function FoodPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const food = publicFoodById(id, new Date())
  if (!food) notFound()
  const restaurant = db.restaurants.find(food.restaurantId)
    const categoryName = db.categories.findOne((c) => c.id === food.categoryId)?.name ?? ''
  const menuHref = restaurant ? `/menu/${encodeURIComponent(restaurant.slug)}` : '/'

  return (
    <main className="menu-topbar" style={{ padding: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, textAlign: 'center' }}>
          {food.imageUrl ? (
            <img src={food.imageUrl} alt={food.name} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12 }} />
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a9fa5', background: '#f5f0e8', borderRadius: 12 }}>ছবি নেই</div>
          )}
          <h1 style={{ marginTop: 16 }}>{food.name}</h1>
          {food.nameEn && <p style={{ color: '#5a5f66', margin: '4px 0 8px' }}>{food.nameEn}</p>}
          <p style={{ color: '#e65100', fontWeight: 700, fontSize: 24, margin: 8 }}>{formatBDT(food.price)}</p>
          {categoryName && <p style={{ color: '#9a9fa5', fontSize: 14, margin: 4 }}>{categoryName}</p>}
          <p style={{ color: '#2b2d31', whiteSpace: 'pre-line', textAlign: 'left' }}>{food.description || 'বিবরণ নেই।'}</p>
          <p style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <a href={menuHref} style={{ textDecoration: 'underline' }}>মেনু</a>
            {restaurant && <a href={menuHref} style={{ textDecoration: 'underline' }}>{restaurant.name}</a>}
          </p>
        </div>
    </main>
  )
}
