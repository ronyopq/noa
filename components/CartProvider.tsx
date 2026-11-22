'use client'

// components/CartProvider.tsx — guest cart + server price revalidation.
// Cart items live in localStorage; prices are revalidated from the menu data API
// so the guest sees updated prices/availability before checkout.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { CartItem } from '@/lib/cart'
import {
  addToCart,
  cartItemsFor,
  cartTotal,
  clearCart,
  removeFromCart,
  saveCart,
  setCartQty,
} from '@/lib/cart'
import { fetchMenuData } from '@/lib/menu-data'

interface CartContextValue {
  restaurantId: string
  items: CartItem[]
  total: number
  isLoading: boolean
  changedItems: { name: string; newPrice: number }[]
  add: (item: CartItem) => void
  setQty: (foodId: string, qty: number) => void
  remove: (foodId: string) => void
  clear: () => void
  refresh: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({
  restaurantId,
  children,
}: {
  restaurantId: string
  children: ReactNode
}) {
  const [items, setItems] = useState<CartItem[]>(() => cartItemsFor(restaurantId))
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [changedItems, setChangedItems] = useState<
    { name: string; newPrice: number }[]
  >([])

  const total = cartTotal(items)

  const applyPrices = useCallback((prices: Record<string, number>) => {
    setCurrentPrices(prices)
    const items = cartItemsFor(restaurantId)
    const next: CartItem[] = []
    const changed: { name: string; newPrice: number }[] = []
    for (const item of items) {
      const price = prices[item.foodId]
      if (price === undefined) {
        next.push(item)
        continue
      }
      if (Math.abs(price - item.price) > 0.001) {
        changed.push({ name: item.name, newPrice: price })
      }
      next.push({ ...item, price })
    }
    saveCart({ restaurantId, items: next })
    setItems(next)
    setChangedItems(changed)
  }, [restaurantId])

  const refresh = useCallback(() => {
    void fetchMenuData(restaurantId)
      .then((data) => {
        const prices: Record<string, number> = {}
        for (const food of data.foods) prices[food.id] = food.price
        applyPrices(prices)
      })
      .catch(() => {})
  }, [restaurantId, applyPrices])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    (item: CartItem) => {
      const next = addToCart(restaurantId, item)
      setItems(next)
    },
    [restaurantId],
  )

  const setQty = useCallback(
    (foodId: string, qty: number) => {
      const next = setCartQty(restaurantId, foodId, qty)
      setItems(next)
    },
    [restaurantId],
  )

  const remove = useCallback(
    (foodId: string) => {
      removeFromCart(restaurantId, foodId)
      setItems(cartItemsFor(restaurantId))
    },
    [restaurantId],
  )

  const clear = useCallback(() => {
    clearCart(restaurantId)
    setItems([])
    setChangedItems([])
  }, [restaurantId])

  const ctx: CartContextValue = {
    restaurantId,
    items,
    total,
    isLoading,
    changedItems,
    add,
    setQty,
    remove,
    clear,
    refresh,
  }
  return <CartContext.Provider value={ctx}>{children}</CartContext.Provider>
}

export { saveCart }
