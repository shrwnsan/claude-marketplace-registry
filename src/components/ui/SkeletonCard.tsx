import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="flex space-x-2 mb-4">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Author skeleton */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Stats skeleton */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Actions skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;