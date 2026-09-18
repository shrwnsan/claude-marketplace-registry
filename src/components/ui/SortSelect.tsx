import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SortSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

/**
 * Label + custom-styled select: appearance-none with a positioned chevron,
 * so the option text and arrow are always vertically aligned.
 */
const SortSelect: React.FC<SortSelectProps> = ({ id, label, value, onChange, options }) => (
  <div className='flex items-center gap-2'>
    <label
      htmlFor={id}
      className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'
    >
      {label}
    </label>
    <div className='relative'>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='appearance-none h-9 pl-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className='absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none'
        aria-hidden='true'
      />
    </div>
  </div>
);

export default SortSelect;
