'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { isLockedPermission } from '@/lib/permissions';
import { FormDialog } from '../_components/FormDialog';
import { Field, Input, Select } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import { apiError } from '../_lib/utils';
import type { RoleRow } from './types';

/** Creates a custom role, optionally starting from a copy of an existing one (locked permissions are never copied). */
export function NewRoleDialog({ roles, onClose, onCreated }: { roles: RoleRow[]; onClose: () => void; onCreated: (key: string) => void | Promise<void> }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [from, setFrom] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Give the role a name (at least 2 characters)');
      return void document.getElementById('nr-name')?.focus();
    }
    const source = roles.find((r) => r.key === from);
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/erp/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          permissions: (source?.permissions ?? []).filter((k) => !isLockedPermission(k)),
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void setError(apiError(body, 'Could not create the role'));
      toast.success(`${name.trim()} created — now choose what it can do`);
      await onCreated(body.role.key);
    } catch {
      toast.error('Network error — nothing was created');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title="New role" onClose={onClose} onSubmit={submit} submitLabel="Create role" saving={saving} savingLabel="Creating…">
      <Field label="Role name" htmlFor="nr-name" required error={error}>
        <Input
          id="nr-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          invalid={!!error}
          maxLength={60}
          autoComplete="off"
          placeholder="e.g. Reception"
        />
      </Field>
      <Field label="What it is for" htmlFor="nr-desc" hint="Optional">
        <Input id="nr-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} autoComplete="off" />
      </Field>
      <Field label="Start from" htmlFor="nr-from" hint="Copies that role's permissions; you can change them after.">
        <Select id="nr-from" value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">Nothing (no permissions yet)</option>
          {roles
            .filter((r) => r.key !== 'SUPERADMIN')
            .map((r) => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
        </Select>
      </Field>
    </FormDialog>
  );
}
