// scripts/seed-staff.ts — bootstrap: restaurant + initial staff + demo foods/hero.
// Run: npm run seed:staff
// All writes are skipped if a restaurant/user already exists (idempotent).
import { randomBytes } from 'node:crypto'
import { db, nextId, now } from '@/db/store'
import { hashPassword } from '@/db/passwords'
import { ROLE_ACTIONS } from '@/lib/auth'
import type { Restaurant, User, StaffMembership } from '@/db/types'

function env(name: string, fallback?: string): string {
  return process.env[name] ?? fallback ?? ''
}

function main() {
  const restaurants = db.restaurants.list()
  if (restaurants.length === 0) {
    const name = env('SEED_RESTO_NAME', 'NOA Cafe')
    const restaurant: Restaurant = {
      id: nextId('RST', 4),
      code: env('SEED_RESTO_CODE', 'NOA').toUpperCase().slice(0, 3).padEnd(3, 'N'),
      name,
      slug: env('SEED_RESTO_SLUG', 'noa-cafe'),
      address: env('SEED_RESTO_ADDRESS', 'North Road, Chittagong, Bangladesh'),
      phone: env('SEED_RESTO_PHONE', '+8801700000421'),
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      isPublished: true,
      createdAt: now(),
      updatedAt: now(),
    }
    db.restaurants.add(restaurant)

    const categoryId = nextId('CAT', 4)
    db.categories.add({
      id: categoryId,
      restaurantId: restaurant.id,
      name: 'পানি ও জাতীয়',
      nameEn: 'Local drinks',
      sortOrder: 1,
      isPublished: true,
      createdAt: now(),
      updatedAt: now(),
    })

    const foods = [
      { id: nextId('FOOD', 4), name: 'পানি', nameEn: 'Water', price: 20 },
      { id: nextId('FOOD', 4), name: 'মিষ্টি পানি', nameEn: 'Sweet water', price: 35 },
      { id: nextId('FOOD', 4), name: 'দই', nameEn: 'Buttermilk', price: 45 },
    ]
    for (const [i, food] of foods.entries()) {
      db.foods.add({
        id: food.id,
        restaurantId: restaurant.id,
        categoryId,
        name: food.name,
        nameEn: food.nameEn,
        description: `তরমুজ মৌসুমের ${['সুপার ড্রিংক', 'শান্তিময় পানি', 'মিষ্টিময়'][i]}`,
        price: food.price,
        sortOrder: i + 1,
        isPublished: true,
        isAvailable: true,
        imageUrl: undefined,
        badge: undefined,
        isSpecial: i === 0,
        createdAt: now(),
        updatedAt: now(),
      })
    }

    db.heroes.add({
      id: nextId('HERO', 4),
      restaurantId: restaurant.id,
      title: 'আজকের স্পেশাল — ফালকাপাথে',
      subtitle: 'আজ সন্ধ্যায় একসঙ্গে মিলিয়ে ফালকাপাথ গিয়ে আসতে এসো।',
      ctas: ['মেনু দেখুন'],
      images: [],
      order: 1,
      isPublished: true,
      createdAt: now(),
      updatedAt: now(),
    })

    console.log(`Seeded restaurant: ${restaurant.code} / ${restaurant.slug}`)
  }

  const users = db.users.list()
  const existingUser = users.find((u) => u.status === 'active')
  if (!existingUser) {
    const restaurant = db.restaurants.list()[0]
    if (!restaurant) throw new Error('Restaurant missing')
    const password = process.env.SEED_OWNER_PASSWORD || randomBytes(14).toString('hex')
    const { passwordHash, passwordSalt } = hashPassword(password)
    const owner: User = {
      id: nextId('USR', 6),
      name: env('SEED_OWNER_NAME', 'Owner'),
      phone: env('SEED_OWNER_PHONE', '+8801700000000'),
      email: env('SEED_OWNER_EMAIL', 'owner@noacafe.local'),
      passwordSalt,
      passwordHash,
      status: 'active',
      role: 'owner',
      restaurantId: restaurant.id,
      createdAt: now(),
      updatedAt: now(),
    }
    db.users.add(owner)
    const membership: StaffMembership = {
      id: nextId('SM', 6),
      restaurantId: restaurant.id,
      userId: owner.id,
      role: 'owner',
      permissions: [...ROLE_ACTIONS.owner],
      status: 'active',
      joinedAt: now(),
      updatedAt: now(),
    }
    db.staffMemberships.add(membership)
    console.log(`Created staff user: ${owner.phone} / ${owner.email} (role: owner)`)
    console.log(`SEED_OWNER_PASSWORD=${password}`)
    console.log('(store it somewhere safe — it is only printed once here)')
  } else {
    console.log(`Staff already exists: ${existingUser.phone}`)
  }
}

main()
