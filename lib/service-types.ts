/** Shape of one row from the public GET /api/services endpoint. */
export type ServiceApiRow = {
  id: string;
  category?: string | null;
  name: string;
  nameBn?: string | null;
  description?: string | null;
  specs?: string | null;
  imageUrl?: string | null;
  turnaroundDays?: number | null;
  warrantyYears?: number | null;
  basePrice?: string | null;
};
