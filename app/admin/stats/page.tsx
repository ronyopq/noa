// app/admin/stats/page.tsx — admin stats dashboard.
import { db } from '@/db/store'
import { can, requireStaff } from '@/lib/auth'
import { Box, Typography } from '@mui/material'
import {
  Comment,
  History,
  PointOfSale,
  TrendingUp,
  VisibilityOff,
} from '@mui/icons-material'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { formatBDT } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  color?: 'primary' | 'error' | 'warning' | 'success' | 'secondary'
}

function StatCard({ label, value, icon: iconNode, color = 'primary' }: StatCardProps) {
  const paletteColor = color as keyof import('@mui/material/styles').Theme['palette']
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ color: `${paletteColor}.main`, display: 'flex', alignItems: 'center' }}>
        {iconNode}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
      </Box>
    </Box>
  )
}

function PlainList({ children }: { children: React.ReactNode }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {children}
    </Box>
  )
}

export default async function StatsPage() {
  const staff = await requireStaff()
  const restaurant = staff.restaurantId ? db.restaurants.find(staff.restaurantId) : undefined
  if (!restaurant) notFound()

  const orders = db.orders
    .where((o) => o.restaurantId === restaurant.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const confirmedOrders = db.orders.where((o) => o.restaurantId === restaurant.id && o.paymentStatus === 'paid')
  const revenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0)
  const unpublishedFoods = db.foods.where((f) => f.restaurantId === restaurant.id && !f.isPublished).length
  const pendingComments = db.comments.where((c) => c.restaurantId === restaurant.id && !c.isPublished).length
  const activeStaffCount = db.staffMemberships.where((m) => m.restaurantId === restaurant.id && m.status === 'active').length

  const recentBills = db.bills
    .where((b) => b.paymentStatus === 'paid')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
  const recentRevenue = recentBills.reduce((sum, b) => sum + b.total, 0)

  return (
    <>
      <h1 style={{ fontWeight: 700, marginBottom: 24 }}>স্ট্যাটস</h1>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
        <StatCard label="আজকের অর্ডার" value={String(orders.length)} icon={<PointOfSale />} />
        <StatCard label="নিশ্চিত অর্ডার" value={String(confirmedOrders.length)} icon={<History />} color="warning" />
        <StatCard label="আজকের আয়" value={formatBDT(revenue)} icon={<TrendingUp />} color="success" />
        <StatCard label="অপ্রকাশিত খাবার" value={String(unpublishedFoods)} icon={<VisibilityOff />} color="error" />
        {pendingComments > 0 && can(staff, 'comments:manage') && (
          <StatCard label="নতুন মন্তব্য" value={String(pendingComments)} icon={<Comment />} color="warning" />
        )}
      </Box>

      {/* Recent orders */}
      <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>সাম্প্রতিক অর্ডার</Typography>
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <PlainList>
          {orders.slice(-8).map((o) => (
            <li key={o.id}>
              <Typography variant="body2">
                {o.code} — {o.status} · {formatBDT(o.total)}
              </Typography>
            </li>
          ))}
          {orders.length === 0 ? <Typography variant="body2">আজ কোনো অর্ডার নেই।</Typography> : null}
        </PlainList>
      </Box>

      {/* Recent payments + staff count */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 2 }}>
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>সাম্প্রতিক পেমেন্টস</Typography>
          <PlainList>
            {recentBills.map((b) => (
              <li key={b.id}>
                <Typography variant="body2">
                  {b.paymentMethod} · {formatBDT(b.total)} · {new Date(b.updatedAt).toLocaleDateString('bn-BD')}
                </Typography>
              </li>
            ))}
            {recentBills.length === 0 ? <Typography variant="body2">পেমেন্ট নেই।</Typography> : null}
          </PlainList>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Paid সংকলন: {formatBDT(recentRevenue)}
          </Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>স্টাফ ম্যানেজমেন্ট</Typography>
          <Typography variant="body2" color="text.secondary">
            স্টাফ প্যানেলে আপলোড করে নতুন স্টাফ নিয়োগ ও পাসওয়ার্ড পরিবর্তন করুন। স্টাফ: {activeStaffCount} জন সক্রিয়।
          </Typography>
        </Box>
      </Box>
    </>
  )
}
