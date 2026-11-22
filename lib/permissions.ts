// lib/permissions.ts — client-safe permission helpers.
export interface PermissionSubject {
  permissions: string[]
}

export function can(staff: PermissionSubject, action: string): boolean {
  return staff.permissions.includes(action)
}
