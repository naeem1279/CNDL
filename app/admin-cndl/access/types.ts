export type RoleRow = {
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  isBuiltIn: boolean;
  userCount: number;
};

export type CatalogPermission = { key: string; group: string; label: string; hint?: string; locked?: boolean };

export type AccessLogEntry = {
  id: string;
  action: string;
  roleKey: string | null;
  targetUserId: string | null;
  before: { name?: string; permissions?: string[]; roleKey?: string } | null;
  after: { name?: string; permissions?: string[]; roleKey?: string } | null;
  performedBy: string;
  performedByName: string | null;
  createdAt: string;
};
