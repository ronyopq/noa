'use client'

// components/AdminShell.tsx — admin topbar + sidebar with role-gated navigation.
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  AccountBalance,
  AccountCircle,
  BarChart,
  Comment,
  Dashboard,
  Delete,
  Edit,
  ExitToApp,
  Flag,
  Games,
  Help,
  History,
  List as ListIcon,
  Menu as MenuIcon,
  ModeEdit,
  PlayArrow,
  PointOfSale,
  ReceiptLong,
  Restore,
  Save,
  Settings,
  ShoppingBag,
  Star,
  StarBorder,
  TimeToLeaveOutlined,
  Timeline,
  Timer,
  ViewList,
} from '@mui/icons-material'

import type { StaffUser } from '@/lib/auth'
import { can } from '@/lib/permissions'

const NAV: {
  label: string
  href: string
  icon: React.ReactNode
  action?: string
}[] = [
  { label: 'ড্যাশবোর্ড', href: '/admin', icon: <Dashboard /> },
  { label: 'মেনু ম্যানেজমেন্ট', href: '/admin/menu', icon: <ShoppingBag />, action: 'menu:manage' },
  { label: 'হিরোস', href: '/admin/heroes', icon: <Star />, action: 'menu:manage' },
  { label: 'স্পেশালস', href: '/admin/specials', icon: <Flag />, action: 'menu:manage' },
  { label: 'অর্ডারস', href: '/admin/orders', icon: <History />, action: 'orders:manage' },
  { label: 'POS', href: '/admin/pos', icon: <PointOfSale />, action: 'pos:use' },
  { label: 'ক্যাশ ক্লোজিং', href: '/admin/cash-closing', icon: <AccountBalance />, action: 'cash:close' },
  { label: 'সেটিংস', href: '/admin/settings', icon: <Settings />, action: 'settings:manage' },
  { label: 'স্টাফ', href: '/admin/staff', icon: <AccountCircle />, action: 'staff:manage' },
  { label: 'গেমস', href: '/admin/games', icon: <Games />, action: 'games:manage' },
  { label: 'রিপোর্টস', href: '/admin/reports', icon: <BarChart />, action: 'reports:view' },
  { label: 'কমেন্টস', href: '/admin/comments', icon: <Comment />, action: 'comments:manage' },
]

const HIDDEN_MOBILE_MESSAGE = 'POS, ক্যাশ ক্লোজিং, সেটিংস, স্টাফ, রিপোর্টস — স্টাফ সাইড ক্যাবেট এবং কলাবরেট অনুমতি থাকলেও, অপশন করে বাকি পেজ।'

const DRAWER_WIDTH = 240

export default function AdminShell({ staff, children }: { staff: StaffUser; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const visibleNav = NAV.filter((item) => !item.action || can(staff, item.action))

  const drawer = (
    <List component="nav" sx={{ width: DRAWER_WIDTH, py: 0 }} aria-label="অ্যাডমিন ন্যাভিগেশন">
      <Box sx={{ p: 2.5, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>NOA Cafe</Typography>
        <Typography variant="body2" color="text.secondary">অ্যাডমিন — {staff.role}</Typography>
      </Box>
      <Divider />
      {visibleNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <ListItem
            key={item.href}
            component={Link}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            sx={active ? { bgcolor: '#fff4e5' } : undefined}
          >
            <ListItemIcon>
              <Box sx={{ fontSize: 18, display: 'flex', alignItems: 'center', width: 20 }}>{item.icon}</Box>
            </ListItemIcon>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: active ? 700 : 500, fontSize: '0.94rem' }}>{item.label}</Typography>}
            />
          </ListItem>
        )
      })}
      <Divider />
      <ListItem sx={{ p: 1.5 }}>
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Help />
        </ListItemIcon>
        <ListItemText
          primary={<Typography variant="body2" color="text.secondary">ফোন: +8801700000421 · ঠিকানা: North Road, Chittagong</Typography>}
        />
      </ListItem>
    </List>
  )

  return (
    <Box component="div" sx={{ display: 'flex', minHeight: '100vh', background: '#f8f5f2' }}>
      <AppBar
        position="sticky"
        color="inherit"
        sx={{
          background: '#ffffff',
          color: '#2b2d31',
          borderBottom: '1px solid #eae7e2',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 }, gap: 2 }} aria-label="অ্যাডমিন টুলবার">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile ? (
              <Tooltip title="অ্যাডমিন মেনু খুলুন">
                <IconButton
                  color="inherit"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="অ্যাডমিন মেনু খুলুন"
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            ) : null}
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 18 } }}>
                NOA Cafe — অ্যাডমিন
              </Typography>
            </Link>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Chip label={staff.role} color={staff.role === 'owner' ? 'primary' : 'default'} size="small" aria-label="স্টাফ রোল" />
            <Typography variant="body2" sx={{ color: '#5a5f66' }}>
              {HIDDEN_MOBILE_MESSAGE}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTH,
              border: 'none',
              background: '#ffffff',
            },
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, padding: { xs: 1.5, sm: 3 }, pt: 10, pb: 6 }}>
        {children}
      </Box>
    </Box>
  )
}
