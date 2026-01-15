import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSpinner?: boolean;
  variant?: 'default' | 'skeleton' | 'dots';
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className = '',
  showSpinner = true,
  variant = 'default',
}) => {
  if (variant === 'skeleton') {
    return <SkeletonLoader className={className} />;
  }

  if (variant === 'dots') {
    return <DotsLoader message={message} className={className} />;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {showSpinner && <LoadingSpinner size={size} className='mb-4' />}
      {message && (
        <p className='text-gray-600 dark:text-gray-400 text-center animate-pulse'>{message}</p>
      )}
    </div>
  );
};

const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header skeleton */}
      <div className='animate-pulse'>
        <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
      </div>

      {/* Content skeleton */}
      <div className='space-y-3 animate-pulse'>
        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded'></div>
        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6'></div>
      </div>

      {/* Card skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='animate-pulse'>
            <div className='h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3'></div>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DotsLoader: React.FC<{ message?: string; className?: string }> = ({
  message,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className='flex space-x-2 mb-4'>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className='w-3 h-3 bg-primary-600 rounded-full animate-bounce'
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>
      {message && <p className='text-gray-600 dark:text-gray-400 text-center'>{message}</p>}
    </div>
  );
};

export default LoadingState;
