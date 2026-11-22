// lib/menu-data.ts — client-side fetch of public menu data (for cart revalidation).
import type { PublicMenuData } from '@/components/menu/types'

export async function fetchMenuData(restaurantId: string): Promise<PublicMenuData> {
  const res = await fetch(
    `/api/menu/data?restaurantId=${encodeURIComponent(restaurantId)}`,
  )
  if (!res.ok) throw new Error('Failed to load menu data')
  return res.json() as Promise<PublicMenuData>
}
