// app/share/food/[id]/image/route.ts — 1200×630 food share card (PNG).
import { ImageResponse } from 'next/og'
import { db, publicFoodById } from '@/db/store'
import { formatBDT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const FONT =
  'Noto Sans Bengali, Bangla Solveig, Helvetica, sans-serif'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const food = publicFoodById(id, new Date())
  if (!food) return new Response('Food not found', { status: 404 })
  const restaurant = db.restaurants.find(food.restaurantId)

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 48,
        background: '#f8f5f2',
        color: '#2b2d31',
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#e65100', fontWeight: 700, fontSize: 36 }}>
        <span>{restaurant?.name ?? ''}</span>
        <span style={{ color: '#2b2d31', opacity: 0.4 }}>•</span>
        <span style={{ color: '#e65100' }}>খাবার</span>
      </div>
      <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, lineHeight: 1.1, overflowWrap: 'anywhere' }}>{food.name}</div>
      {food.nameEn && <div style={{ display: 'flex', fontSize: 40, color: '#5a5f66', marginTop: 8 }}>{food.nameEn}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px',
            border: '3px solid #e65100',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 40,
            color: '#e65100',
            background: '#fff8e1',
          }}
        >
          {formatBDT(food.price)}
        </div>
        {food.badge && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              border: '3px solid #e65100',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 30,
              color: '#e65100',
              background: '#fff8e1',
            }}
          >
            {food.badge}
          </div>
        )}
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
