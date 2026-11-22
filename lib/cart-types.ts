// lib/cart-types.ts — shared guest cart types (client-only).
export interface CartItem {
  foodId: string
  name: string
  nameEn?: string
  price: number
  categoryId: string
  qty: number
  imageUrl?: string
}
