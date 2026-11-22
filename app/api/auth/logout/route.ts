// app/api/auth/logout/route.ts
import { cookies } from 'next/headers'
import { db } from '@/db/store'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    const session = db.sessions.findOne((s) => s.token === token)
    if (session) db.sessions.remove(session.id)
  }
  return Response.json({ ok: true })
}
