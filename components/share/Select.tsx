'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { FIELD, LABEL } from './Input';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: string[];
  placeholder?: string;
};

function Select({ label, options, placeholder, ...props }: SelectProps) {
  // U2 (2026-11-05): associate the label with the control for screen readers.
  const generatedId = useId();
  const selectId = props.id ?? generatedId;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className={LABEL}>
          {label}
        </label>
      )}

      <div className="relative">
        <select
          {...props}
          id={selectId}
          className={`${FIELD} peer h-12 cursor-pointer appearance-none pr-11`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
    </div>
  );
}

export default Select;
