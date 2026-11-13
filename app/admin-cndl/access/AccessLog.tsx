'use client';
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';
import { EmptyState, Panel, Skeleton } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import type { ErpUser } from '../_lib/types';
import type { AccessLogEntry, RoleRow } from './types';

const label = (k: string) => PERMISSIONS.find((p) => p.key === k)?.label ?? k;
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Latest role and access changes, newest first. */
export function AccessLog({ roles, version }: { roles: RoleRow[]; version: number }) {
  const { adminFetch } = useAdmin();
  const [entries, setEntries] = useState<AccessLogEntry[] | null>(null);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [logRes, userRes] = await Promise.all([adminFetch('/api/admin/erp/access-log'), adminFetch('/api/admin/erp/users')]);
        if (!live) return;
        if (!logRes.ok) return void setFailed(true);
        const log = await logRes.json().catch(() => ({}));
        const people: { users?: ErpUser[] } = userRes.ok ? await userRes.json().catch(() => ({})) : {};
        setUsers(Object.fromEntries((people.users ?? []).map((u) => [u.id, u.name])));
        setEntries(log.entries ?? []);
        setFailed(false);
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [adminFetch, version]);

  const roleName = (key: string | null, fallback?: string) => (key ? roles.find((r) => r.key === key)?.name ?? fallback ?? key : '—');

  const describe = (e: AccessLogEntry) => {
    const role = roleName(e.roleKey, e.after?.name ?? e.before?.name);
    switch (e.action) {
      case 'ROLE_CREATE':
        return { title: `Created role “${e.after?.name ?? role}”`, detail: `${e.after?.permissions?.length ?? 0} permissions` };
      case 'ROLE_DELETE':
        return { title: `Deleted role “${e.before?.name ?? role}”` };
      case 'ROLE_UPDATE': {
        const b = new Set(e.before?.permissions ?? []);
        const a = new Set(e.after?.permissions ?? []);
        const added = [...a].filter((k) => !b.has(k)).map(label);
        const removed = [...b].filter((k) => !a.has(k)).map(label);
        const renamed = e.before?.name && e.after?.name && e.before.name !== e.after.name ? `Renamed from “${e.before.name}”. ` : '';
        return {
          title: `Changed role “${e.after?.name ?? role}”`,
          detail: [renamed, added.length ? `Added: ${added.join(', ')}.` : '', removed.length ? `Removed: ${removed.join(', ')}.` : ''].filter(Boolean).join(' ') || 'No permission change.',
        };
      }
      case 'USER_ROLE_CHANGE': {
        const who = e.targetUserId ? users[e.targetUserId] ?? 'A team member' : 'A team member';
        const to = roleName(e.after?.roleKey ?? e.roleKey);
        return e.before?.roleKey
          ? { title: `${who} moved to ${to}`, detail: `Was ${roleName(e.before.roleKey)}` }
          : { title: `${who} given the role ${to}` };
      }
      default:
        return { title: e.action };
    }
  };

  return (
    <Panel title="Change history" description="Every role and access change, newest first (last 200)." bodyClassName="p-0">
      {failed ? (
        <div className="p-4">
          <EmptyState icon={History} title="Could not load the history" />
        </div>
      ) : !entries ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : entries.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={History} title="No changes yet" />
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {entries.map((e) => {
            const d = describe(e);
            return (
              <li key={e.id} className="px-4 py-3 sm:px-5">
                <p className="text-table font-medium text-zinc-900">{d.title}</p>
                {d.detail && <p className="mt-0.5 text-meta text-zinc-600">{d.detail}</p>}
                <p className="mt-0.5 text-meta text-zinc-500">
                  {e.performedByName ?? 'Unknown'} · {when(e.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
