# OverviewMetrics Component

A comprehensive React component for displaying ecosystem overview metrics in the Claude Code Marketplace Registry.

## Features

### 🎯 Core Functionality
- **Real-time Data Fetching**: Fetches ecosystem statistics from `/api/ecosystem-stats?overview`
- **Auto-refresh Support**: Optional automatic data refresh with configurable intervals
- **Responsive Design**: Adapts seamlessly from mobile to desktop viewports
- **TypeScript Safety**: Full TypeScript support with strict type checking

### 📊 Metrics Displayed
- **Total Plugins**: Number of unique plugins across all marketplaces
- **Total Marketplaces**: Number of active marketplaces in the ecosystem
- **Total Developers**: Number of unique plugin developers
- **Total Downloads**: Aggregated download count across all plugins
- **Growth Rates**: 30-day growth trends for each metric
- **Health Score**: Overall ecosystem health indicator (0-100)

### ✨ Interactive Elements
- **Hover Effects**: Cards scale and translate on hover with smooth animations
- **Growth Indicators**: Visual trend indicators with up/down arrows
- **Loading States**: Skeleton cards during data fetching
- **Error Handling**: User-friendly error display with retry functionality
- **Manual Refresh**: Refresh button for manual data updates

### ♿ Accessibility Features
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators and management
- **Semantic HTML**: Correct use of HTML5 semantic elements
- **Progress Bar**: Accessible health score visualization

## Usage

### Basic Implementation

```tsx
import { OverviewMetrics } from '@/components/EcosystemStats';

function EcosystemDashboard() {
  return (
    <div>
      <h1>Ecosystem Dashboard</h1>
      <OverviewMetrics />
    </div>
  );
}
```

### With Auto-Refresh

```tsx
import { OverviewMetrics } from '@/components/EcosystemStats';

function EcosystemDashboard() {
  return (
    <OverviewMetrics
      autoRefresh={true}
      refreshInterval={30000} // 30 seconds
      className="my-custom-class"
    />
  );
}
```

### With Custom Styling

```tsx
import { OverviewMetrics } from '@/components/EcosystemStats';

function EcosystemDashboard() {
  return (
    <div className="p-6">
      <OverviewMetrics
        className="max-w-7xl mx-auto"
        autoRefresh={false}
      />
    </div>
  );
}
```

## API Integration

### Expected API Response

The component expects a response from `/api/ecosystem-stats?overview` with the following structure:

```typescript
interface EcosystemStatsResponse<EcosystemOverview> {
  success: boolean;
  data?: EcosystemOverview;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    responseTime: number;
    cache?: {
      hit: boolean;
      ttl: number;
      expiresAt?: string;
    };
  };
}
```

### EcosystemOverview Interface

```typescript
interface EcosystemOverview {
  totalPlugins: number;
  totalMarketplaces: number;
  totalDevelopers: number;
  totalDownloads: number;
  lastUpdated: string;
  growthRate: {
    plugins: number;
    marketplaces: number;
    developers: number;
    downloads: number;
  };
  healthScore?: number;
  activeUsers?: number;
}
```

## Component Architecture

### File Structure

```
src/components/EcosystemStats/
├── OverviewMetrics.tsx         # Main component
├── OverviewMetricsDemo.tsx     # Demo component for testing
├── mock-api-data.ts           # Mock data for development
├── __tests__/
│   └── OverviewMetrics.test.tsx # Comprehensive test suite
├── README.md                  # This documentation
└── index.ts                   # Component exports
```

### Key Components

1. **OverviewMetrics**: Main component with full functionality
2. **useEcosystemOverview**: Custom hook for data fetching and state management
3. **MetricCard**: Individual metric card component
4. **ChangeIndicator**: Component for displaying growth/decline trends

## Design System Integration

### Tailwind CSS Classes Used

The component follows the existing design system with these utility classes:

- **Cards**: `card`, `card-interactive`
- **Buttons**: `btn`, `btn-primary`, `btn-ghost`
- **Colors**: `primary`, `secondary`, `success`, `warning`, `error`
- **Animations**: `animate-pulse`, `animate-fade-in`, `hover:scale-[1.02]`
- **Transitions**: `transition-all`, `duration-300`

### Responsive Breakpoints

- **Mobile**: 1 column (default)
- **Tablet**: 2 columns (`md:grid-cols-2`)
- **Desktop**: 4 columns (`lg:grid-cols-4`)

## Testing

### Running Tests

```bash
npm test -- OverviewMetrics
```

### Test Coverage

The test suite covers:
- Component rendering with different states
- Data fetching and error handling
- User interactions (hover, click, keyboard)
- Accessibility compliance
- Number formatting and display
- Responsive behavior

### Mock Data

For development and testing, use the provided mock data:

```tsx
import { mockEcosystemOverview } from '@/components/EcosystemStats';

// Use in your tests or development environment
const mockData = mockEcosystemOverview;
```

## Performance Considerations

### Optimization Features

1. **Memoization**: Component uses React hooks for optimal re-rendering
2. **Debounced Refresh**: Auto-refresh intervals prevent excessive API calls
3. **Skeleton Loading**: Smooth loading states improve perceived performance
4. **Cache Busting**: `cache: 'no-cache'` ensures fresh data
5. **Lazy Loading**: Component structure supports future lazy loading

### Bundle Size

The component has minimal dependencies:
- React (already in project)
- Lucide React icons
- Existing UI components (LoadingSpinner, ErrorDisplay)

## Browser Support

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **ES6+ Features**: Uses modern JavaScript features
- **CSS Grid & Flexbox**: For responsive layouts
- **CSS Custom Properties**: For theming support

## Customization

### Theming

The component respects the existing Tailwind CSS theme configuration:

```css
/* Custom colors can be overridden in your theme */
:root {
  --primary-500: #3b82f6;
  --success-500: #22c55e;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
}
```

### Extending Metrics

To add new metrics:

1. Update the `EcosystemOverview` type in `src/types/ecosystem-stats.ts`
2. Add the new metric to the `getMetrics()` function
3. Include appropriate icon and color configuration

## Troubleshooting

### Common Issues

1. **API Not Responding**: Check that `/api/ecosystem-stats?overview` endpoint exists
2. **CORS Issues**: Ensure proper CORS configuration on the API
3. **Type Errors**: Verify the API response matches the expected TypeScript interface
4. **Styling Issues**: Check Tailwind CSS classes are properly configured

### Debug Mode

Enable debug logging:

```tsx
// In development, add logging to see data flow
const { data, loading, error } = useEcosystemOverview(autoRefresh, refreshInterval);

console.log('Ecosystem Data:', { data, loading, error });
```

## Contributing

When contributing to this component:

1. Follow the existing TypeScript patterns
2. Maintain accessibility standards
3. Update tests for new features
4. Use the established design system
5. Document breaking changes

# GrowthTrends Component

A comprehensive React component for visualizing ecosystem growth over time with interactive line charts showing plugin growth, marketplace growth, and download trends.

## Features

### 🎯 Core Functionality
- **Interactive Time-Series Charts**: Beautiful line charts using Recharts library
- **Time Range Selector**: Quick navigation between 7d, 30d, 90d, and 1y views
- **Real-time Data Fetching**: Fetches growth data from `/api/ecosystem-stats?growth&timeRange={range}`
- **Auto-refresh Support**: Optional automatic data refresh with configurable intervals
- **Responsive Design**: Adapts seamlessly from mobile to desktop viewports
- **TypeScript Safety**: Full TypeScript support with strict type checking

### 📊 Metrics Displayed
- **Plugins Growth**: Track plugin count growth over time
- **Marketplaces Growth**: Monitor marketplace ecosystem expansion
- **Developers Growth**: Follow developer community growth
- **Downloads Growth**: Analyze download trends and adoption
- **Growth Statistics**: Real-time cards showing current values and trends
- **Interactive Tooltips**: Detailed information on hover

### ✨ Interactive Elements
- **Smooth Animations**: Chart animations with 750ms duration
- **Hover Effects**: Interactive data points with visual feedback
- **Time Range Controls**: Easy switching between different time periods
- **Loading States**: Skeleton loading during data fetching
- **Error Handling**: User-friendly error display with retry functionality
- **Manual Refresh**: Refresh button for immediate data updates

### ♿ Accessibility Features
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility for all controls
- **Focus Management**: Proper focus indicators and management
- **Semantic HTML**: Correct use of HTML5 semantic elements
- **Live Regions**: Screen reader announcements for state changes

## Usage

### Basic Implementation

```tsx
import GrowthTrends from '@/components/EcosystemStats/GrowthTrends';

function EcosystemDashboard() {
  return (
    <div>
      <h1>Ecosystem Growth Dashboard</h1>
      <GrowthTrends />
    </div>
  );
}
```

### With Custom Configuration

```tsx
import GrowthTrends from '@/components/EcosystemStats/GrowthTrends';

function EcosystemDashboard() {
  return (
    <GrowthTrends
      initialTimeRange="90d"
      showMetrics={{
        plugins: true,
        marketplaces: false, // Hide marketplaces
        developers: true,
        downloads: true,
      }}
      refreshInterval={5 * 60 * 1000} // 5 minutes
      className="max-w-7xl mx-auto"
    />
  );
}
```

### With Selective Metrics

```tsx
import GrowthTrends from '@/components/EcosystemStats/GrowthTrends';

function PluginsOnlyDashboard() {
  return (
    <GrowthTrends
      initialTimeRange="30d"
      showMetrics={{
        plugins: true,
        marketplaces: false,
        developers: false,
        downloads: false,
      }}
    />
  );
}
```

## API Integration

### Expected API Response

The component expects a response from `/api/ecosystem-stats?metric=growth&timeRange={range}` with the following structure:

```typescript
interface GrowthDataResponse {
  plugins: TrendDataPoint[];
  marketplaces: TrendDataPoint[];
  developers: TrendDataPoint[];
  downloads: TrendDataPoint[];
  period: TimeRange;
  aggregation: 'daily' | 'weekly' | 'monthly';
}

interface TrendDataPoint {
  date: string;
  value: number;
  change?: number;
  metadata?: Record<string, unknown>;
}
```

### API Endpoints

- `GET /api/ecosystem-stats?metric=growth&timeRange=7d` - Last 7 days
- `GET /api/ecosystem-stats?metric=growth&timeRange=30d` - Last 30 days
- `GET /api/ecosystem-stats?metric=growth&timeRange=90d` - Last 90 days
- `GET /api/ecosystem-stats?metric=growth&timeRange=1y` - Last year

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialTimeRange` | `TimeRange` | `'30d'` | Initial time range for the chart |
| `className` | `string` | `''` | Additional CSS classes for the container |
| `showMetrics` | `ShowMetricsConfig` | `{ plugins: true, marketplaces: true, developers: true, downloads: true }` | Which metrics to display |
| `refreshInterval` | `number` | `undefined` | Auto-refresh interval in milliseconds |

### ShowMetricsConfig Interface

```typescript
interface ShowMetricsConfig {
  plugins?: boolean;
  marketplaces?: boolean;
  developers?: boolean;
  downloads?: boolean;
}
```

### TimeRange Type

```typescript
type TimeRange = '7d' | '30d' | '90d' | '1y';
```

## Design System Integration

### Tailwind CSS Classes Used

The component follows the existing design system with these utility classes:

- **Charts**: Recharts with custom styling
- **Cards**: Metric cards with hover effects
- **Buttons**: Time range selector with active states
- **Colors**: Consistent with brand colors (blue, emerald, amber, violet)
- **Animations**: `transition-all`, `duration-200`, `hover:scale-105`
- **Responsive**: `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-4`

### Color Scheme

- **Plugins**: Blue (`#3b82f6`)
- **Marketplaces**: Emerald (`#10b981`)
- **Developers**: Amber (`#f59e0b`)
- **Downloads**: Violet (`#8b5cf6`)

## Performance Considerations

### Optimization Features

1. **Memoization**: Chart data transformation is memoized with `useMemo`
2. **Debounced API Calls**: Prevents excessive requests during time range changes
3. **Skeleton Loading**: Smooth loading states improve perceived performance
4. **Background Refresh**: Non-blocking auto-refresh functionality
5. **Efficient Re-renders**: Proper dependency arrays in React hooks

### Mock Data Fallback

For development and testing, the component includes built-in mock data generation. When the API is unavailable or returns errors, it automatically falls back to realistic mock data to ensure the component remains functional.

## Testing

### Running Tests

```bash
npm test -- GrowthTrends
```

### Test Coverage

The comprehensive test suite covers:
- Component rendering with different states
- Time range selection and API calls
- Data transformation and chart rendering
- Error handling and fallback scenarios
- User interactions (hover, click, keyboard)
- Accessibility compliance and ARIA attributes
- Number formatting and display
- Auto-refresh functionality
- Responsive behavior

### Example Test

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GrowthTrends from '../GrowthTrends';

test('renders growth trends with time range selector', async () => {
  render(<GrowthTrends />);

  expect(screen.getByText('Ecosystem Growth Trends')).toBeInTheDocument();
  expect(screen.getByText('7 Days')).toBeInTheDocument();
  expect(screen.getByText('30 Days')).toBeInTheDocument();

  // Test time range change
  const ninetyDaysButton = screen.getByText('90 Days');
  fireEvent.click(ninetyDaysButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/ecosystem-stats?metric=growth&timeRange=90d');
  });
});
```

## Browser Support

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **ES6+ Features**: Uses modern JavaScript features
- **SVG Charts**: Recharts uses SVG for rendering
- **CSS Grid & Flexbox**: For responsive layouts
- **CSS Custom Properties**: For theming support

## Customization

### Extending Metrics

To add new metrics to the chart:

1. Update the `GrowthDataResponse` interface in `src/types/ecosystem-stats.ts`
2. Add the new metric to the mock data generation
3. Include appropriate color and styling configuration
4. Update the chart rendering logic

### Custom Styling

```tsx
<GrowthTrends
  className="custom-chart-container"
  // You can override colors through CSS custom properties
  style={{
    '--plugins-color': '#custom-blue',
    '--marketplaces-color': '#custom-green',
  } as React.CSSProperties}
/>
```

## Troubleshooting

### Common Issues

1. **Chart Not Rendering**: Check that Recharts is properly installed and data is valid
2. **API Not Responding**: Verify `/api/ecosystem-stats?growth` endpoint exists and returns expected format
3. **Time Range Not Working**: Ensure API supports the requested time range
4. **Styling Issues**: Check Tailwind CSS classes are properly configured
5. **Performance Issues**: Consider reducing refresh interval or optimizing data size

### Debug Mode

Enable debug logging to see data flow:

```tsx
// Add logging to see chart data transformation
const chartData = useMemo(() => {
  const transformed = transformDataForChart(growthData);
  console.log('Transformed Chart Data:', transformed);
  return transformed;
}, [growthData]);
```

## Examples

### Complete Dashboard Example

```tsx
import React, { useState } from 'react';
import GrowthTrends from '@/components/EcosystemStats/GrowthTrends';
import { TimeRange } from '@/utils/data-processor';

function EcosystemGrowthDashboard() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30d');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Ecosystem Growth Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track the growth of the Claude Code plugin ecosystem over time
          </p>
        </header>

        <main>
          <GrowthTrends
            initialTimeRange={selectedRange}
            refreshInterval={5 * 60 * 1000} // 5 minutes
            className="mb-8"
          />

          {/* Additional dashboard components */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* More components here */}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## License

This component is part of the Claude Code Marketplace Registry project.