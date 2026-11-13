'use client';
/* Searchable client picker (ARIA combobox). Replaces the plain dropdown that became
   unusable with ~100 clients. Reusable wherever a client account is chosen
   (new case today; Orders and Dues filters next).

   Behaviour
   - Type a name, clinic, doctor or phone (any format); matching lives in _lib/clientSearch.ts.
   - With nothing typed: recently used clients first (remembered per browser), then A–Z.
   - ↑ ↓ move, Enter picks, Esc closes just the list (a second Esc closes the dialog), Tab leaves.
   - Optional "add new client" row so a missing client can be created without leaving the form. */
import { Check, ChevronDown, Search, UserPlus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { searchClients } from '../_lib/clientSearch';
import { CLIENT_TYPE_LABEL, clientTypeOf } from '../_lib/clients';
import type { ErpAccount } from '../_lib/types';
import { formatBDT } from '../_lib/utils';
import { Input } from './ui';

const RECENT_KEY = 'cndl-admin-recent-clients';
const MAX_RECENT = 8;
const LIMIT = 60;
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

function readRecent(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}
function rememberClient(id: string) {
  try {
    const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage blocked: recents just are not remembered
  }
}

type Row = { kind: 'none' } | { kind: 'client'; a: ErpAccount } | { kind: 'create' };

export function ClientPicker({
  id,
  accounts,
  value,
  onChange,
  emptyLabel = 'Walk-in (type details below)',
  onCreate,
  invalid,
  disabled,
}: {
  /** Id of the text input; point the field's <label htmlFor> at it. */
  id: string;
  accounts: ErpAccount[];
  /** Selected client id, or '' for none. */
  value: string;
  onChange: (id: string) => void;
  /** Label of the "no client" choice (e.g. "Walk-in" or "All clients"). */
  emptyLabel?: string;
  /** When given, a last row offers to add the typed text as a new client. */
  onCreate?: (typed: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const selected = useMemo(() => accounts.find((a) => a.id === value) ?? null, [accounts, value]);
  const { hits, matched, recentCount } = useMemo(() => searchClients(accounts, query, recent, LIMIT), [accounts, query, recent]);
  const typed = query.trim();

  const rows = useMemo<Row[]>(
    () => [
      ...(typed === '' ? [{ kind: 'none' } as Row] : []),
      ...hits.map((a) => ({ kind: 'client', a }) as Row),
      ...(onCreate && typed !== '' ? [{ kind: 'create' } as Row] : []),
    ],
    [typed, hits, onCreate],
  );

  const openList = () => {
    if (disabled) return;
    setRecent(readRecent());
    setQuery('');
    setActive(0);
    setOpen(true);
  };
  const closeList = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === 'create') {
      const text = typed;
      closeList();
      onCreate?.(text);
      return;
    }
    if (row.kind === 'client') rememberClient(row.a.id);
    onChange(row.kind === 'none' ? '' : row.a.id);
    closeList();
  };

  // Close when clicking or tapping anywhere outside.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeList();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  // Keep the list and the highlighted row in view (the dialog body scrolls).
  useEffect(() => {
    if (open) popRef.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${listId}-o${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, listId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(i + 1, rows.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) setActive((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(rows.length - 1);
        }
        break;
      case 'Enter':
        if (open) {
          e.preventDefault(); // never submit the surrounding form from here
          pick(rows[active]);
        }
        break;
      case 'Escape':
        if (open) {
          // Close only the list: the dialog behind it also listens for Escape.
          e.preventDefault();
          e.stopPropagation();
          closeList();
        }
        break;
      case 'Tab':
        if (open) closeList();
        break;
    }
  };

  const label = selected ? `${selected.name} · ${selected.ownerName}` : '';
  const showGroups = typed === '' && recentCount > 0;
  let clientIndex = -1;

  return (
    <div ref={rootRef} className="relative">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-o${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        invalid={invalid}
        className="pl-9 pr-16"
        value={open ? query : label}
        placeholder={open ? 'Search name, clinic, doctor or phone' : emptyLabel}
        onFocus={() => !open && openList()}
        onClick={() => !open && openList()}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          if (!open) {
            setRecent(readRecent());
            setOpen(true);
          }
        }}
        onKeyDown={onKeyDown}
      />
      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
        {selected && !open && !disabled && (
          <button
            type="button"
            aria-label="Clear client"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={15} className={cx('mr-1.5 text-zinc-400 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </div>

      {open && (
        <div ref={popRef} className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <ul id={listId} role="listbox" aria-label="Client accounts" className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {rows.map((row, i) => {
              const isActive = i === active;
              const common = {
                id: `${listId}-o${i}`,
                role: 'option' as const,
                onMouseEnter: () => setActive(i),
                onMouseDown: (e: React.MouseEvent) => e.preventDefault(), // keep focus in the input
                onClick: () => pick(row),
              };

              if (row.kind === 'none') {
                return (
                  <li key="none" {...common} role="option" aria-selected={!value} className={cx('flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 py-2 text-body text-zinc-700', isActive && 'bg-zinc-100')}>
                    <span>{emptyLabel}</span>
                    {!value && <Check size={15} className="text-brand-600" aria-hidden="true" />}
                  </li>
                );
              }
              if (row.kind === 'create') {
                return (
                  <li key="create" {...common} role="option" aria-selected={false} className={cx('flex min-h-11 cursor-pointer items-center gap-2 border-t border-zinc-100 px-3 py-2 text-body font-medium text-brand-700', isActive && 'bg-zinc-100')}>
                    <UserPlus size={15} aria-hidden="true" />
                    <span className="min-w-0 truncate">Add “{typed}” as a new client</span>
                  </li>
                );
              }

              clientIndex += 1;
              const a = row.a;
              const isSelected = a.id === value;
              const header =
                showGroups && clientIndex === 0 ? 'Recent' : showGroups && clientIndex === recentCount ? 'All clients' : null;
              return (
                <li key={a.id} role="presentation">
                  {header && <div className="px-3 pb-1 pt-2 text-meta font-medium text-zinc-400">{header}</div>}
                  <div {...common} aria-selected={isSelected} className={cx('flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2', isActive && 'bg-zinc-100')}>
                    <span className="min-w-0">
                      <span className="block truncate text-body font-medium text-zinc-900">{a.name}</span>
                      <span className="block truncate text-meta text-zinc-500">
                        {a.ownerName} · {a.phone} · {CLIENT_TYPE_LABEL[clientTypeOf(a)]}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {a.currentBalance > 0 && <span className="text-meta font-medium text-amber-700 tabular-nums">Owes {formatBDT(a.currentBalance)}</span>}
                      {isSelected && <Check size={15} className="text-brand-600" aria-hidden="true" />}
                    </span>
                  </div>
                </li>
              );
            })}
            {hits.length === 0 && typed !== '' && (
              <li role="presentation" className="px-3 py-3 text-meta text-zinc-500">
                No client matches “{typed}”.
              </li>
            )}
            {matched > hits.length && (
              <li role="presentation" className="border-t border-zinc-100 px-3 py-2 text-meta text-zinc-500">
                Showing {hits.length} of {matched}. Keep typing to narrow it down.
              </li>
            )}
            {accounts.length === 0 && typed === '' && (
              <li role="presentation" className="px-3 py-3 text-meta text-zinc-500">
                No client accounts yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
