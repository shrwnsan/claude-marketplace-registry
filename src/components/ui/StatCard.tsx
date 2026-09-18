import React from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  iconColor: string;
}

/**
 * Homepage stat card — spec-sheet style: mono label, large mono numeral.
 * Colors come from the syntax-accent palette passed via iconColor.
 */
export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, iconColor }) => (
  <div className='card p-4 sm:p-5 text-left'>
    <div className='flex items-center justify-between gap-2'>
      <span className='font-mono text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400'>
        {label}
      </span>
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} aria-hidden='true' />
    </div>
    <div className='mt-1.5 font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-gray-50'>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
  </div>
);
