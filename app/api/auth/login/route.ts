// app/api/auth/login/route.ts — staff login API. Sets a session cookie.
import { loginStaff, AuthError, SESSION_COOKIE } from '@/lib/auth'

function getIp(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return req.headers.get('x-real-ip') ?? undefined
}

interface Body {
  phoneOrEmail?: string
  phone?: string
  email?: string
  password?: string
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({} as Body))
  const phoneOrEmail =
    (body.phoneOrEmail ?? body.phone ?? body.email ?? '').toString().trim()
  const password = (body.password ?? '').toString()

  try {
    const { staff, session } = await loginStaff(phoneOrEmail, password, getIp(req))
    const secure = new URL(req.url).protocol === 'https:'
    const setCookie = [
      `${SESSION_COOKIE}=${session.token}`,
      `Path=/; Max-Age=${Math.floor(session.expiresAt / 1000 - Date.now() / 1000)}; SameSite=Lax; HttpOnly${secure ? '; Secure' : ''}`,
    ].join('; ')
    return Response.json(
      { ok: true, staff: { id: staff.id, name: staff.name, role: staff.role, phone: staff.phone } },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': setCookie,
        },
      },
    )
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === 'invalid' ? 401 : 403
      return Response.json(
        { ok: false, message: error.message, code: error.code },
        { status },
      )
    }
    return Response.json({ ok: false, message: 'Login failed', code: 'server_error' }, { status: 500 })
  }
}
