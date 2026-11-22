// app/share/menu/[slug]/image/route.ts — 1200×630 menu share card (PNG).
import { ImageResponse } from 'next/og'
import { publicRestaurant } from '@/db/store'

export const dynamic = 'force-dynamic'

const FONT = 'Noto Sans Bengali, Bangla Solveig, Helvetica, sans-serif'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params
  const restaurant = publicRestaurant(slug)
  if (!restaurant) return new Response('Restaurant not found', { status: 404 })

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
        <span>{restaurant.name}</span>
        <span style={{ color: '#2b2d31', opacity: 0.4 }}>•</span>
        <span style={{ color: '#e65100' }}>মেনু</span>
      </div>
      <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, lineHeight: 1.1, overflowWrap: 'anywhere' }}>{restaurant.name}</div>
      {restaurant.address && <div style={{ display: 'flex', fontSize: 32, color: '#5a5f66', marginTop: 8 }}>{restaurant.address}</div>}
      {restaurant.phone && <div style={{ display: 'flex', fontSize: 32, color: '#e65100', fontWeight: 700, marginTop: 8 }}>{restaurant.phone}</div>}
      <div style={{ display: 'flex', fontSize: 32, color: '#9a9fa5', marginTop: 16 }}>{restaurant.name} — অনলাইন মেনু, কার্ট, WhatsApp অর্ডার</div>
    </div>,
    { width: 1200, height: 630 },
  )
}
