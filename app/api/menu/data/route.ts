// app/api/menu/data/route.ts — public menu data for the menu page + cart revalidation.
import { db, publicRestaurant, publicFoods } from '@/db/store'
import type { PublicFood } from '@/db/types'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const restaurantId = url.searchParams.get('restaurantId') ?? ''
  const slug = url.searchParams.get('slug') ?? ''

  const restaurant = restaurantId
    ? db.restaurants.find(restaurantId)
    : publicRestaurant(slug)

  if (!restaurant) return json({ error: 'not_found' }, 404)

  const at = new Date()
  const foods: PublicFood[] = publicFoods(restaurant.id, at)
  const categories = db.categories
    .findWhere((c) => c.restaurantId === restaurant.id && c.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  const heroes = db.heroes
    .findWhere((h) => h.restaurantId === restaurant.id && h.isPublished)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

  return json({
    restaurant,
    foods,
    categories,
    heroes,
  })
}
