'use client'

// components/menu/MenuShell.tsx — public menu shell: hero, search, category
// nav, food cards, cart drawer, WhatsApp checkout, price-change confirmation.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Close,
  Done,
  Print,
  Refresh,
  Remove,
  ShoppingBag,
  ShoppingCart,
  WhatsApp,
} from '@mui/icons-material'
import type { Hero, Restaurant } from '@/db/types'
import type { PublicFood, PublicCategory } from '@/components/menu/types'
import { useCart } from '@/components/CartProvider'
import FoodDetailModal from '@/components/menu/FoodDetailModal'
import { checkout } from '@/lib/checkout'
import { clearCart } from '@/lib/cart'
import { buildWhatsAppMessage, openWhatsApp } from '@/lib/whatsapp'
import { emitToast, useToasts } from '@/lib/toast'
import { formatBDT, toBnDigits } from '@/lib/utils'

interface Props {
  restaurant: Restaurant
  foods: PublicFood[]
  categories: PublicCategory[]
  heroes: Hero[]
}

interface CheckoutResult {
  code: string
  message: string
  total: number
}

interface PriceChangeDialog {
  newTotal: number
  changedItems: { name: string; newPrice: number }[]
}

export function MenuShell({ restaurant, foods, categories, heroes }: Props) {
  const { toasts, close: closeToast } = useToasts()
  const { items: cartItems, total, isLoading, add, setQty, remove, clear } =
    useCart()

  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [openDetail, setOpenDetail] = useState<PublicFood | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)
  const [priceChangeDialog, setPriceChangeDialog] = useState<PriceChangeDialog | null>(null)
  const [snack, setSnack] = useState<{ id: string; message: string } | null>(null)

  const checkoutKeyRef = useRef<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Reflect emitted toasts as snackbars.
  useEffect(() => {
    const latest = toasts[0]
    if (latest) setSnack(latest)
  }, [toasts])

  const q = search.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      foods.filter((f) => {
        if (q) {
          const text = `${f.name} ${f.nameEn ?? ''} ${f.description ?? ''}`.toLowerCase()
          if (!text.includes(q)) return false
        }
        if (activeCat) return f.categoryId === activeCat
        return true
      }),
    [foods, q, activeCat],
  )

  const availableFoods = useMemo(
    () => filtered.filter((f) => f.available),
    [filtered],
  )
  const unavailableFoods = useMemo(
    () => filtered.filter((f) => !f.available),
    [filtered],
  )

  const scrollToGrid = () => {
    setCartOpen(false)
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      emitToast('বার্তা কপি করা হয়েছে')
    } catch {
      emitToast('কপি করা যায়নি', 'error')
    }
  }

  const startCheckout = useCallback(async () => {
    if (cartItems.length === 0) return
    if (!checkoutKeyRef.current) checkoutKeyRef.current = crypto.randomUUID()
    const key = checkoutKeyRef.current
    const result = await checkout({
      restaurantId: restaurant.id,
      items: cartItems.map((item) => ({ foodId: item.foodId, qty: item.qty })),
      source: 'web',
      idempotencyKey: key,
    })

    if (result.ok) {
      checkoutKeyRef.current = null
      const message = buildWhatsAppMessage({
        code: result.order.code,
        items: cartItems,
        total: result.order.total,
      })
      setCheckoutResult({ code: result.order.code, message, total: result.order.total })
      emitToast('অর্ডার সম্পন্ন হয়েছে', 'success')
      clear()
      setCartOpen(false)
      return
    }

    if (result.error === 'price_changed') {
      checkoutKeyRef.current = null
      setPriceChangeDialog({
        newTotal: result.newTotal ?? cartItems.reduce((s, i) => s + i.price * i.qty, 0),
        changedItems: result.changedItems ?? [],
      })
      return
    }

    checkoutKeyRef.current = null
    emitToast(result.warnings[0] ?? 'চেকআউট করা যায়নি', 'error')
  }, [cartItems, restaurant.id, clear])

  const confirmPriceChange = () => {
    setPriceChangeDialog(null)
    void startCheckout()
  }

  const openOrderWhatsApp = () => {
    if (!checkoutResult) return
    if (restaurant.whatsapp) {
      if (!openWhatsApp(restaurant.whatsapp, checkoutResult.message)) {
        void copyToClipboard(checkoutResult.message)
      }
    } else {
      void copyToClipboard(checkoutResult.message)
    }
  }

  const foodGrid = (list: PublicFood[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {list.map((food) => (
        <FoodCard key={food.id} food={food} onTap={() => setOpenDetail(food)} />
      ))}
    </Box>
  )

  return (
    <Box component="main" sx={{ minHeight: '100vh', background: '#f8f5f2' }}>
      {/* Sticky top bar */}
      <header
        className="menu-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          padding: '10px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(248, 245, 242, 0.92)',
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          {restaurant.name}
        </Typography>
        <Tooltip title={cartItems.length > 0 ? `কার্ট — ${cartItems.length} আইটেম` : 'কার্ট দেখুন'}>
          <Badge
            color="error"
            badgeContent={cartItems.length}
            overlap="circular"
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Button
              variant="outlined"
              color={cartItems.length > 0 ? 'primary' : 'inherit'}
              onClick={() => setCartOpen(true)}
              aria-label="কার্ট"
              startIcon={<ShoppingCart />}
              sx={{ minWidth: 'unset', p: 1.2, fontWeight: 600 }}
            >
              {total > 0 ? formatBDT(total) : 'কার্ট'}
            </Button>
          </Badge>
        </Tooltip>
      </header>

      {/* Hero carousel */}
      <Box sx={{ px: 2, pt: 2 }}>
        <HeroCarousel heroes={heroes} />

        {/* Search + category nav */}
        <Box sx={{ mt: 2 }}>
          <Box component="input" placeholder="খাবার খুঁজুন..." value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            aria-label="খাবার খুঁজুন"
            sx={{ width: '100%', height: 44, borderRadius: 2, border: '1px solid #d6d3cd', px: 2, fontSize: '0.95rem', color: '#2b2d31', background: '#fff', '&:focus': { outline: '2px solid #e65100', borderColor: '#e65100' } }}
          />
          {categories.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                mt: 1.5,
                px: 0.5,
                py: 0.5,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
              aria-label="ক্যাটাগরি"
            >
              <Chip
                label="সব"
                variant={activeCat === null ? 'filled' : 'outlined'}
                color={activeCat === null ? 'primary' : 'default'}
                onClick={() => setActiveCat(null)}
              />
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  variant={activeCat === cat.id ? 'filled' : 'outlined'}
                  color={activeCat === cat.id ? 'primary' : 'default'}
                  onClick={() => setActiveCat((prev) => (prev === cat.id ? null : cat.id))}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Food grid */}
        <Box component="div" ref={gridRef} sx={{ mt: 2, mb: 4 }}>
          {isLoading && !availableFoods.length ? (
            <LinearProgress sx={{ mt: 2 }} color="warning" />
          ) : null}

          {!activeCat && categories.length > 0
            ? categories.map((cat) =>
                cat.foods.length > 0 ? (
                  <Box key={cat.id} sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
                      {cat.name}
                      {cat.nameEn && (
                        <Typography component="span" variant="body2" color="text.secondary">
                          {cat.nameEn}
                        </Typography>
                      )}
                    </Typography>
                    {foodGrid(cat.foods)}
                  </Box>
                ) : null,
              )
            : foodGrid(filtered)}

          {/* Empty states */}
          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', padding: 6, color: 'text.secondary' }}>
              <ShoppingBag sx={{ fontSize: 40, mx: 'auto', display: 'block', opacity: 0.4 }} />
              <Typography variant="body1" sx={{ mt: 1 }}>
                {q ? 'কোনো খাবার মেলেনি' : 'খালি মেনু — আমরা কোনো খাবার বলতে পারিনি।'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Unavailable today section */}
      {unavailableFoods.length > 0 && (
        <Box sx={{ px: 2, mb: 2, borderTop: '1px solid #eee', pt: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontWeight: 600 }}>
            <Typography component="span" color="error">
              আজ পাওয়া যাচ্ছে না
            </Typography>{' '}
            {toBnDigits(unavailableFoods.length)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {unavailableFoods.map((food) => (
              <Chip key={food.id} label={`${food.name} — ${formatBDT(food.price)}`} color="warning" size="small" />
            ))}
          </Box>
        </Box>
      )}

      {/* Cart drawer */}
      <Drawer
        anchor="bottom"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        slotProps={{ paper: { sx: { maxHeight: '72vh', overflow: 'auto' } } }}
      >
        {checkoutResult ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
              <CheckCircle color="success" fontSize="large" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
              অর্ডার সম্পন্ন
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', letterSpacing: 0.5, fontWeight: 600, color: '#e65100', my: 1.5 }}>
              {checkoutResult.code}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', textAlign: 'left', maxWidth: 420, margin: '0 auto', background: '#f5f0e8', p: 2, borderRadius: 2 }}>
              {checkoutResult.message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3 }}>
              <Button variant="contained" color="primary" onClick={openOrderWhatsApp} startIcon={<WhatsApp />} sx={{ minWidth: 160 }}>
                WhatsApp এ অর্ডার
              </Button>
              <Button variant="outlined" onClick={copyToClipboardText} startIcon={<Print />}>
                বার্তা কপি
              </Button>
            </Box>
            <Button variant="text" onClick={() => setCartOpen(false)}>
              বন্ধ
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {cartItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Typography variant="body1">কার্ট খালি — খাবার যোগ করুন</Typography>
                <Button variant="contained" color="primary" sx={{ mt: 2, minWidth: 140 }} onClick={scrollToGrid} startIcon={<ArrowBack />}>
                  মেনু দেখুন
                </Button>
              </Box>
            ) : (
              <>
                <List sx={{ mb: 1 }}>
                  {cartItems.map((item) => (
                    <Box key={item.foodId} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid #eee' }}>
                      {item.imageUrl && (
                        <Box component="img" src={item.imageUrl} alt="" sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 2 }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatBDT(item.price * item.qty)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton aria-label={`কমবে ${item.name}`} size="small" disabled={item.qty <= 1} onClick={() => setQty(item.foodId, item.qty - 1)}>
                          <Remove />
                        </IconButton>
                        <Typography variant="body1" sx={{ minWidth: 28, textAlign: 'center' }}>{toBnDigits(item.qty)}</Typography>
                        <IconButton aria-label={`বাড়বে ${item.name}`} size="small" onClick={() => setQty(item.foodId, item.qty + 1)}>
                          <Add />
                        </IconButton>
                        <IconButton aria-label={`সরান ${item.name}`} size="small" color="error" onClick={() => remove(item.foodId)}>
                          <Close />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </List>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatBDT(total)}</Typography>
                  <Button variant="text" startIcon={<Refresh />} onClick={() => clear()}>
                    খালি করুন
                  </Button>
                </Box>
                {priceChangeDialog && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fff4e5', borderRadius: 2 }}>
                    <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
                      মেনুর দাম পরিবর্তন: {priceChangeDialog.changedItems.length > 0 ? priceChangeDialog.changedItems.map((c) => c.name).join(', ') : 'কিছু'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      নতুন মোট: {formatBDT(priceChangeDialog.newTotal)}{' '}
                      {priceChangeDialog.changedItems.map((c) => `${c.name} — ${formatBDT(c.newPrice)}`).join('; ')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button size="small" variant="contained" onClick={confirmPriceChange} color="primary">
                        নতুন মোট দিয়ে অর্ডার করুন
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setPriceChangeDialog(null)}>
                        বাতিল
                      </Button>
                    </Box>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      const message = buildWhatsAppMessage({
                        code: '',
                        items: cartItems,
                        total,
                      })
                      if (restaurant.whatsapp && !openWhatsApp(restaurant.whatsapp, message)) {
                        void copyToClipboard(message)
                      } else if (!restaurant.whatsapp) {
                        void copyToClipboard(message)
                      }
                    }}
                    startIcon={<WhatsApp />}
                  >
                    WhatsApp খুলুন
                  </Button>
                  <Button variant="contained" color="primary" onClick={() => void startCheckout()} startIcon={<Done />}>
                    অর্ডার করুন
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </Drawer>

      {/* Food detail modal */}
      {openDetail && <FoodDetailModal food={openDetail} onClose={() => setOpenDetail(null)} />}

      {/* Snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => snack && closeToast(snack.id)}
        message={snack?.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

    </Box>
  )

  function copyToClipboardText() {
    if (!checkoutResult) return
    void copyToClipboard(checkoutResult.message)
  }
}

function FoodCard({ food, onTap }: { food: PublicFood; onTap: () => void }) {
  const unavailable = !food.available
  return (
    <Card
      sx={{
        height: '100%',
        flex: 1,
        minWidth: { xs: '44vw', sm: 170 },
        maxWidth: 280,
      }}
    >
      <CardActionArea
        onClick={onTap}
        sx={{ height: '100%', borderRadius: 2 }}
        aria-label={`${food.name} — ${formatBDT(food.price)}`}
        data-food-id={food.id}
      >
        {food.imageUrl ? (
          <CardMedia
            component="img"
            height="120"
            image={food.imageUrl}
            alt={food.name}
            sx={{ objectFit: 'cover', background: '#f5f0e8' }}
          />
        ) : (
          <Box
            sx={{
              height: 120,
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
        <CardContent sx={{ p: 1.5, flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {food.name}
            </Typography>
            {unavailable && <Chip label="আজ পাওয়া যাচ্ছে না" size="small" color="warning" />}
          </Box>
          {food.nameEn && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {food.nameEn}
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 700, display: 'block', mt: 1, color: '#e65100' }}>
            {formatBDT(food.price)}
          </Typography>
          {food.badge && (
            <Chip label={food.badge} size="small" color="error" variant="outlined" sx={{ mt: 1, display: 'inline-block' }} />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function HeroCarousel({ heroes }: { heroes: Hero[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (!heroes.length) return null
  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' })
  }
  return (
    <Box sx={{ position: 'relative', mt: 1, overflow: 'hidden' }}>
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollSnapType: 'x mandatory',
          pb: 1,
        }}
        aria-label="হিরো"
      >
        {heroes.map((hero, index) => (
          <HeroCard key={hero.id} hero={hero} index={index} total={heroes.length} />
        ))}
      </Box>
      <IconButton
        size="small"
        aria-label="আগের হিরো"
        sx={{ position: 'absolute', left: 4, top: 'calc(50% - 24px)', zIndex: 1, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)' }}
        onClick={() => scroll(-1)}
      >
        <ArrowBack />
      </IconButton>
      <IconButton
        size="small"
        aria-label="পরের হিরো"
        sx={{ position: 'absolute', right: 4, top: 'calc(50% - 24px)', zIndex: 1, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)' }}
        onClick={() => scroll(1)}
      >
        <ArrowForward />
      </IconButton>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
        {heroes.map((_, i) => (
          <span key={i} aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#e65100' : '#ccc', display: 'inline-block' }} />
        ))}
      </Box>
    </Box>
  )
}

function HeroCard({ hero, index, total }: { hero: Hero; index: number; total: number }) {
  return (
    <Box
      sx={{
        scrollSnapAlign: 'center',
        flexShrink: 0,
        width: { xs: '80vw', sm: 380 },
        maxWidth: 380,
        overflow: 'hidden',
        borderRadius: 12,
        bgcolor: '#f5f0e8',
      }}
    >
      {hero.images.map((image, i) => (
        <Box
          key={i}
          sx={{
            width: '100%',
            height: { xs: 160, sm: 200 },
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 12,
          }}
        >
          {image ? (
            <Box
              component="img"
              src={image}
              alt={hero.title}
              loading="lazy"
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>
              ছবি নেই
            </Box>
          )}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              padding: { xs: 1.5, sm: 2 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#fff',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
              {hero.title}
            </Typography>
            {hero.subtitle && (
              <Typography component="span" variant="body2" sx={{ display: 'block', mt: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                {hero.subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5, pb: 0.5 }} aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{ width: 6, height: 6, borderRadius: '50%', background: i === index ? '#e65100' : '#ccc', display: 'inline-block' }}
          />
        ))}
      </Box>
    </Box>
  )
}
