import { z } from 'zod';
import { isKnownPermission, isLockedPermission, PERMISSIONS } from '@/lib/permissions';

/** Body of "create role". */
export const roleBodySchema = z.object({
  name: z.string().trim().min(2, 'Give the role a name (at least 2 characters)').max(60),
  description: z.string().trim().max(300).nullish(),
  permissions: z.array(z.string().max(80)).max(200),
});

/**
 * Rejects unknown permission keys and the locked ones (Super Admin only, never grantable to any other role).
 * Returns the cleaned, sorted list, or the error to show.
 */
export function checkPermissionList(list: string[]): { ok: true; permissions: string[] } | { ok: false; error: string } {
  const unknown = list.filter((k) => !isKnownPermission(k));
  if (unknown.length) return { ok: false, error: `Unknown permission: ${unknown[0]}` };
  const locked = list.filter(isLockedPermission);
  if (locked.length) {
    const label = PERMISSIONS.find((p) => p.key === locked[0])?.label ?? locked[0];
    return { ok: false, error: `“${label}” is reserved for Super Admin and cannot be given to any other role` };
  }
  return { ok: true, permissions: [...new Set(list)].sort() };
}
