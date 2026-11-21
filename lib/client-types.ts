/**
 * Client accounts: ONE user-facing type, plus the "Chairman channel" flag.
 *
 * The database keeps two overlapping columns from earlier versions:
 *   accountType     CHAMBER | PARTNER_LAB | CHAIRMAN_PERSONAL   (CHAIRMAN_PERSONAL = came in through the Chairman)
 *   institutionType CHAMBER | HOSPITAL | PARTNER_LAB | FREELANCE (older rows may also hold "LAB")
 * Nothing is migrated: the console reads one type from both columns and writes both columns back
 * consistently. Pure (no imports) so the API, the console and the tests share it.
 */

export const CLIENT_TYPES = ['CLINIC', 'HOSPITAL', 'LAB', 'PERSONAL'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  CLINIC: 'Dental clinic',
  HOSPITAL: 'Hospital',
  LAB: 'Lab',
  PERSONAL: 'Personal',
};

type Cols = { accountType?: string | null; institutionType?: string | null };

export function clientTypeOf(a: Cols): ClientType {
  const inst = a.institutionType || '';
  if (a.accountType === 'PARTNER_LAB' || inst === 'PARTNER_LAB' || inst === 'LAB') return 'LAB';
  if (inst === 'HOSPITAL') return 'HOSPITAL';
  if (inst === 'FREELANCE') return 'PERSONAL';
  return 'CLINIC';
}

export const isChairmanChannel = (a: Cols) => a.accountType === 'CHAIRMAN_PERSONAL';

/** The two stored columns for a chosen type and channel. */
export function columnsForType(
  type: ClientType,
  chairmanChannel: boolean
): { accountType: 'CHAMBER' | 'PARTNER_LAB' | 'CHAIRMAN_PERSONAL'; institutionType: 'CHAMBER' | 'HOSPITAL' | 'PARTNER_LAB' | 'FREELANCE' } {
  const institutionType = type === 'HOSPITAL' ? 'HOSPITAL' : type === 'LAB' ? 'PARTNER_LAB' : type === 'PERSONAL' ? 'FREELANCE' : 'CHAMBER';
  const accountType = chairmanChannel ? 'CHAIRMAN_PERSONAL' : type === 'LAB' ? 'PARTNER_LAB' : 'CHAMBER';
  return { accountType, institutionType };
}
