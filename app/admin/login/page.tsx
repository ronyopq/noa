import { redirect } from 'next/navigation'
import { db } from '@/db/store'
import { getStaff } from '@/lib/auth'
import LoginForm from '@/components/LoginForm'

export default async function AdminLoginPage() {
  const staff = await getStaff()
  if (staff) redirect('/admin')

  return (
    <Box className="menu-topbar" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <LoginForm restaurantName={db.restaurants.list()[0]?.name ?? 'NOA Cafe'} />
    </Box>
  )
}

// local wrapper to avoid importing Box at top level for client components
import Box from '@mui/material/Box'
