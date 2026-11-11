'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeCheck, Eye, EyeOff, KeyRound, Lock, LogOut, Menu, PanelLeftClose, PanelLeftOpen, RefreshCw,
  Stethoscope, User, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { createAdminFetch } from '../_lib/adminFetch';
import { ROLE_META, ROLE_TABS } from '../_lib/constants';
import { NAV_GROUPS, adminPath, tabFromPath } from '../_lib/nav';
import { AdminContext, type AdminSession } from '../_lib/session';
import type { SessionUser, TabKey } from '../_lib/types';
import { apiError } from '../_lib/utils';
import { ConfirmDialog, type ConfirmOptions, type ConfirmRequest } from './ConfirmDialog';
import { ModalShell, useDialog } from './ModalShell';

const isTab = (s: string): s is TabKey => NAV_GROUPS.some((g) => g.items.some((i) => i.key === s));

/**
 * Everything the console sections share: session restore and sign-in, the
 * 5-minute session re-check, the role-filtered sidebar, the confirm prompt
 * and the change-password dialog. Sections render inside `children` only once
 * the operator is signed in and allowed to see that section, so a section's
 * data requests never fire for a role that cannot open it.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const tab = tabFromPath(pathname);

  const [auth, setAuth] = useState<boolean | null>(null); // null = restoring session
  const [me, setMe] = useState<SessionUser | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop icon-rail collapse (Linear/Vercel style). Mobile drawer is unaffected.
  const [railCollapsed, setRailCollapsed] = useState(false);
  useEffect(() => {
    try {
      setRailCollapsed(window.localStorage.getItem('cndl-admin-rail') === '1');
    } catch {
      /* private mode — default expanded */
    }
  }, []);
  const toggleRail = () =>
    setRailCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem('cndl-admin-rail', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  useDialog(() => setSidebarOpen(false), { active: sidebarOpen, lockScroll: false });

  const handleAuthLoss = useCallback(() => {
    setAuth(false);
    setMe(null);
    // Fixed id: a burst of 401s shows ONE toast.
    toast.error('Session expired — please sign in again', { id: 'session-expired' });
  }, []);
  const adminFetch = useMemo(() => createAdminFetch(handleAuthLoss), [handleAuthLoss]);

  /* ---------- In-app confirmation dialog (replaces window.confirm) ---------- */
  const [confirmState, setConfirmState] = useState<ConfirmRequest | null>(null);
  const confirmResolver = useRef<((ok: boolean) => void) | null>(null);
  const askConfirm = useCallback(
    (message: string, opts: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => {
        confirmResolver.current = resolve;
        const verb = /^remove/i.test(message) ? 'Remove' : 'Delete';
        setConfirmState({
          title: opts.title ?? `${verb}?`,
          message,
          confirmLabel: opts.confirmLabel ?? verb,
          tone: opts.tone ?? 'danger',
        });
      }),
    []
  );
  const resolveConfirm = (ok: boolean) => {
    confirmResolver.current?.(ok);
    confirmResolver.current = null;
    setConfirmState(null);
  };

  // Self-service Change Password (all roles)
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const openPwModal = () => {
    setPwForm({ current: '', next: '', confirm: '' });
    setPwModal(true);
  };

  const pwValid =
    pwForm.current.length > 0 &&
    pwForm.next.length >= 6 &&
    pwForm.next === pwForm.confirm;

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      const res = await adminFetch('/api/admin/erp/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(body.message || 'Password updated successfully');
        setPwModal(false);
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        toast.error(apiError(body, 'Failed to update password'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Enter your phone/email and password');
      return;
    }
    setLoggingIn(true);
    try {
      const res = await adminFetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.user) {
        setMe(body.user);
        setAuth(true);
        setPassword('');
        toast.success(`Signed in as ${body.user.name}`);
      } else {
        toast.error(apiError(body, 'Invalid credentials'));
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await adminFetch('/api/admin/verify', { method: 'DELETE' });
    } catch {
      // ignore network errors on sign out
    }
    // Section state lives in the section pages, which unmount with the session.
    setAuth(false);
    setMe(null);
    setIdentifier('');
    setPassword('');
    setSidebarOpen(false);
    setPwModal(false);
    router.replace('/admin-cndl');
  };

  // Restore an existing session cookie on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/verify');
        if (res.ok && !cancelled) {
          const body = await res.json().catch(() => null);
          if (body?.user) {
            setMe(body.user);
            setAuth(true);
            return;
          }
        }
      } catch {
        // network issue — fall through to the login screen
      }
      if (!cancelled) setAuth(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-validate the session every 5 minutes so an expired cookie (8h TTL)
  // kicks the operator back to login instead of failing every mutation.
  useEffect(() => {
    if (auth !== true) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/admin/verify');
        if (r.status === 401) handleAuthLoss();
      } catch {
        /* offline — keep current state */
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [auth, handleAuthLoss]);

  const permittedTabs = me ? ROLE_TABS[me.role] ?? ROLE_TABS.SUPERADMIN : [];
  const allowed = !tab || permittedTabs.includes(tab);

  // Keep the operator inside their role's sections.
  useEffect(() => {
    if (me && tab && !allowed) router.replace(adminPath(permittedTabs[0]));
  }, [me, tab, allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the last section for the next visit to /admin-cndl.
  useEffect(() => {
    if (!tab || !allowed) return;
    try {
      window.localStorage.setItem('cndl-admin-tab', tab);
    } catch {
      /* ignore */
    }
  }, [tab, allowed]);

  // Old #section links (bookmarks, pasted URLs, back/forward) open the
  // matching route.
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1);
      if (isTab(h)) router.replace(adminPath(h));
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [router]);

  const session = useMemo<AdminSession | null>(
    () => (me ? { me, adminFetch, handleAuthLoss, askConfirm } : null),
    [me, adminFetch, handleAuthLoss, askConfirm]
  );

  if (auth === null) {
    /* Restoring session — quiet splash */
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 text-zinc-400">
        <RefreshCw size={20} className="animate-spin" />
      </div>
    );
  }

  if (!auth || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-50 text-zinc-900">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white border border-zinc-200/60 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-8 pt-10 pb-7 text-center">
            <span className="w-14 h-14 mx-auto rounded-2xl bg-brand-600/10 text-brand-600 flex items-center justify-center mb-5">
              <Stethoscope size={26} />
            </span>
            <h2 className="text-xl font-bold tracking-tight">CNDL Admin Console</h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Sign in with your registered phone or email.
            </p>
          </div>
          <div className="px-8 pb-10 space-y-4">
            <div>
              <label htmlFor="admin-identifier" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Phone or Email
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                <input
                  id="admin-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="01XXXXXXXXX or name@lab.com"
                  autoComplete="username"
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600/40 bg-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full min-h-[46px] pl-10 pr-11 rounded-xl border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600/40 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  title={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-[46px] rounded-xl bg-brand-600 text-white text-sm font-bold tracking-tight hover:bg-brand-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              Access is role-based. Accounts are issued by a SUPERADMIN under User Management.
            </p>
          </div>
        </form>
      </div>
    );
  }

  const visibleNavGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => permittedTabs.includes(i.key)) }))
    .filter((g) => g.items.length > 0);

  const roleLabel = me && ROLE_META[me.role] ? ROLE_META[me.role].label : 'Administrator';

  return (
    <AdminContext.Provider value={session}>
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-meta font-semibold text-white">C</span>
          <span className="text-body font-semibold">CNDL Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {confirmState && <ConfirmDialog request={confirmState} onResolve={resolveConfirm} />}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-zinc-200 bg-white transition-[transform,width] duration-200 lg:translate-x-0 ${
          railCollapsed ? 'lg:w-[68px]' : ''
        } ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className={`flex h-14 items-center gap-2.5 border-b border-zinc-100 px-4 ${railCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-meta font-semibold text-white">C</span>
          <div className={`min-w-0 ${railCollapsed ? 'lg:hidden' : ''}`}>
            <div className="text-body font-semibold leading-tight">CNDL Admin</div>
            <div className="text-meta text-zinc-500 leading-tight">CN Dental Lab</div>
          </div>
          <button
            onClick={toggleRail}
            aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:inline-flex ${railCollapsed ? 'lg:hidden' : ''}`}
          >
            <PanelLeftClose size={16} />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation — grouped, role-filtered; each entry is its own route */}
        <nav aria-label="Sections" className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
          {railCollapsed && (
            <button
              onClick={toggleRail}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="mx-auto hidden h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:flex"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
          {visibleNavGroups.map((group) => (
            <div key={group.title}>
              {railCollapsed && <div className="mx-auto mb-2 hidden w-6 border-t border-zinc-200 lg:block" />}
              <p className={`px-2.5 pb-1 text-meta font-medium text-zinc-400 select-none ${railCollapsed ? 'lg:hidden' : ''}`}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = tab === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={adminPath(item.key)}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      title={railCollapsed ? item.label : undefined}
                      className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                        active
                          ? 'bg-zinc-100 font-medium text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      } ${railCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                    >
                      <item.icon size={16} className={`shrink-0 ${active ? 'text-brand-600' : 'text-zinc-400'}`} />
                      <span className={`flex-1 truncate ${railCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Signed-in user */}
        <div className={`border-t border-zinc-100 p-3 ${railCollapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center gap-2.5 rounded-md px-1.5 py-1 ${railCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-table font-semibold text-zinc-700">
              {(me?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <div className={`min-w-0 flex-1 ${railCollapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate text-table font-medium text-zinc-900">{me?.name || 'Administrator'}</div>
              <div className="truncate text-meta text-zinc-500">{roleLabel}</div>
            </div>
          </div>
          <div className={`mt-2 flex gap-1 ${railCollapsed ? 'lg:flex-col lg:items-center' : ''}`}>
            <button
              onClick={openPwModal}
              title="Change password"
              className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-table text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 ${railCollapsed ? 'lg:w-8 lg:flex-none' : ''}`}
            >
              <KeyRound size={14} />
              <span className={railCollapsed ? 'lg:hidden' : ''}>Password</span>
            </button>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-table text-zinc-600 hover:bg-rose-50 hover:text-rose-700 ${railCollapsed ? 'lg:w-8 lg:flex-none' : ''}`}
            >
              <LogOut size={14} />
              <span className={railCollapsed ? 'lg:hidden' : ''}>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={railCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'}>
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{allowed ? children : null}</main>
      </div>

      {pwModal && (
        <ModalShell onClose={() => { if (!savingPw) setPwModal(false); }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitChangePassword}
            className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-brand-600 flex items-center gap-2">
                  <KeyRound size={18} /> Change Your Password
                </h3>
                <p className="text-xs text-zinc-500 truncate">Signed in as {me?.name || 'Administrator'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPwModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {me && !me.uid && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                  You are signed in with the master administrator key. This password is locked in the
                  server environment and cannot be changed from here.
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Current Password *</label>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  disabled={savingPw || (me !== null && !me.uid)}
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  placeholder="Enter your current password"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-600/20 bg-white disabled:bg-zinc-100 disabled:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">New Password *</label>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  disabled={savingPw || (me !== null && !me.uid)}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className={`w-full min-h-[44px] px-4 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-600/20 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 ${
                    pwForm.next.length > 0 && pwForm.next.length < 6 ? 'border-rose-300' : 'border-zinc-200'
                  }`}
                />
                {pwForm.next.length > 0 && pwForm.next.length < 6 && (
                  <p className="text-xs font-semibold text-rose-500 mt-1">Password must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Confirm New Password *</label>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  disabled={savingPw || (me !== null && !me.uid)}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Re-enter the new password"
                  className={`w-full min-h-[44px] px-4 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-brand-600/20 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 ${
                    pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.next ? 'border-rose-300' : 'border-zinc-200'
                  }`}
                />
                {pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.next && (
                  <p className="text-xs font-semibold text-rose-500 mt-1">Passwords do not match</p>
                )}
                {pwForm.confirm.length > 0 && pwForm.confirm === pwForm.next && pwForm.next.length >= 6 && (
                  <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <BadgeCheck size={12} /> Passwords match
                  </p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-zinc-50 border-t border-zinc-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPwModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPw || !pwValid || (me !== null && !me.uid)}
                className="min-h-[44px] px-6 rounded-xl bg-brand-600 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50 shadow-md"
              >
                {savingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Log Daily Expense Modal */}
      {/* Expense Audit History Modal (SuperAdmin) */}
    </div>
    </AdminContext.Provider>
  );
}
