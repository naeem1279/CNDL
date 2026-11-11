'use client';
import { useEffect, useRef, type HTMLAttributes } from 'react';

/* One stack for every open dialog in the console (section modals, the
   confirm prompt, the password dialog and the mobile menu). Escape closes
   only the top-most entry, and the page behind stays locked while any
   dialog that asks for it is open. Dialogs opened later sit higher, so a
   confirm prompt raised from inside a form closes before the form does. */
type Entry = { close: React.RefObject<() => void>; lock: boolean };
const stack: Entry[] = [];
let listening = false;
let savedOverflow = '';

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || stack.length === 0) return;
  e.preventDefault();
  stack[stack.length - 1].close.current?.();
}

function syncScrollLock(wasLocked: boolean) {
  const locked = stack.some((s) => s.lock);
  if (locked && !wasLocked) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  } else if (!locked && wasLocked) {
    document.body.style.overflow = savedOverflow;
  }
}

/** Registers a dialog while `active` is true: Escape calls `onClose`, and
    (unless `lockScroll` is false) the page behind it cannot scroll. */
export function useDialog(onClose: () => void, { active = true, lockScroll = true } = {}) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!active) return;
    const wasLocked = stack.some((s) => s.lock);
    const entry: Entry = { close, lock: lockScroll };
    stack.push(entry);
    syncScrollLock(wasLocked);
    if (!listening) {
      window.addEventListener('keydown', onKeyDown);
      listening = true;
    }
    return () => {
      const before = stack.some((s) => s.lock);
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      syncScrollLock(before);
      if (stack.length === 0 && listening) {
        window.removeEventListener('keydown', onKeyDown);
        listening = false;
      }
    };
  }, [active, lockScroll]);
}

const BACKDROP = 'fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6';

/** Full-screen dialog backdrop. Clicking the backdrop does nothing unless an
    `onClick` is passed (detail views close on it; forms never do, so a stray
    tap cannot throw away what was typed). */
export function ModalShell({
  onClose,
  className = BACKDROP,
  children,
  ...rest
}: { onClose: () => void } & HTMLAttributes<HTMLDivElement>) {
  useDialog(onClose);
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
