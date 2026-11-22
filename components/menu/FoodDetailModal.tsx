'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { AddCircleOutlined, Close, RemoveCircleOutlined } from '@mui/icons-material'
import type { PublicFood } from '@/db/types'
import { useCart } from '@/components/CartProvider'
import { emitToast } from '@/lib/toast'
import { formatBDT, toBnDigits } from '@/lib/utils'

interface Props {
  food: PublicFood
  onClose: () => void
}

export default function FoodDetailModal({ food, onClose }: Props) {
  const { add } = useCart()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [qty, setQty] = useState(1)

  const increase = () => setQty((q) => Math.min(99, q + 1))
  const decrease = () => setQty((q) => Math.max(1, q - 1))

  const addToCart = () => {
    add({
      foodId: food.id,
      name: food.name,
      nameEn: food.nameEn,
      price: food.price,
      categoryId: food.categoryId,
      qty,
      imageUrl: food.imageUrl,
    })
    emitToast(`${food.name} কার্টে যোগ করা হয়েছে (×${toBnDigits(qty)})`)
    onClose()
  }

  const unavailable = !food.available

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth={!isMobile}
      maxWidth={isMobile ? 'xs' : 'sm'}
      scroll="paper"
    >
      <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        {food.imageUrl ? (
          <Box
            component="img"
            src={food.imageUrl}
            alt={food.name}
            sx={{ width: '100%', height: { xs: 180, sm: 240 }, objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: { xs: 180, sm: 240 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f0e8',
            }}
          >
            <Typography variant="body2" color="text.disabled">
              ছবি নেই
            </Typography>
          </Box>
        )}
        <IconButton
          aria-label="বন্ধ"
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.45)' }}
        >
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ p: isMobile ? 2 : 3, pt: isMobile ? 1.5 : 2.5 }}>
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {food.name}
          </Typography>
          {food.nameEn && (
            <Typography variant="body2" color="text.secondary">
              {food.nameEn}
            </Typography>
          )}
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {formatBDT(food.price * qty)}
          </Typography>
          {unavailable && <Chip label="আজ পাওয়া যাচ্ছে না" color="warning" size="small" />}
        </Box>

        {food.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {food.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3, gap: 1 }}>
          <IconButton aria-label="কমবে" disabled={qty <= 1} onClick={decrease}>
            <RemoveCircleOutlined />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
            {toBnDigits(qty)}
          </Typography>
          <IconButton aria-label="বাড়বে" onClick={increase}>
            <AddCircleOutlined />
          </IconButton>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          {unavailable ? (
            <Button variant="outlined" color="error" onClick={onClose}>
              বন্ধ
            </Button>
          ) : (
            <Button variant="contained" onClick={addToCart} sx={{ px: 3 }}>
              কার্টে যোগ করুন (+{toBnDigits(qty)})
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}
