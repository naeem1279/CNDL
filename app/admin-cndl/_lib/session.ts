'use client';
import { createContext, useContext } from 'react';
import type { AdminFetch } from './adminFetch';
import type { SessionUser } from './types';

export type AdminSession = {
  /** The signed-in operator. Sections only render once this is known. */
  me: SessionUser;
  adminFetch: AdminFetch;
  /** Drops back to the sign-in screen (one toast, however many 401s). */
  handleAuthLoss: () => void;
  /** In-app confirmation prompt; resolves true when the operator confirms. */
  askConfirm: (message: string) => Promise<boolean>;
};

export const AdminContext = createContext<AdminSession | null>(null);

export function useAdmin(): AdminSession {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin() must be used inside the admin console layout');
  return ctx;
}
