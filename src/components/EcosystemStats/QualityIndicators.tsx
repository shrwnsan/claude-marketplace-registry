import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Star,
  Activity,
  Award,
  Lock,
  Eye,
  RefreshCw,
  Users,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
} from 'lucide-react';
// Unused imports that can be added back when needed:
// CheckCircle, TrendingUp, TrendingDown, Zap, Info, Calendar, Code
import {
  QualityIndicators as IQualityIndicators,
  EcosystemStatsResponse,
} from '../../types/ecosystem-stats';
// import LoadingSpinner from '../ui/LoadingSpinner'; // Unused - can be removed when needed
import ErrorDisplay from '../ui/ErrorDisplay';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface QualityIndicatorsProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  showDetailed?: boolean;
  compact?: boolean;
}

// interface QualityTrend {
//   period: string;
//   verificationRate: number;
//   avgQualityScore: number;
//   maintenanceRate: number;
//   securityScore: number;
// } // Unused interface - can be added back when needed

interface QualityMetric {
  label: string;
  value: number;
  total?: number;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: 'success' | 'warning' | 'error' | 'primary';
  description: string;
  ariaLabel: string;
}

interface TrustSignal {
  type: 'security' | 'quality' | 'popularity' | 'maintenance';
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
}

interface QualityIssue {
  issue: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// ============================================================================
// CUSTOM HOOK FOR QUALITY DATA
// ============================================================================

const useQualityIndicators = (autoRefresh: boolean = false, refreshInterval: number = 60000) => {
  const [data, setData] = useState<IQualityIndicators | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ecosystem-stats?quality', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EcosystemStatsResponse<IQualityIndicators> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch quality indicators');
      }

      if (result.data) {
        setData(result.data);
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error('Error fetching quality indicators:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

// Progress Bar Component
const ProgressBar: React.FC<{
  value: number;
  max?: number;
  color: 'success' | 'warning' | 'error' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animated?: boolean;
  ariaLabel?: string;
}> = ({
  value,
  max = 100,
  color,
  size = 'md',
  showPercentage = true,
  animated = true,
  ariaLabel,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    primary: 'bg-primary-500',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className='w-full'>
      <div
        className='w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
      >
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} ${animated ? 'transition-all duration-500 ease-out' : ''} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className='text-xs text-gray-600 dark:text-gray-400 mt-1 block text-right'>
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
};

// Trend Indicator Component
const TrendIndicator: React.FC<{
  trend: 'up' | 'down' | 'stable';
  value?: number;
  size?: 'sm' | 'md' | 'lg';
}> = ({ trend, value, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (trend === 'stable' || !value || Math.abs(value) < 0.1) {
    return (
      <div className='flex items-center text-gray-500'>
        <Minus className={sizeClasses[size]} />
        {value !== undefined && <span className='text-xs ml-1'>0%</span>}
      </div>
    );
  }

  const Icon = trend === 'up' ? ArrowUp : ArrowDown;
  const colorClass = trend === 'up' ? 'text-success-600' : 'text-error-600';
  const bgColorClass =
    trend === 'up' ? 'bg-success-100 dark:bg-success-900/30' : 'bg-error-100 dark:bg-error-900/30';

  return (
    <div className={`flex items-center ${colorClass}`}>
      <div className={`p-1 rounded ${bgColorClass} mr-1`}>
        <Icon className={sizeClasses[size]} />
      </div>
      {value !== undefined && (
        <span className='text-xs font-medium'>
          {trend === 'up' ? '+' : ''}
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
};

// Trust Badge Component
const TrustBadge: React.FC<{
  signal: TrustSignal;
  size?: 'sm' | 'md' | 'lg';
}> = ({ signal, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const Icon = signal.icon;

  return (
    <div
      className='group relative'
      title={`${signal.count} plugins with ${signal.label.toLowerCase()}`}
    >
      <div
        className={`p-2 rounded-lg ${signal.color} transition-all duration-200 group-hover:scale-110 cursor-help`}
      >
        <Icon className={sizeClasses[size]} />
      </div>

      {/* Tooltip */}
      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
        <div className='font-semibold'>{signal.label}</div>
        <div className='text-gray-300'>{signal.count} plugins</div>
        <div className='absolute top-full left-1/2 transform -translate-x-1/2 -mt-1'>
          <div className='w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45'></div>
        </div>
      </div>
    </div>
  );
};

// Quality Issue Card Component
const QualityIssueCard: React.FC<{
  issue: QualityIssue;
  compact?: boolean;
}> = ({ issue, compact = false }) => {
  const severityColors = {
    low: {
      bg: 'bg-warning-100 dark:bg-warning-900/30',
      text: 'text-warning-800 dark:text-warning-200',
      border: 'border-warning-200 dark:border-warning-700',
    },
    medium: {
      bg: 'bg-error-100 dark:bg-error-900/30',
      text: 'text-error-800 dark:text-error-200',
      border: 'border-error-200 dark:border-error-700',
    },
    high: {
      bg: 'bg-error-100 dark:bg-error-900/30',
      text: 'text-error-800 dark:text-error-200',
      border: 'border-error-200 dark:border-error-700',
    },
  };

  const colors = severityColors[issue.severity];

  return (
    <div
      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <div className='flex items-start justify-between'>
        <div className={`font-medium ${colors.text}`}>{issue.issue}</div>
        <div className={`text-xs ${colors.text} opacity-75`}>{issue.frequency} cases</div>
      </div>
      {!compact && issue.description && (
        <p className={`mt-1 text-xs ${colors.text} opacity-80`}>{issue.description}</p>
      )}
    </div>
  );
};

// ============================================================================
// MAIN QUALITY INDICATORS COMPONENT
// ============================================================================

const QualityIndicators: React.FC<QualityIndicatorsProps> = ({
  className = '',
  refreshInterval = 60000,
  autoRefresh = false,
  showDetailed = false,
  compact: _compact = false, // Compact mode for display
}) => {
  const { data, loading, error, lastUpdated, refetch } = useQualityIndicators(
    autoRefresh,
    refreshInterval
  );

  // Transform quality data into metrics
  const getQualityMetrics = (): QualityMetric[] => {
    if (!data) return [];

    return [
      {
        label: 'Verification Rate',
        value: data.verification?.verificationRate || 0,
        change: 0, // Would come from trend data
        trend: 'up',
        icon: ShieldCheck,
        color: 'success',
        description: 'Percentage of plugins that have been verified',
        ariaLabel: `Plugin verification rate: ${data.verification?.verificationRate || 0}%`,
      },
      {
        label: 'Active Maintenance',
        value: data.maintenance?.activeMaintenanceRate || 0,
        change: 0,
        trend: 'stable',
        icon: Activity,
        color: 'primary',
        description: 'Plugins updated within the last 30 days',
        ariaLabel: `Active maintenance rate: ${data.maintenance?.activeMaintenanceRate || 0}%`,
      },
      {
        label: 'Quality Score',
        value: data.qualityMetrics?.avgQualityScore || 0,
        change: 0,
        trend: 'up',
        icon: Star,
        color: 'success',
        description: 'Average quality score across all plugins',
        ariaLabel: `Average quality score: ${data.qualityMetrics?.avgQualityScore || 0}/100`,
      },
      {
        label: 'Security Score',
        value: data.security?.securityScore || 0,
        change: 0,
        trend: 'stable',
        icon: Lock,
        color:
          data.security?.securityScore && data.security.securityScore >= 80 ? 'success' : 'warning',
        description: 'Overall ecosystem security assessment',
        ariaLabel: `Security score: ${data.security?.securityScore || 0}/100`,
      },
    ];
  };

  // Transform verification badges into trust signals
  const getTrustSignals = (): TrustSignal[] => {
    if (!data) return [];

    return [
      {
        type: 'security',
        count: data.verification?.badges?.find((b) => b.type === 'security')?.count || 0,
        icon: Shield,
        label: 'Security Verified',
        description: 'Plugins with security verification',
        color: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      },
      {
        type: 'quality',
        count: data.verification?.badges?.find((b) => b.type === 'quality')?.count || 0,
        icon: Award,
        label: 'Quality Assured',
        description: 'Plugins meeting quality standards',
        color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      },
      {
        type: 'popularity',
        count: data.verification?.badges?.find((b) => b.type === 'popularity')?.count || 0,
        icon: Users,
        label: 'Popular Choice',
        description: 'Highly rated and frequently used',
        color: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
      },
      {
        type: 'maintenance',
        count: data.verification?.badges?.find((b) => b.type === 'maintenance')?.count || 0,
        icon: Clock,
        label: 'Well Maintained',
        description: 'Regularly updated plugins',
        color: 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400',
      },
    ];
  };

  const metrics = getQualityMetrics();
  const trustSignals = getTrustSignals();

  // Loading state
  if (loading && !data) {
    return (
      <section className={className} aria-label='Quality Indicators'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-24 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
            ))}
          </div>
          <div className='h-32 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
        </div>
      </section>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <section className={className} aria-label='Quality Indicators'>
        <ErrorDisplay
          type='error'
          title='Failed to Load Quality Indicators'
          message={error}
          onRetry={refetch}
          className='w-full'
        />
      </section>
    );
  }

  return (
    <section className={`space-y-6 ${className}`} aria-label='Quality Indicators'>
      {/* Header */}
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
            <Shield className='w-6 h-6 text-primary-600 dark:text-primary-400' />
            Quality Indicators
          </h2>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            Ecosystem quality metrics, verification status, and trust signals
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Last updated info */}
          {lastUpdated && (
            <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
              <Calendar className='w-4 h-4 mr-1' />
              <span>Updated {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={refetch}
            disabled={loading}
            className='btn-ghost p-2 disabled:opacity-50'
            aria-label='Refresh quality indicators'
            title='Refresh quality indicators'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Quality Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map((metric, index) => (
          <article
            key={`${metric.label}-${index}`}
            className='card p-4 group cursor-pointer transition-all duration-300 hover:scale-[1.02] focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
            role='region'
            aria-label={metric.ariaLabel}
            tabIndex={0}
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center'>
                <div className='p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform duration-300 mr-3'>
                  <metric.icon className='w-5 h-5 text-primary-600 dark:text-primary-400' />
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                    {metric.label}
                  </h3>
                  <p className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                    {metric.value.toFixed(1)}%
                  </p>
                </div>
              </div>
              <TrendIndicator trend={metric.trend} value={metric.change} />
            </div>

            <ProgressBar
              value={metric.value}
              color={metric.color}
              size='sm'
              animated={!loading}
              ariaLabel={`${metric.label} progress`}
            />

            <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>{metric.description}</p>
          </article>
        ))}
      </div>

      {/* Trust Signals and Detailed Information */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Trust Signals */}
        <div className='card p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
            <ShieldCheck className='w-5 h-5 text-success-600 dark:text-success-400' />
            Trust Signals
          </h3>

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4'>
            {trustSignals.map((signal, index) => (
              <TrustBadge key={`${signal.type}-${index}`} signal={signal} size='md' />
            ))}
          </div>

          <div className='text-sm text-gray-600 dark:text-gray-400'>
            <p className='mb-2'>
              <strong>{data?.verification?.verifiedPlugins || 0}</strong> of{' '}
              <strong>{(data?.verification?.verifiedPlugins || 0) + 100}</strong> plugins are
              verified
            </p>
            <p>Verification ensures plugins meet security, quality, and maintenance standards.</p>
          </div>
        </div>

        {/* Maintenance Status */}
        <div className='card p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
            <Activity className='w-5 h-5 text-primary-600 dark:text-primary-400' />
            Maintenance Status
          </h3>

          <div className='space-y-4'>
            {data?.maintenance ? (
              <>
                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Recently Updated
                    </span>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                      {data?.maintenance?.recentlyUpdated || 0} plugins
                    </span>
                  </div>
                  <ProgressBar
                    value={data?.maintenance?.activeMaintenanceRate || 0}
                    color='success'
                    size='sm'
                    ariaLabel='Recently updated plugins percentage'
                  />
                </div>

                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Average Update Frequency
                    </span>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                      Every {data?.maintenance?.avgUpdateFrequency || 'N/A'} days
                    </span>
                  </div>
                </div>

                {data?.maintenance?.abandonedPlugins && data.maintenance.abandonedPlugins > 0 && (
                  <div className='p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg border border-warning-200 dark:border-warning-700'>
                    <div className='flex items-center text-warning-800 dark:text-warning-200'>
                      <AlertTriangle className='w-4 h-4 mr-2' />
                      <span className='text-sm font-medium'>
                        {data.maintenance?.abandonedPlugins || 0} plugins haven&apos;t been updated
                        in 6+ months
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
                <p className='text-sm'>Maintenance data not available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetailed && data && (
        <div className='space-y-6'>
          {/* Quality Issues */}
          {data.qualityMetrics.commonIssues.length > 0 && (
            <div className='card p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                <BarChart3 className='w-5 h-5 text-warning-600 dark:text-warning-400' />
                Common Quality Issues
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {data.qualityMetrics.commonIssues.map((issue, index) => (
                  <QualityIssueCard
                    key={index}
                    issue={{
                      ...issue,
                      description: `${issue.severity} severity issue found in ${issue.frequency} plugins`,
                    }}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quality Score Distribution */}
          <div className='card p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
              <Star className='w-5 h-5 text-yellow-500' />
              Quality Score Distribution
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg'>
                <div className='text-2xl font-bold text-success-600 dark:text-success-400'>
                  {data.qualityMetrics.highQualityPlugins}
                </div>
                <div className='text-sm text-gray-600 dark:text-gray-400'>High Quality (80+)</div>
              </div>
              <div className='text-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg'>
                <div className='text-2xl font-bold text-warning-600 dark:text-warning-400'>
                  {data.qualityMetrics.avgQualityScore.toFixed(1)}
                </div>
                <div className='text-sm text-gray-600 dark:text-gray-400'>Average Score</div>
              </div>
              <div className='text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg'>
                <div className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
                  {(
                    (data.qualityMetrics.highQualityPlugins /
                      (data.qualityMetrics.highQualityPlugins + 50)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <div className='text-sm text-gray-600 dark:text-gray-400'>Quality Rate</div>
              </div>
            </div>
          </div>

          {/* Security Overview */}
          {data.security && (
            <div className='card p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
                <Lock className='w-5 h-5 text-error-600 dark:text-error-400' />
                Security Overview
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
                    <Eye className='w-4 h-4 mr-1' />
                    Security Scanned
                  </div>
                  <div className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                    {data.security.scannedPlugins} plugins
                  </div>
                </div>
                <div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
                    <AlertTriangle className='w-4 h-4 mr-1' />
                    Critical Issues
                  </div>
                  <div className='text-lg font-bold text-error-600 dark:text-error-400'>
                    {data.security.criticalIssues}
                  </div>
                </div>
                <div>
                  <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
                    <Shield className='w-4 h-4 mr-1' />
                    Security Score
                  </div>
                  <div className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                    {data.security.securityScore}/100
                  </div>
                </div>
              </div>

              <div className='mt-4'>
                <ProgressBar
                  value={data.security.securityScore}
                  color={
                    data.security.securityScore >= 80
                      ? 'success'
                      : data.security.securityScore >= 60
                        ? 'warning'
                        : 'error'
                  }
                  size='md'
                  ariaLabel='Overall security score'
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default QualityIndicators;
