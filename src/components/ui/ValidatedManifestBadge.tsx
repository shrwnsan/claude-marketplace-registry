import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ValidatedManifestBadgeProps {
  /** Tailwind size/color classes for the icon */
  className?: string;
}

/**
 * Green shield on marketplace cards: the scan fetched and validated this
 * marketplace's .claude-plugin/marketplace.json. The hover tooltip decodes
 * the icon for sighted users; role="img" + aria-label covers screen readers
 * (touch users get the /marketplaces "Validated marketplace.json" filter
 * and the textual chip on detail pages instead).
 */
const ValidatedManifestBadge: React.FC<ValidatedManifestBadgeProps> = ({
  className = 'w-5 h-5 text-success-500',
}) => (
  <span className='group/badge relative inline-flex'>
    <ShieldCheck role='img' aria-label='Validated marketplace.json' className={className} />
    <span
      aria-hidden='true'
      className='pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 font-mono text-[11px] leading-4 text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/badge:opacity-100 dark:bg-gray-700'
    >
      Validated marketplace.json
    </span>
  </span>
);

export default ValidatedManifestBadge;
