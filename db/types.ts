// Entity definitions for the NOA restaurant system.
// Every record gets an immutable database ID when inserted.

export type StaffRole = 'owner' | 'manager' | 'staff' | 'cashier'
export type OrderStatus = 'pending' | 'prepared' | 'served' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'bkash' | 'none'

export interface Restaurant {
  id: string
  code: string
  name: string
  slug: string
  address: string
  phone: string
  email?: string
  whatsapp?: string
  currency: string
  timezone: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Branch {
  id: string
  restaurantId: string
  name: string
  address: string
  phone: string
  isPrimary: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface StaffMembership {
  id: string
  restaurantId: string
  userId: string
  role: StaffRole
  permissions: string[]
  status: 'active' | 'inactive'
  joinedAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  passwordSalt: string
  passwordHash: string
  status: 'active' | 'suspended'
  role: StaffRole
  restaurantId?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  restaurantId: string
  name: string
  nameEn?: string
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Food {
  id: string
  restaurantId: string
  categoryId: string
  name: string
  nameEn?: string
  description: string
  price: number
  sortOrder: number
  isPublished: boolean
  isAvailable: boolean
  availabilityFrom?: string
  availabilityTo?: string
  imageUrl?: string
  badge?: string
  isSpecial: boolean
  shareImageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Hero {
  id: string
  restaurantId: string
  title: string
  subtitle?: string
  ctas: string[]
  images: string[]
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Special {
  id: string
  restaurantId: string
  name: string
  foodIds: string[]
  from?: string
  to?: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  code: string
  idempotencyKey: string
  restaurantId: string
  branchId?: string
  status: OrderStatus
  source: 'whatsapp' | 'web' | 'pos'
  customerName?: string
  customerPhone?: string
  customerNote?: string
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  serviceCharge: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  guestToken?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  cancelledAt?: string
}

export interface OrderItem {
  id: string
  orderId: string
  foodId: string
  foodName: string
  price: number
  qty: number
  discount: number
  createdAt: string
}

export interface Bill {
  id: string
  orderId: string
  lineItems: BillItem[]
  subtotal: number
  discount: number
  tax: number
  serviceCharge: number
  total: number
  currency: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  isPrinted: boolean
  printedAt?: string
  refundedAmount: number
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: string
  foodId?: string
  foodName: string
  qty: number
  unitPrice: number
  discount: number
  tax: number
}

export interface Payment {
  id: string
  orderId: string
  billId: string
  method: PaymentMethod
  amount: number
  currency: string
  providerTxId?: string
  status: PaymentStatus
  settledAt?: string
  createdAt: string
  updatedAt: string
}

export interface Game {
  id: string
  restaurantId: string
  name: string
  coverImage: string
  assets: string[]
  description: string
  isPublished: boolean
  stageOrder: number
  themeVersion: string
  createdAt: string
  updatedAt: string
}

export interface GameRun {
  id: string
  gameId: string
  playerName?: string
  score: number
  status: 'incomplete' | 'completed'
  level: number
  startTime: string
  endTime?: string
  validation?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  restaurantId: string
  name: string
  phone: string
  comment: string
  isApproved: boolean
  isPublished: boolean
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface Reward {
  id: string
  name: string
  eligibility: string
  tieBreakers: string[]
  timeLimitDays: number
  conditions: string[]
  isLiveEligible: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: number
  createdAt: string
  lastSeenAt: string
  ip?: string
}

export interface SiteSettings {
  id: string
  restaurantId: string
  shareTitle: string
  shareDescription: string
  defaultShareImageUrl?: string
  defaultShareImageAlt?: string
  foodShareImageUrls: Record<string, string>
  updatedAt: string
}

export interface PublicFood extends Food {
  available: boolean
}

export interface Store {
  version: number
  restaurants: Restaurant[]
  branches: Branch[]
  staffMemberships: StaffMembership[]
  users: User[]
  sessions: Session[]
  categories: Category[]
  foods: Food[]
  heroes: Hero[]
  specials: Special[]
  orders: Order[]
  orderItems: OrderItem[]
  bills: Bill[]
  payments: Payment[]
  games: Game[]
  gameRuns: GameRun[]
  comments: Comment[]
  rewards: Reward[]
  settings: SiteSettings[]
  counters: Record<string, number>
}

export interface StoreKey {
  restaurants: Restaurant
  branches: Branch
  staffMemberships: StaffMembership
  users: User
  sessions: Session
  categories: Category
  foods: Food
  heroes: Hero
  specials: Special
  orders: Order
  orderItems: OrderItem
  bills: Bill
  payments: Payment
  games: Game
  gameRuns: GameRun
  comments: Comment
  rewards: Reward
  settings: SiteSettings
}

export type CollectionKey = keyof StoreKey
export type CollectionItem<K extends CollectionKey> = StoreKey[K]
