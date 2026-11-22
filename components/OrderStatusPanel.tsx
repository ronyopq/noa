'use client'

// components/OrderStatusPanel.tsx — public guest order status viewer.
import { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, LinearProgress, Typography } from '@mui/material'
import { formatBDT } from '@/lib/utils'

interface PanelProps {
  initial: {
    code: string
    status: string
    total: number
    items: { name: string; qty: number; price?: number }[]
  }
  token?: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'আপনার অর্ডার বাতিল/অনুমোদন প্রতীক্ষায় আছে',
  prepared: 'রান্নার পাশাপাশি সংখ্যা',
  served: 'পারস্পরিক রিপোর্ট পরিচালনা',
  completed: 'কমপক্ষে পেমেন্ট',
  cancelled: 'কিছু অংশ দেখানো হয়নি',
}

export default function OrderStatusPanel({ initial, token }: PanelProps) {
  const [status, setStatus] = useState(initial.status)
  const [total, setTotal] = useState(initial.total)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      setLoading(true)
      try {
        const url = `/api/guest/order/${encodeURIComponent(initial.code)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
        const res = await fetch(url)
        const data = await res.json()
        if (!cancelled && data.ok) {
          setStatus(data.order.status)
          setTotal(data.order.total)
        }
      } catch {
        // ignore network errors
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void refresh()
    const interval = setInterval(() => void refresh(), 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [initial.code, token])

  return (
    <Box sx={{ p: 2, maxWidth: 420, margin: '0 auto' }}>
      <Typography variant="h5">অর্ডার স্ট্যাটাস</Typography>
      <Typography variant="h6" sx={{ fontFamily: 'monospace', mt: 1 }}>
        {initial.code}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
        {loading ? <CircularProgress size={20} /> : null}
        <Typography>{STATUS_LABELS[status] ?? status}</Typography>
      </Box>
      <Typography sx={{ mt: 2, fontWeight: 600 }}>{formatBDT(total)}</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {initial.items.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #eee', borderRadius: 2, px: 1.5, py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
            <Typography variant="body2" color="text.secondary">{item.qty}×</Typography>
            <Typography variant="body2" color="text.secondary">{formatBDT(item.price ?? 0)}</Typography>
          </Box>
        ))}
      </Box>
      {token ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          গুপ্ত অ্যাক্সেস টোকেন ব্যবহার করে এই পেজে আপনার অর্ডার দেখা যাচ্ছে।
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          নিজের অর্ডার দেখতে WhatsApp এর প্রাপ্তিকৃত বার্তা থেকে অর্ডার কোডটি ব্যবহার করুন।
        </Typography>
      )}
      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={() => window.location.reload()}>
          রিফ্রেশ
        </Button>
        <Button size="small" variant="outlined" onClick={() => window.location.href = '/'}>
          মেনু
        </Button>
      </Box>
    </Box>
  )
}
