import React from 'react';

interface MiniSparklineProps {
  /** Daily values in chronological order. */
  points?: number[];
  /** What the line measures, e.g. "manifest coverage". */
  label: string;
}

/**
 * One-number-per-day trend slot for quality cards. With fewer than two data
 * points it shows an honest placeholder instead of an invented line — the
 * daily history snapshots will feed it real data over time.
 */
const MiniSparkline: React.FC<MiniSparklineProps> = ({ points, label }) => {
  if (!points || points.length < 2) {
    return (
      <div className='mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
        <div className='flex items-end gap-[3px] h-6' aria-hidden='true'>
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className='flex-1 bg-gray-200 dark:bg-gray-750 rounded-sm'
              style={{ height: `${30 + ((i * 37) % 50)}%`, opacity: 0.5 }}
            />
          ))}
        </div>
        <p className='text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-1.5'>
          {label} trend appears as daily history accumulates
        </p>
      </div>
    );
  }

  const width = 120;
  const height = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const path = points
    .map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`
    )
    .join(' ');

  return (
    <div className='mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className='text-primary-500 dark:text-primary-400'
        role='img'
        aria-label={`${label} trend over the last ${points.length} daily snapshots`}
      >
        <path d={path} fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
      </svg>
      <p className='text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-1'>
        {label} · last {points.length} days
      </p>
    </div>
  );
};

export default MiniSparkline;
