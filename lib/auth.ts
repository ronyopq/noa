// lib/auth.ts — server-only staff authentication (login, session, permissions).
// Never import this from client components.
import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { db, now, nextId } from '@/db/store'
import { verifyPassword } from '@/db/passwords'
import type {
  StaffMembership,
  StaffRole,
  Session,
  User,
} from '@/db/types'

export const SESSION_COOKIE = 'noa-staff-session'
export const ADMIN_PATH = '/admin'
export const LOGIN_PATH = '/admin/login'

export class AuthError extends Error {
  code: string
  constructor(message: string, code = 'auth') {
    super(message)
    this.code = code
  }
}

export const ACTIONS = [
  'menu:view',
  'menu:edit',
  'menu:publish',
  'menu:manage',
  'orders:view',
  'orders:manage',
  'pos:use',
  'pos:discount',
  'pos:counter',
  'cash:close',
  'cash:manage',
  'reports:view',
  'staff:manage',
  'settings:manage',
  'comments:view',
  'comments:manage',
  'games:manage',
] as const

export type Action = (typeof ACTIONS)[number]

export const ROLE_ACTIONS: Record<StaffRole, string[]> = {
  owner: [...ACTIONS],
  manager: [
    'menu:view',
    'menu:edit',
    'menu:publish',
    'menu:manage',
    'orders:view',
    'orders:manage',
    'pos:use',
    'pos:discount',
    'pos:counter',
    'cash:close',
    'cash:manage',
    'reports:view',
    'comments:view',
    'comments:manage',
    'games:manage',
  ],
  staff: ['menu:view', 'orders:view', 'pos:use', 'comments:view', 'games:view'],
  cashier: [
    'orders:view',
    'pos:use',
    'pos:counter',
    'cash:close',
    'cash:manage',
  ],
}

export function effectivePermissions(
  user: User,
  membership: StaffMembership,
): string[] {
  return [
    ...new Set([
      ...(ROLE_ACTIONS[user.role] ?? []),
      ...(membership.permissions ?? []),
    ]),
  ]
}

export { can } from '@/lib/permissions'

export interface StaffUser {
  id: string
  name: string
  email: string
  phone: string
  status: User['status']
  role: StaffRole
  restaurantId: string
  membership: StaffMembership
  permissions: string[]
}

export function staffFromUser(user: User, membership: StaffMembership): StaffUser {
  return {
    ...user,
    restaurantId: membership.restaurantId,
    membership,
    permissions: effectivePermissions(user, membership),
  }
}

export async function getStaff(): Promise<StaffUser | null> {
  try {
    return await requireStaff()
  } catch {
    return null
  }
}

export async function requireStaff(): Promise<StaffUser> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) throw new AuthError('No session cookie')

  const session = db.sessions.findOne((s) => s.token === raw)
  if (!session) throw new AuthError('No matching session')

  const expiresAt = new Date(session.expiresAt).getTime()
  if (expiresAt <= Date.now()) {
    db.sessions.remove(session.id)
    throw new AuthError('Session expired')
  }

  const user = db.users.find(session.userId)
  if (!user) throw new AuthError('User not found')
  if (user.status !== 'active') throw new AuthError('Account suspended')

  const membership = db.staffMemberships.findOne(
    (m) => m.userId === user.id && m.status === 'active',
  )
  if (!membership) throw new AuthError('No active staff membership')
  if (membership.restaurantId !== user.restaurantId && user.restaurantId) {
    throw new AuthError('Restaurant mismatch')
  }

  const staff = staffFromUser(user, membership)

  // touch lastSeen (cheap, keeps the analytics window fresh)
  db.sessions.touch(session.id, { lastSeenAt: now() })

  return staff
}

export function createSession(
  userId: string,
  ip?: string,
): Session {
  const session: Session = {
    id: nextId('SESS', 6),
    userId,
    token: randomBytes(32).toString('hex'),
    expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
    createdAt: now(),
    lastSeenAt: now(),
    ip,
  }
  db.sessions.add(session)
  return session
}

export async function loginStaff(
  phoneOrEmail: string,
  password: string,
  ip?: string,
): Promise<{ staff: StaffUser; session: Session; cookieValue: string }> {
  const trimmed = phoneOrEmail.trim()
  if (!trimmed || !password) {
    throw new AuthError('Phone or email and password are required')
  }

  const user =
    db.users.findOne((u) => u.phone.toLowerCase() === trimmed.toLowerCase()) ??
    db.users.findOne((u) => u.email.toLowerCase() === trimmed.toLowerCase())

  if (!user) throw new AuthError('Account not found', 'invalid')

  // Real staff login: verify the password first.
  if (!verifyPassword(password, {
    passwordHash: user.passwordHash,
    passwordSalt: user.passwordSalt,
  })) {
    throw new AuthError('Invalid password', 'invalid')
  }

  if (user.status !== 'active') throw new AuthError('Account suspended')

  // Server + database restaurant membership verification (master spec).
  const membership = db.staffMemberships.findOne(
    (m) => m.userId === user.id && m.status === 'active',
  )
  if (!membership) throw new AuthError('No active staff membership', 'inactive')
  if (membership.restaurantId !== user.restaurantId && user.restaurantId) {
    throw new AuthError('Restaurant mismatch', 'inactive')
  }

  const restaurant = db.restaurants.find(membership.restaurantId)
  if (!restaurant) throw new AuthError('Restaurant not found', 'inactive')

  const staff = staffFromUser(user, membership)
  const session = createSession(user.id, ip)
  return { staff, session, cookieValue: session.token }
}
