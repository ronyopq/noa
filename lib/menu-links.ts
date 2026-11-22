// lib/menu-links.ts — server-side helpers for admin menu pages.
import { db, nextId, now } from '@/db/store'
import type { Restaurant } from '@/db/types'

export interface MenuLink {
  id: string
  restaurantId: string
  categoryId: string
  categoryName: string
  name: string
  categoryNameDisplay: string
  updated: string
  status?: string
}

export interface SpecialInfo {
  id: string
  name: string
  foods: string
  status: string
  redirectTo: string
}

export async function loadMenuLinks(restaurantId: string): Promise<MenuLink[]> {
  const categories = db.categories
    .findWhere((c) => c.restaurantId === restaurantId && c.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))

  const links: MenuLink[] = []
  for (const cat of categories) {
    const foods = db.foods
      .findWhere((f) => f.categoryId === cat.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map((f) => `${f.name}${f.isSpecial ? ' 🌟' : ''}${f.imageUrl ? ' 🖼️' : ''}${f.isAvailable ? '' : ' (আজ পাওয়া যাচ্ছে না)'}`)
      .join('; ')

    links.push({
      id: cat.id,
      restaurantId: restaurantId,
      categoryId: cat.id,
      categoryName: cat.name,
      name: foods,
      categoryNameDisplay: cat.name,
      updated: now(),
    })
  }

  return links.sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}

export async function menuLinks(restaurantId: string): Promise<MenuLink[]> {
  return loadMenuLinks(restaurantId)
}

export async function formatSpecialsInput(specials: { id: string; name: string; foodIds: string[]; createdAt: string; updatedAt: string }[]): Promise<SpecialInfo[]> {
  return specials.map((s) => ({
    id: s.id,
    name: s.name,
    foods: db.foods.where((f) => s.foodIds.includes(f.id)).map((f) => f.name).join(', '),
    status: 'active',
    redirectTo: `/specials/${encodeURIComponent(s.id)}`,
  }))
}
