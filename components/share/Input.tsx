'use client';

import { useId } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  placeholder?: string;
};

function Input({ label, type, placeholder, ...props }: InputProps) {
  // U2 (2026-11-05): associate the label with the control for screen readers.
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  const openDatePicker = (input: any) => {
    if (type !== 'date') return;
    if ('showPicker' in input) {
      (input as any)?.showPicker?.();
    } else {
      input?.focus?.();
      (input as any).type = 'date';
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
        <label htmlFor={inputId} className="block text-[10px] md:text-xs lg:text-base mb-2.5">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          {...(props as any)}
          id={inputId}
          rows='6'
          placeholder={placeholder}
          className="w-full border border-(--border-primary) rounded-[8px] p-2.5 text-[10px] md:text-xs lg:text-base focus:outline-none focus:ring-1 focus:ring-(--border-secondary)"
        />
      ) : (
        <input
          {...props}
          id={inputId}
          type={type}
          onClick={handleClick}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full border border-(--border-primary) rounded-[8px] p-2.5 text-[10px] md:text-xs lg:text-base focus:outline-none focus:ring-1 focus:ring-(--border-secondary)${
            type === 'date' ? ' cursor-pointer' : ''
          }`}
        />
      )}
    </div>
  );
}
export default Input;
