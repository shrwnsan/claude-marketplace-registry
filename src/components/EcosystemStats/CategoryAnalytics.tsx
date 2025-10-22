import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  X,
  Star,
  Package,
  Eye,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { CategoryAnalytics as ICategoryAnalytics, CategoryData, EcosystemStatsResponse } from '../../types/ecosystem-stats';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface CategoryAnalyticsProps {
  /** Initial selected categories for filtering */
  initialSelectedCategories?: string[];
  /** Whether to show emerging categories section */
  showEmerging?: boolean;
  /** Whether to enable filtering mode */
  enableFiltering?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** On category click callback */
  onCategoryClick?: (category: CategoryData) => void;
  /** Time period for analytics */
  period?: '7d' | '30d' | '90d' | '1y';
}

interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  growthRate: number;
  trending: boolean;
  count: number;
  color: string;
  [key: string]: any; // Add index signature for recharts compatibility
}

interface CategoryInsight {
  type: 'trending' | 'emerging' | 'opportunity' | 'declining';
  category: string;
  message: string;
  value: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatGrowthRate = (rate: number): string => {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
};

const generateCategoryColor = (index: number, trending: boolean): string => {
  const trendingColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  const regularColors = [
    '#6b7280', // gray
    '#9ca3af', // light gray
    '#d1d5db', // lighter gray
    '#e5e7eb', // lightest gray
    '#f3f4f6', // ultra light gray
  ];

  return trending ? trendingColors[index % trendingColors.length] : regularColors[index % regularColors.length];
};

const getGrowthIcon = (growthRate: number) => {
  if (growthRate > 10) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (growthRate < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Activity className="w-4 h-4 text-yellow-500" />;
};

const getInsightIcon = (type: CategoryInsight['type']) => {
  switch (type) {
    case 'trending': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'emerging': return <Star className="w-4 h-4 text-blue-500" />;
    case 'opportunity': return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useCategoryAnalytics = (period: string = '30d') => {
  const [data, setData] = useState<ICategoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ecosystem-stats?categories&period=${period}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: EcosystemStatsResponse<ICategoryAnalytics> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to fetch category analytics');
      }

      setData(result.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching category analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  return { data, loading, error, refetch: fetchCategoryData };
};

// ============================================================================
// CHART COMPONENTS
// ============================================================================

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = (payload as any[])[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <Package className="inline w-3 h-3 mr-1" />
        {data.count} plugins
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <Eye className="inline w-3 h-3 mr-1" />
        {formatPercentage(data.percentage)}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
        {getGrowthIcon(data.growthRate)}
        <span className="ml-1">{formatGrowthRate(data.growthRate)}</span>
      </p>
      {data.trending && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          <TrendingUp className="inline w-3 h-3 mr-1" />
          Trending
        </p>
      )}
    </div>
  );
};

const CategoryLegend = ({ categories, selectedCategories, onCategoryToggle }: {
  categories: CategoryData[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
      {categories.map((category, index) => {
        const isSelected = selectedCategories.includes(category.id);
        const color = generateCategoryColor(index, category.trending);

        return (
          <button
            key={category.id}
            onClick={() => onCategoryToggle(category.id)}
            className={`
              flex items-center p-2 rounded-lg border transition-all duration-200
              ${isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            aria-label={`Toggle ${category.name} category`}
            aria-pressed={isSelected}
          >
            <div
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {category.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {category.count} plugins
              </p>
            </div>
            {category.trending && (
              <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0 ml-1" />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({
  initialSelectedCategories = [],
  showEmerging = true,
  enableFiltering = true,
  className = '',
  onCategoryClick,
  period = '30d'
}) => {
  const { data, loading, error, refetch } = useCategoryAnalytics(period);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategories);
  const [filterMode, setFilterMode] = useState(false);
  
  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const processedChartData = useMemo((): ChartDataPoint[] => {
    if (!data?.categories) return [];

    return data.categories
      .filter(category => selectedCategories.length === 0 || selectedCategories.includes(category.id))
      .map((category, index) => ({
        name: category.name,
        value: category.count,
        percentage: category.percentage / 100,
        growthRate: category.growthRate,
        trending: category.trending,
        count: category.count,
        color: generateCategoryColor(index, category.trending)
      }))
      .sort((a, b) => b.count - a.count);
  }, [data?.categories, selectedCategories]);

  const growthChartData = useMemo(() => {
    if (!data?.categories) return [];

    return data.categories
      .filter(category => selectedCategories.length === 0 || selectedCategories.includes(category.id))
      .map((category) => ({
        name: category.name,
        growth: category.growthRate,
        count: category.count,
        trending: category.trending
      }))
      .sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth))
      .slice(0, 10);
  }, [data?.categories, selectedCategories]);

  const categoryInsights = useMemo((): CategoryInsight[] => {
    if (!data?.categories) return [];

    const insights: CategoryInsight[] = [];

    // Trending categories (high growth rate)
    const trendingCategories = data.categories
      .filter(c => c.growthRate > 15)
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 3);

    trendingCategories.forEach(category => {
      insights.push({
        type: 'trending',
        category: category.name,
        message: `Rapidly growing with ${formatGrowthRate(category.growthRate)} growth`,
        value: category.growthRate
      });
    });

    // Emerging categories (moderate growth, smaller base)
    const emergingCategories = data.categories
      .filter(c => c.growthRate > 8 && c.count < 50)
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 2);

    emergingCategories.forEach(category => {
      insights.push({
        type: 'emerging',
        category: category.name,
        message: `Emerging category with growth potential`,
        value: category.growthRate
      });
    });

    // Opportunity categories (underserved)
    const underservedCategories = data.underserved || [];
    underservedCategories.slice(0, 2).forEach(categoryName => {
      const category = data.categories.find(c => c.name === categoryName);
      if (category) {
        insights.push({
          type: 'opportunity',
          category: category.name,
          message: `Underserved category with opportunity`,
          value: category.count
        });
      }
    });

    // Declining categories (negative growth)
    const decliningCategories = data.categories
      .filter(c => c.growthRate < -5)
      .sort((a, b) => a.growthRate - b.growthRate)
      .slice(0, 2);

    decliningCategories.forEach(category => {
      insights.push({
        type: 'declining',
        category: category.name,
        message: `Declining with ${formatGrowthRate(category.growthRate)} change`,
        value: category.growthRate
      });
    });

    return insights;
  }, [data]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handleCategoryClick = useCallback((category: CategoryData) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
    if (enableFiltering) {
      handleCategoryToggle(category.id);
    }
  }, [onCategoryClick, enableFiltering, handleCategoryToggle]);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <div className={`card p-8 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-lg text-gray-600 dark:text-gray-400">
            Loading category analytics...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card p-8 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <div className="text-left">
            <p className="text-lg text-red-600 dark:text-red-400 font-medium">
              Error loading analytics
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {error}
            </p>
            <button
              onClick={refetch}
              className="mt-3 flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.categories || data.categories.length === 0) {
    return (
      <div className={`card p-8 ${className}`}>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No category data available
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Category Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Explore plugin distribution and growth trends across categories
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {enableFiltering && (
            <button
              onClick={() => setFilterMode(!filterMode)}
              className={`btn-ghost p-2 ${filterMode ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
              aria-label={filterMode ? 'Exit filter mode' : 'Enter filter mode'}
            >
              <Filter className="w-5 h-5" />
            </button>
          )}

          {selectedCategories.length > 0 && (
            <button
              onClick={clearFilters}
              className="btn-ghost p-2"
              aria-label="Clear all filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {selectedCategories.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            Filtering by {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'}
          </span>
          <button
            onClick={clearFilters}
            className="ml-auto text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  return `${name} ${formatPercentage(percent * 100)}`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {processedChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const category = data.categories.find(c => c.name === entry.name);
                      if (category) handleCategoryClick(category);
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Growth Rates by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value: unknown) => [formatGrowthRate(value as number), 'Growth Rate']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar
                dataKey="growth"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Mode - Category Selection */}
      {filterMode && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Select Categories to Display
          </h3>
          <CategoryLegend
            categories={data.categories}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        </div>
      )}

      {/* Category Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Category Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryInsights.map((insight, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {insight.category}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emerging Categories */}
      {showEmerging && data.emerging && data.emerging.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Emerging Categories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.emerging.map((categoryName, index) => {
              const category = data.categories.find(c => c.name === categoryName);
              if (!category) return null;

              return (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {category.count} plugins
                      </p>
                    </div>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {formatGrowthRate(category.growthRate)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCategoryClick(category)}
                    className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    Explore plugins →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI-Generated Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            AI-Generated Insights
          </h3>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <Star className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryAnalytics;