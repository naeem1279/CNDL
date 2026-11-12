'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

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
        <label htmlFor={selectId} className="block text-xs md:text-xs lg:text-base mb-2.5">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          {...props}
          id={selectId}
          className="w-full appearance-none border border-(--border-primary) rounded-[8px] p-2.5 pr-12 text-xs md:text-xs lg:text-base focus:outline-none focus:ring-1 focus:ring-(--border-secondary) cursor-pointer peer"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) transition-transform duration-200 peer-focus:rotate-180"
        />
      </div>
    </div>
  );
}

export default Select;
