// lib/cart.ts — guest cart stored in localStorage (no login needed).
import type { PublicFood } from '@/db/types'
import type { CartItem } from '@/lib/cart-types'

export type { CartItem }

const STORAGE_KEY = 'noa-cart'

export function readCart(): { restaurantId: string; items: CartItem[] } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { restaurantId: string; items: CartItem[] }
  } catch {
    return null
  }
}

export function saveCart(cart: { restaurantId: string; items: CartItem[] }): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // Quota or private mode — the app must not break.
  }
}

export function cartItemsFor(restaurantId: string): CartItem[] {
  const cart = readCart()
  return cart && cart.restaurantId === restaurantId ? cart.items : []
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

export function addToCart(restaurantId: string, item: CartItem): CartItem[] {
  const items = cartItemsFor(restaurantId)
  const idx = items.findIndex((i) => i.foodId === item.foodId)
  if (idx === -1) {
    items.push(item)
  } else {
    items[idx] = { ...items[idx], qty: items[idx].qty + item.qty }
  }
  saveCart({ restaurantId, items })
  return items
}

export function setCartQty(
  restaurantId: string,
  foodId: string,
  qty: number,
): CartItem[] {
  const items = cartItemsFor(restaurantId)
    .map((item) =>
      item.foodId === foodId ? { ...item, qty: Math.max(0, qty) } : item,
    )
    .filter((item) => item.qty > 0)
  saveCart({ restaurantId, items })
  return items
}

export function removeFromCart(restaurantId: string, foodId: string): void {
  const items = cartItemsFor(restaurantId).filter((item) => item.foodId !== foodId)
  saveCart({ restaurantId, items })
}

export function clearCart(restaurantId: string): void {
  if (readCart()?.restaurantId === restaurantId) {
    localStorage.removeItem(STORAGE_KEY)
  }
}
