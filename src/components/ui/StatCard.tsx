import React from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  bgColor: string;
  iconColor: string;
  hoverBgColor?: string;
  hoverIconColor?: string;
}

/**
 * Reusable stat card component for displaying metrics
 *
 * Used in hero section and other areas to display ecosystem statistics
 * with consistent styling and hover effects.
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  bgColor,
  iconColor,
  hoverBgColor,
  hoverIconColor,
}) => (
  <div className="glass rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 group">
    <div className={`
      w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3
      ${bgColor} rounded-lg flex items-center justify-center
      ${hoverBgColor ? `group-hover:${hoverBgColor}` : ''} transition-colors
    `}>
      <Icon className={`
        w-6 h-6 sm:w-8 sm:h-8 ${iconColor}
        ${hoverIconColor ? `group-hover:${hoverIconColor}` : ''} transition-colors
      `} />
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
  </div>
);
