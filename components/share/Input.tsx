'use client';

import { useId } from 'react';

/** Shared with Select. 16px text stops iOS from zooming into the field on focus. */
export const LABEL = 'mb-2 block text-sm font-medium text-slate-700';
export const FIELD =
  'w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors duration-150 hover:border-slate-400 focus:border-[#1977C5] focus:outline-none focus:ring-4 focus:ring-[#1977C5]/15 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  placeholder?: string;
};

function Input({ label, type, placeholder, ...props }: InputProps) {
  // U2 (2026-11-05): associate the label with the control for screen readers.
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  const openDatePicker = (input: HTMLInputElement) => {
    if (type !== 'date') return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
    } else {
      input.focus();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    openDatePicker(e.currentTarget);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    openDatePicker(e.currentTarget);
  };

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className={LABEL}>
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          id={inputId}
          rows={6}
          placeholder={placeholder}
          className={`${FIELD} min-h-36 py-3`}
        />
      ) : (
        <input
          {...props}
          id={inputId}
          type={type}
          onClick={handleClick}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`${FIELD} h-12${type === 'date' ? ' cursor-pointer' : ''}`}
        />
      )}
    </div>
  );
}
export default Input;
