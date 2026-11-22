import { notFound } from 'next/navigation'
import { db, publicRestaurant, publicFoods, siteShareImageUrl } from '@/db/store'
import { MenuShell } from '@/components/menu/MenuShell'
import { CartProvider } from '@/components/CartProvider'
import type { PublicCategory } from '@/components/menu/types'

interface Params {
  slug: string
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const restaurant = publicRestaurant(slug)
  if (!restaurant) {
    return {
      title: 'মেনু পাওয়া যায়নি',
      description: 'মেনু পাওয়া যায়নি।',
      openGraph: {
        type: 'website',
        siteName: 'NOA Cafe',
        url: `/menu/${encodeURIComponent(slug)}`,
      },
      twitter: {
        card: 'summary_large_image' as const,
        site: 'NOA Cafe',
        description: 'মেনু পাওয়া যায়নি।',
      },
    }
  }
  const shareImage =
    siteShareImageUrl(restaurant.id) ??
    `/share/menu/${encodeURIComponent(restaurant.slug)}/image`
  return {
    title: restaurant.name,
    description: `${restaurant.name} — অনলাইন মেনু, কার্ট, WhatsApp অর্ডার।`,
    openGraph: {
      type: 'website',
      locale: 'bn_BD',
      siteName: 'NOA Cafe',
      title: restaurant.name,
      description: `${restaurant.name} — অনলাইন মেনু, কার্ট, WhatsApp অর্ডার।`,
      url: `/menu/${encodeURIComponent(restaurant.slug)}`,
      images: [{ url: shareImage, width: 1200, height: 630, alt: restaurant.name }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: 'NOA Cafe',
      title: restaurant.name,
      description: `${restaurant.name} — অনলাইন মেনু, কার্ট, WhatsApp অর্ডার।`,
    },
    alternates: {
      canonical: `/menu/${encodeURIComponent(restaurant.slug)}`,
    },
  }
}

export default async function MenuPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const restaurant = publicRestaurant(slug)
  if (!restaurant) notFound()

  const at = new Date()
  const foods = publicFoods(restaurant.id, at)
  const categories: PublicCategory[] = db.categories
    .findWhere((c) => c.restaurantId === restaurant.id && c.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((c) => ({ ...c, foods: foods.filter((f) => f.categoryId === c.id) }))
  const heroes = db.heroes
    .findWhere((h) => h.restaurantId === restaurant.id && h.isPublished)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

  return (
    <CartProvider restaurantId={restaurant.id}>
      <MenuShell
        restaurant={restaurant}
        foods={foods}
        categories={categories}
        heroes={heroes}
      />
    </CartProvider>
  )
}
