import React from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  bgColor: string;
  iconColor: string;
}

/**
 * Reusable stat card component for displaying metrics.
 * Hover classes are static strings so the Tailwind JIT compiler can see them.
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  bgColor,
  iconColor,
}) => (
  <div className='glass rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 group'>
    <div
      className={`
      w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3
      ${bgColor} rounded-lg flex items-center justify-center
      group-hover:brightness-95 dark:group-hover:brightness-110 transition-colors
    `}
    >
      <Icon
        className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor} group-hover:scale-110 transition-transform`}
      />
    </div>
    <div className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1'>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <div className='text-sm text-gray-600 dark:text-gray-400'>{label}</div>
  </div>
);
