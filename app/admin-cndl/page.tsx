'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { visibleTabs } from '@/lib/permissions';
import { adminPath } from './_lib/nav';
import { useAdmin } from './_lib/session';
import type { TabKey } from './_lib/types';
import { readPref } from './_lib/utils';

/**
 * /admin-cndl picks a section: an old #section link wins, then the last
 * section used on this device, then the role's landing section. Sections
 * outside the role's access fall back to its landing section.
 */
export default function AdminIndex() {
  const { me } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    const permitted = visibleTabs(me.permissions) as TabKey[];
    const fromHash = window.location.hash.slice(1);
    const candidate = fromHash || readPref('cndl-admin-tab') || '';
    const target = (permitted as string[]).includes(candidate) ? (candidate as TabKey) : permitted[0];
    if (target) router.replace(adminPath(target));
  }, [me, router]);

  return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <RefreshCw size={20} className="animate-spin" />
    </div>
  );
}
