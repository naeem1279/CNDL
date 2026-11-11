export type AdminFetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * fetch() for admin APIs. A 401 from any admin API means the session cookie
 * is gone (expired after the 8h TTL, revoked server-side, or never sent), so
 * `onAuthLoss` drops the operator back to the sign-in screen instead of
 * leaving every action failing with "Unauthorized". The login endpoint
 * itself is exempt: a 401 there is just a wrong password.
 */
export function createAdminFetch(onAuthLoss: () => void): AdminFetch {
  return async (input, init) => {
    const res = await fetch(input, init);
    if (res.status === 401 && !input.startsWith('/api/admin/verify')) onAuthLoss();
    return res;
  };
}
