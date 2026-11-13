/* Client accounts: the one user-facing "type" and its labels.
   The database keeps two overlapping fields (accountType + institutionType);
   the console shows a single type derived from both, so nothing breaks. */
import type { ErpAccount } from './types';

export type ClientType = 'CLINIC' | 'HOSPITAL' | 'LAB' | 'PERSONAL';

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  CLINIC: 'Dental clinic',
  HOSPITAL: 'Hospital',
  LAB: 'Lab',
  PERSONAL: 'Personal',
};

export function clientTypeOf(a: Pick<ErpAccount, 'accountType' | 'institutionType'>): ClientType {
  if (a.accountType === 'CHAIRMAN_PERSONAL' || a.institutionType === 'FREELANCE') return 'PERSONAL';
  if (a.accountType === 'PARTNER_LAB' || a.institutionType === 'LAB' || a.institutionType === 'PARTNER_LAB') return 'LAB';
  if (a.institutionType === 'HOSPITAL') return 'HOSPITAL';
  return 'CLINIC';
}
