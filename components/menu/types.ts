// Public menu types — data passed from server components to client components.
import type { Category, Food, Restaurant } from '@/db/types'
import type { PublicFood } from '@/db/types'

export type { PublicFood }

export interface PublicCategory {
  id: string
  name: string
  nameEn?: string
  sortOrder: number
  foods: PublicFood[]
}

export interface PublicHeroImage {
  url: string
  label?: string
  button?: string
  redirectTo?: string
}

export interface PublicMenuData {
  restaurant: Restaurant
  foods: PublicFood[]
  categories: PublicCategory[]
  allCategories: Category[]
}
