// db/passwords.ts — PBKDF2 password hashing (node:crypto only, no native deps).
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

export interface PasswordEntry {
  passwordHash: string
  passwordSalt: string
}

export const PASSWORD_ITERATIONS = 120_000

export function hashPassword(password: string): PasswordEntry {
  const passwordSalt = randomBytes(16).toString('hex')
  const passwordHash = pbkdf2Sync(
    password,
    passwordSalt,
    PASSWORD_ITERATIONS,
    32,
    'sha256',
  ).toString('hex')
  return { passwordHash, passwordSalt }
}

export function verifyPassword(
  password: string,
  entry: PasswordEntry,
): boolean {
  if (!entry || typeof entry.passwordHash !== 'string') return false
  if (typeof entry.passwordSalt !== 'string' || entry.passwordSalt.length === 0) {
    return false
  }
  const hash = pbkdf2Sync(
    password,
    entry.passwordSalt,
    PASSWORD_ITERATIONS,
    32,
    'sha256',
  ).toString('hex')
  const actual = Buffer.from(entry.passwordHash, 'utf8')
  const expected = Buffer.from(hash, 'utf8')
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export function newToken(): string {
  return randomBytes(32).toString('hex')
}

export function randomId(): string {
  return randomBytes(16).toString('hex')
}
