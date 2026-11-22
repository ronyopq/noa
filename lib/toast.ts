// lib/toast.ts — client-only lightweight toast bus.
import { useEffect, useState } from 'react'

export type ToastSeverity = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  severity: ToastSeverity
}

let counter = 0
export const toastList: Toast[] = []
export const toastListeners = new Set<() => void>()

export function emitToast(message: string, severity: ToastSeverity = 'success') {
  const toast: Toast = { id: `toast-${++counter}-${Date.now()}`, message, severity }
  toastList.push(toast)
  if (toastList.length > 5) toastList.shift()
  for (const listener of toastListeners) listener()
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>(() => [...toastList])
  useEffect(() => {
    const listener = () => setToasts([...toastList])
    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
    }
  }, [])
  const close = (id: string) => setToasts((t) => t.filter((x) => x.id !== id))
  return { toasts, close }
}
