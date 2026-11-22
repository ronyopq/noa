// db/store.ts — synchronous JSON-file backed entity store with atomic writes.
// This is the "database" layer of the app. All entities keep immutable database IDs.
// Data lives in db/data.json (created at runtime; add a db/migrations/ note for Supabase swap).
import fs from 'node:fs'
import path from 'node:path'
import type {
  CollectionKey,
  Food,
  Restaurant,
  PublicFood,
  Store,
  StaffMembership,
  User,
  Category,
  Hero,
  Special,
  Order,
  OrderItem,
  Bill,
  Payment,
  Game,
  GameRun,
  Comment,
  Reward,
  SiteSettings,
  Session,
  Branch,
} from './types'

// Order codes use Asia/Dhaka by default (see master spec).
if (!process.env.TZ) {
  process.env.TZ = 'Asia/Dhaka'
}

export const STORE_PATH = path.resolve(process.cwd(), 'db', 'data.json')

const STORE_KEYS = [
  'restaurants',
  'branches',
  'staffMemberships',
  'users',
  'sessions',
  'categories',
  'foods',
  'heroes',
  'specials',
  'orders',
  'orderItems',
  'bills',
  'payments',
  'games',
  'gameRuns',
  'comments',
  'rewards',
  'settings',
] as const satisfies readonly CollectionKey[]

function emptyStore(): Store {
  return {
    version: 1,
    restaurants: [],
    branches: [],
    staffMemberships: [],
    users: [],
    sessions: [],
    categories: [],
    foods: [],
    heroes: [],
    specials: [],
    orders: [],
    orderItems: [],
    bills: [],
    payments: [],
    games: [],
    gameRuns: [],
    comments: [],
    rewards: [],
    settings: [],
    counters: {},
  }
}

let _store: Store | null = null

export function loadStore(): Store {
  if (!_store) {
    const store = emptyStore()
    let raw: string | undefined
    try {
      raw = fs.readFileSync(STORE_PATH, 'utf8')
    } catch {
      raw = undefined
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<Store>
        for (const key of STORE_KEYS) {
          if (Array.isArray((parsed as Record<string, unknown>)[key])) {
            ;(store as unknown as Record<string, unknown[]>)[key] = (
              parsed as unknown as Record<string, unknown[]>
            )[key]
          }
        }
        if (
          parsed.counters &&
          typeof parsed.counters === 'object' &&
          !Array.isArray(parsed.counters)
        ) {
          store.counters = parsed.counters
        }
      } catch {
        // Corrupted file: start fresh rather than crash the app.
      }
    }
    _store = store
  }
  return _store
}

function persist(): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
  const tmp = `${STORE_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(loadStore(), null, 2), 'utf8')
  fs.renameSync(tmp, STORE_PATH)
}

interface Collection<T extends { id: string }> {
  list(): T[]
  find(id: string): T | undefined
  findOne(pred: (item: T) => boolean): T | undefined
  findWhere(pred: (item: T) => boolean): T[]
  where(pred: (item: T) => boolean): T[]
  count(pred?: (item: T) => boolean): number
  add(item: T): T
  update(id: string, patch: Partial<T>): T | undefined
  remove(id: string): boolean
  touch(id: string, patch: Partial<T>): void
}

function collection<T extends { id: string }>(key: CollectionKey): Collection<T> {
  const items = (): T[] => loadStore()[key] as unknown as T[]
  return {
    list: (): T[] => items(),
    find: (id: string): T | undefined => items().find((item) => item.id === id),
    findOne: (pred: (item: T) => boolean): T | undefined => items().find(pred),
    findWhere: (pred: (item: T) => boolean): T[] => items().filter(pred),
    where: (pred: (item: T) => boolean): T[] => items().filter(pred),
    count: (pred?: (item: T) => boolean): number =>
      pred ? items().filter(pred).length : items().length,
    add: (item: T): T => {
      items().push(item)
      persist()
      return item
    },
    update: (id: string, patch: Partial<T>): T | undefined => {
      const found = items().find((item) => item.id === id)
      if (!found) return undefined
      Object.assign(found, patch)
      persist()
      return found
    },
    remove: (id: string): boolean => {
      const idx = items().findIndex((item) => item.id === id)
      if (idx === -1) return false
      items().splice(idx, 1)
      persist()
      return true
    },
    touch: (id: string, patch: Partial<T>): void => {
      const found = items().find((item) => item.id === id)
      if (found) {
        Object.assign(found, patch)
        persist()
      }
    },
  }
}

export const db = {
  restaurants: collection<Restaurant>('restaurants'),
  branches: collection<Branch>('branches'),
  staffMemberships: collection<StaffMembership>('staffMemberships'),
  users: collection<User>('users'),
  sessions: collection<Session>('sessions'),
  categories: collection<Category>('categories'),
  foods: collection<Food>('foods'),
  heroes: collection<Hero>('heroes'),
  specials: collection<Special>('specials'),
  orders: collection<Order>('orders'),
  orderItems: collection<OrderItem>('orderItems'),
  bills: collection<Bill>('bills'),
  payments: collection<Payment>('payments'),
  games: collection<Game>('games'),
  gameRuns: collection<GameRun>('gameRuns'),
  comments: collection<Comment>('comments'),
  rewards: collection<Reward>('rewards'),
  settings: collection<SiteSettings>('settings'),
} as const

export function now(): string {
  return new Date().toISOString()
}

export function nextId(prefix: string, width = 4): string {
  const key = `id:${prefix}`
  const store = loadStore()
  store.counters[key] = (store.counters[key] ?? 0) + 1
  persist()
  return `${prefix}-${String(store.counters[key]).padStart(width, '0')}`
}

export function nowEpochMs(): number {
  return Date.now()
}

// Order codes: XXX-YYMMXXXX (restaurant code + YYMM + per-restaurant month sequence, 4 digits).
function orderSeqKey(restaurant: Restaurant): string {
  const at = new Date()
  const yy = String(at.getFullYear() % 100).padStart(2, '0')
  const mm = String(at.getMonth() + 1).padStart(2, '0')
  return `order-seq:${restaurant.id}:${yy}${mm}`
}

export function createOrderCode(restaurant: Restaurant): string {
  const key = orderSeqKey(restaurant)
  const store = loadStore()
  store.counters[key] = (store.counters[key] ?? 0) + 1
  const seq = store.counters[key]
  persist()
  const yymm = orderSeqKey(restaurant).split(':').pop() ?? ''
  return `${restaurant.code}-${yymm}${String(seq).padStart(4, '0')}`
}

export function orderSequence(restaurant: Restaurant): number {
  return loadStore().counters[orderSeqKey(restaurant)] ?? 0
}

export function orderCodeExists(code: string): boolean {
  return db.orders.findOne((order) => order.code === code) !== undefined
}

export function primaryRestaurant(): Restaurant | undefined {
  return (
    db.restaurants.findOne((r) => r.isPublished) ??
    db.restaurants.list()[0]
  )
}

export function publicFoods(restaurantId: string, at: Date): PublicFood[] {
  return db.foods
    .findWhere((f) => f.restaurantId === restaurantId && f.isPublished)
    .map((f) => ({ ...f, available: effectiveAvailability(f, at) }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
}

export function effectiveAvailability(food: Food, at: Date): boolean {
  if (!food.isAvailable) return false
  if (food.availabilityFrom && at.getTime() < new Date(food.availabilityFrom).getTime()) {
    return false
  }
  if (food.availabilityTo && at.getTime() > new Date(food.availabilityTo).getTime()) {
    return false
  }
  return true
}

export function publicFoodById(id: string, at: Date): PublicFood | undefined {
  const food = db.foods.find(id)
  if (!food || !food.isPublished) return undefined
  return { ...food, available: effectiveAvailability(food, at) }
}

export function publicRestaurant(slug: string): Restaurant | undefined {
  const normalized = slug.trim().toLowerCase()
  return db.restaurants.findOne(
    (r) => r.slug.toLowerCase() === normalized || r.id.toLowerCase() === normalized,
  )
}

export function allPublicFoods(slug: string, at: Date): Food[] {
  const restaurant = publicRestaurant(slug)
  if (!restaurant) return []
  return publicFoods(restaurant.id, at)
}

export function siteShareImageUrl(restaurantId: string): string | undefined {
  return db.settings.findOne((s) => s.restaurantId === restaurantId)?.defaultShareImageUrl
}

export function settingsFor(restaurantId: string): SiteSettings | undefined {
  return db.settings.findOne((s) => s.restaurantId === restaurantId)
}

export function upsertSettings(
  patch: Omit<SiteSettings, 'id'> & { id?: string },
): SiteSettings {
  const existing = settingsFor(patch.restaurantId)
  const updatedAt = now()
  if (existing) {
    const updated: SiteSettings = { ...existing, ...patch, updatedAt }
    return db.settings.update(existing.id, updated) as SiteSettings
  }
  const row: SiteSettings = { id: `SITE-${patch.restaurantId}`, ...patch, updatedAt }
  return db.settings.add(row)
}

export const STORE = { loadStore, STORE_PATH }
