import { redirect } from 'next/navigation'
import { getStaff } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff()
  if (!staff) redirect('/admin/login')
  return <AdminShell staff={staff}>{children}</AdminShell>
}
