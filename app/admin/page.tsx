// app/admin/page.tsx — admin dashboard.
import { Typography, Box } from '@mui/material'
import {
  BarChart,
  Comment,
  History,
  PointOfSale,
  TrendingUp,
  VisibilityOff,
} from '@mui/icons-material'
import { db } from '@/db/store'
import { getStaff, can } from '@/lib/auth'
import { formatBDT } from '@/lib/utils'
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

export default async function AdminDashboardPage() {
  const staff = (await getStaff())!
  const today = new Date().toISOString().slice(0, 10)
  const restaurant = db.restaurants.list()[0]

  const orders = db.orders
    .where((o) => o.createdAt.slice(0, 10) === today)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const confirmedOrders = orders.filter((o) => o.status !== 'pending')
  const revenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0)
  const pendingComments = db.comments.where((c) => c.restaurantId === restaurant?.id && !c.isApproved)
  const unpublishedFoods = db.foods.where((f) => f.restaurantId === restaurant?.id && !f.isPublished).length
  const activeStaffCount = db.staffMemberships.where((m) => m.restaurantId === restaurant?.id && m.status === 'active').length
  const recentPayments = db.payments.where((p) => p.status === 'paid').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
  const recentRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>ড্যাশবোর্ড</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {restaurant ? `${restaurant.name} — ${restaurant.slug}` : 'NOA Cafe'} · বর্তমান তারিখ: {new Date().toLocaleDateString('bn-BD')}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="আজকের অর্ডার" value={String(orders.length)} icon={<PointOfSale />} />
        <StatCard label="নিশ্চিত অর্ডার" value={String(confirmedOrders.length)} icon={<History />} color="warning" />
        <StatCard label="আজকের আয়" value={formatBDT(revenue)} icon={<TrendingUp />} color="success" />
        <StatCard label="অপ্রকাশিত খাবার" value={String(unpublishedFoods)} icon={<VisibilityOff />} color="error" />
      </Box>

      {pendingComments.length > 0 && can(staff, 'comments:manage') && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <StatCard label="নতুন মন্তব্য" value={String(pendingComments.length)} icon={<Comment />} color="warning" />
        </Box>
      )}

      {/* Recent orders */}
      <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>সাম্প্রতিক অর্ডার</Typography>
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <PlainList>
          {orders
            .slice(-8)
            .map((o) => (
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
            {recentPayments.map((p) => (
              <li key={p.id}>
                <Typography variant="body2">
                  {p.method} · {formatBDT(p.amount)} · {new Date(p.settledAt ?? p.createdAt).toLocaleDateString('bn-BD')}
                </Typography>
              </li>
            ))}
            {recentPayments.length === 0 ? <Typography variant="body2">পেমেন্ট নেই।</Typography> : null}
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
    </Box>
  )
}
