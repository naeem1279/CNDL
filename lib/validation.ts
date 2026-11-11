/**
 * Turns zod issues into sentences an operator can act on, naming the field:
 *   "Too small: expected string to have >=2 characters"
 *     → "Owner name must be at least 2 characters"
 * Messages a schema already customised (e.g. "Enter a valid phone number")
 * are kept as written.
 */

type IssueLike = {
  code?: string;
  path?: PropertyKey[];
  message?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  origin?: string;
  format?: string;
  input?: unknown;
};

/** Field names whose humanised form would read badly. */
const FIELD_LABELS: Record<string, string> = {
  clientAccountId: 'Client account',
  assignedAgentId: 'Assigned agent',
  agentId: 'Agent',
  orderId: 'Case ID',
  caseId: 'Case ID',
  grossAmount: 'Gross amount',
  netAmount: 'Amount',
  discountAmount: 'Discount',
  amountPaid: 'Amount paid',
  purchaseCost: 'Purchase cost',
  sharesCount: 'Shares',
  basePrice: 'Base price',
  imageUrl: 'Image',
  voucherNo: 'Voucher number',
  openingDue: 'Opening due',
  billedAmount: 'Billed amount',
  commissionAmount: 'Commission',
  doctorName: 'Doctor name',
  clinicName: 'Clinic name',
  nameBn: 'Bengali name',
};

function fieldLabel(path: PropertyKey[] | undefined): string {
  const key = path?.length ? String(path[path.length - 1]) : '';
  if (!key) return 'This field';
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** zod's built-in messages start like this; anything else was written by us. */
const DEFAULT_MESSAGE = /^(Too (small|big):|Invalid( input| option| string| email| type)?\b|Expected )/;

export function friendlyIssue(issue: IssueLike): string {
  const message = issue.message ?? '';
  if (message && !DEFAULT_MESSAGE.test(message)) return message;

  const label = fieldLabel(issue.path);
  const n = (v: number | bigint | undefined) => (v === undefined ? '' : String(v));
  switch (issue.code) {
    case 'too_small':
      if (issue.origin === 'string') {
        return Number(issue.minimum) <= 1 ? `${label} is required` : `${label} must be at least ${n(issue.minimum)} characters`;
      }
      if (issue.origin === 'array') return `${label} needs at least ${n(issue.minimum)} item(s)`;
      return `${label} must be at least ${n(issue.minimum)}`;
    case 'too_big':
      if (issue.origin === 'string') return `${label} must be at most ${n(issue.maximum)} characters`;
      return `${label} must be at most ${n(issue.maximum)}`;
    case 'invalid_type':
      return issue.input === undefined || issue.input === null ? `${label} is required` : `${label} has the wrong format`;
    case 'invalid_format':
      return issue.format === 'email' ? `${label} must be a valid email address` : `${label} has the wrong format`;
    case 'invalid_value':
      return `${label} has an unsupported value`;
    default:
      return message || `${label} is invalid`;
  }
}

/** First issue of a failed safeParse as a readable sentence. */
export function firstIssueMessage(err: unknown): string {
  const issues = (err as { issues?: IssueLike[] } | null)?.issues;
  return issues?.length ? friendlyIssue(issues[0]) : 'Validation failed';
}
