'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, History, Lock, Plus, RotateCcw, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { BUILTIN_ROLES, SUPERADMIN_KEY } from '@/lib/permissions';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Panel, Segmented } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import { apiError } from '../_lib/utils';
import { NewRoleDialog } from './NewRoleDialog';
import { AccessLog } from './AccessLog';
import type { CatalogPermission, RoleRow } from './types';

type View = 'roles' | 'log';

/** "All" and "own only" permissions that are really one choice, shown as None / Own / All. */
const SCOPES: { group: string; all: string; own: string; label: string; hint: string }[] = [
  { group: 'Cases', all: 'cases.view', own: 'cases.view_own', label: 'Which cases they see', hint: 'Own = only cases credited to them (field agents).' },
  { group: 'Clients', all: 'clients.view', own: 'clients.view_own', label: 'Which client accounts they see', hint: 'Own = only clients assigned to them.' },
  { group: 'Dues and collections', all: 'ledger.view', own: 'ledger.view_own', label: 'Which invoices and collections they see', hint: 'Own = entries for their clients or collected by them.' },
  { group: 'Dues and collections', all: 'ledger.collect', own: 'ledger.collect_own', label: 'Recording collections', hint: 'Own = only for their own clients, and they cannot verify their own cash.' },
];
const SCOPED_KEYS = new Set(SCOPES.flatMap((s) => [s.all, s.own]));

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');
const sameSet = (a: Iterable<string>, b: Iterable<string>) => {
  const x = [...a].sort().join('|');
  const y = [...b].sort().join('|');
  return x === y;
};

export default function AccessPage() {
  const { adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogPermission[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [view, setView] = useState<View>('roles');
  const [selected, setSelected] = useState<string>('');
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cloneOf, setCloneOf] = useState('');
  const [logVersion, setLogVersion] = useState(0);

  const role = roles.find((r) => r.key === selected) ?? null;
  const isSuper = role?.key === SUPERADMIN_KEY;

  const select = useCallback((r: RoleRow | undefined) => {
    setSelected(r?.key ?? '');
    setDraftName(r?.name ?? '');
    setDraftDesc(r?.description ?? '');
    setDraft(new Set(r?.permissions ?? []));
  }, []);

  const fetchData = useCallback(
    async (isRefresh = false, keepKey?: string) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await adminFetch('/api/admin/erp/roles');
        if (res.status === 401) return;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return void toast.error(apiError(body, 'Could not load the roles'));
        const list: RoleRow[] = body.roles ?? [];
        setRoles(list);
        setCatalog(body.catalog?.permissions ?? []);
        setGroups(body.catalog?.groups ?? []);
        setLastSyncedAt(Date.now());
        setSelected((cur) => {
          const key = keepKey ?? cur;
          const next = list.find((r) => r.key === key) ?? list.find((r) => r.key !== SUPERADMIN_KEY) ?? list[0];
          select(next);
          return next?.key ?? '';
        });
      } catch {
        toast.error('Failed to load the roles');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adminFetch, select]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const dirty = !!role && !isSuper && (draftName.trim() !== role.name || (draftDesc.trim() || '') !== (role.description ?? '') || !sameSet(draft, role.permissions));
  const builtin = role?.isBuiltIn ? BUILTIN_ROLES.find((b) => b.key === role.key) : undefined;
  const atDefault = !!builtin && sameSet(draft, builtin.permissions) && draftName.trim() === builtin.name;

  const toggle = (key: string) =>
    setDraft((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const setScope = (s: (typeof SCOPES)[number], level: 'none' | 'own' | 'all') =>
    setDraft((cur) => {
      const next = new Set(cur);
      next.delete(s.all);
      next.delete(s.own);
      if (level === 'all') next.add(s.all);
      if (level === 'own') next.add(s.own);
      return next;
    });

  const grouped = useMemo(
    () =>
      groups
        .map((g) => ({ group: g, items: catalog.filter((p) => p.group === g && !SCOPED_KEYS.has(p.key)), scopes: SCOPES.filter((s) => s.group === g) }))
        .filter((g) => g.items.length || g.scopes.length),
    [groups, catalog]
  );

  const save = async () => {
    if (!role || !dirty) return;
    if (draftName.trim().length < 2) return void toast.error('Give the role a name (at least 2 characters)');
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/erp/roles/${role.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draftName.trim(), description: draftDesc.trim() || null, permissions: [...draft] }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the role'));
      toast.success(`${draftName.trim()} saved — applies to ${role.userCount === 1 ? '1 person' : `${role.userCount} people`} straight away`);
      setLogVersion((v) => v + 1);
      await fetchData(true, role.key);
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!role || role.isBuiltIn) return;
    if (!(await askConfirm(`Delete the role “${role.name}”? This cannot be undone.`))) return;
    try {
      const res = await adminFetch(`/api/admin/erp/roles/${role.key}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the role'));
      toast.success(`${role.name} deleted`);
      setLogVersion((v) => v + 1);
      await fetchData(true, 'CHAIRMAN');
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const resetToDefault = () => {
    if (!builtin) return;
    setDraftName(builtin.name);
    setDraft(new Set(builtin.permissions));
  };

  const kpis: Kpi[] = [
    { label: 'Roles', value: String(roles.length), icon: ShieldCheck, sub: `${roles.filter((r) => !r.isBuiltIn).length} custom` },
    { label: 'People with a role', value: String(roles.reduce((s, r) => s + r.userCount, 0)), icon: Users, sub: 'Team members' },
  ];

  return (
    <SectionFrame
      tab="access"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => {
        void fetchData(true);
        setLogVersion((v) => v + 1);
      }}
      description="Choose what each role can see and do. Changes apply to everyone in that role straight away, with no re-login."
      actions={
        <Button variant="primary" icon={Plus} onClick={() => { setCloneOf(''); setCreating(true); }}>
          <span className="hidden sm:inline">New role</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <Segmented<View>
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'roles', label: 'Roles' },
            { value: 'log', label: 'Change history' },
          ]}
        />
      </div>

      {view === 'log' ? (
        <AccessLog roles={roles} version={logVersion} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <nav aria-label="Roles" className="space-y-1.5">
            {roles.map((r) => {
              const on = r.key === selected;
              return (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => select(r)}
                  className={cx(
                    'flex min-h-[52px] w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                    on ? 'border-brand-500 bg-brand-50' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-table font-medium text-zinc-900">{r.name}</span>
                    {r.description && <span className="block truncate text-meta text-zinc-600">{r.description}</span>}
                    <span className="block text-meta text-zinc-500">
                      {r.userCount === 1 ? '1 person' : `${r.userCount} people`}
                      {r.key === SUPERADMIN_KEY ? ' · everything' : ` · ${r.permissions.length} permissions`}
                    </span>
                  </span>
                  {r.isBuiltIn ? <Badge>Built-in</Badge> : <Badge tone="brand">Custom</Badge>}
                </button>
              );
            })}
          </nav>

          {role ? (
            <Panel
              title={isSuper ? role.name : undefined}
              description={isSuper ? 'Super Admin always has every permission and cannot be edited.' : undefined}
              bodyClassName="space-y-5 py-4"
            >
              {!isSuper && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="block text-table font-medium text-zinc-700">Role name</span>
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      maxLength={60}
                      className="block h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-body text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-table font-medium text-zinc-700">What it is for</span>
                    <input
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value)}
                      maxLength={300}
                      placeholder="Optional"
                      className="block h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-body text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </label>
                </div>
              )}

              <div className="space-y-4">
                {grouped.map(({ group, items, scopes }) => (
                  <fieldset key={group} className="rounded-lg border border-zinc-200">
                    <legend className="ml-3 px-1.5 text-meta font-semibold uppercase tracking-wide text-zinc-500">{group}</legend>
                    <ul className="divide-y divide-zinc-100">
                      {scopes.map((s) => {
                        const level = isSuper || draft.has(s.all) ? 'all' : draft.has(s.own) ? 'own' : 'none';
                        const name = `scope-${s.all}`;
                        return (
                          <li key={s.all} className="px-3 py-2.5">
                            <p className="text-table font-medium text-zinc-900">{s.label}</p>
                            <p className="text-meta text-zinc-500">{s.hint}</p>
                            <div role="radiogroup" aria-label={s.label} className="mt-2 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                              {(['none', 'own', 'all'] as const).map((lv) => (
                                <label
                                  key={lv}
                                  className={cx(
                                    'inline-flex min-h-[36px] min-w-[64px] items-center justify-center rounded-md px-3 text-table font-medium',
                                    isSuper ? 'cursor-not-allowed' : 'cursor-pointer',
                                    level === lv ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                                  )}
                                >
                                  <input type="radio" name={name} value={lv} checked={level === lv} disabled={isSuper} onChange={() => setScope(s, lv)} className="sr-only" />
                                  {lv === 'none' ? 'None' : lv === 'own' ? 'Own' : 'All'}
                                </label>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                      {items.map((p) => {
                        const locked = !!p.locked;
                        const checked = isSuper || (!locked && draft.has(p.key));
                        return (
                          <li key={p.key}>
                            <label className={cx('flex min-h-[44px] items-start gap-3 px-3 py-2.5', locked || isSuper ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-50')}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={locked || isSuper}
                                onChange={() => toggle(p.key)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                              />
                              <span className="min-w-0">
                                <span className={cx('flex flex-wrap items-center gap-2 text-table font-medium', locked ? 'text-zinc-500' : 'text-zinc-900')}>
                                  {p.label}
                                  {locked && (
                                    <Badge>
                                      <Lock size={11} aria-hidden="true" /> Super Admin only
                                    </Badge>
                                  )}
                                </span>
                                {p.hint && !locked && <span className="block text-meta text-zinc-500">{p.hint}</span>}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                ))}
              </div>

              {!isSuper && (
                <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
                  <Button variant="primary" onClick={() => void save()} disabled={!dirty || saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button variant="ghost" onClick={() => select(role)} disabled={!dirty || saving}>
                    Discard
                  </Button>
                  <Button variant="ghost" icon={Copy} onClick={() => { setCloneOf(role.key); setCreating(true); }} disabled={saving}>
                    Clone
                  </Button>
                  {builtin && (
                    <Button variant="ghost" icon={RotateCcw} onClick={resetToDefault} disabled={atDefault || saving}>
                      Reset to default
                    </Button>
                  )}
                  {!role.isBuiltIn && (
                    <Button variant="ghost" icon={Trash2} onClick={() => void remove()} disabled={role.userCount > 0 || saving} className="sm:ml-auto">
                      Delete role
                    </Button>
                  )}
                  {!role.isBuiltIn && role.userCount > 0 && <span className="text-meta text-zinc-500">Move its people to another role to delete it.</span>}
                  {dirty && <span className="text-meta text-amber-700">Unsaved changes</span>}
                </div>
              )}
            </Panel>
          ) : (
            <EmptyState icon={History} title="No role selected" />
          )}
        </div>
      )}

      {creating && (
        <NewRoleDialog
          roles={roles}
          initialFrom={cloneOf}
          onClose={() => setCreating(false)}
          onCreated={async (key) => {
            setCreating(false);
            setLogVersion((v) => v + 1);
            await fetchData(true, key);
          }}
        />
      )}
    </SectionFrame>
  );
}
