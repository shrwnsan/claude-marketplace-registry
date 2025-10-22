import React from 'react';
import Head from 'next/head';
import MainLayout from '../../components/layout/MainLayout';
import CategoryAnalytics from '../../components/EcosystemStats/CategoryAnalytics';
import { CategoryData } from '../../types/ecosystem-stats';

const CategoryAnalyticsDemo: React.FC = () => {
  const handleCategoryClick = (category: CategoryData) => {
    console.log('Category clicked:', category);
    // In a real app, this would navigate to a filtered view of plugins
    alert(`Clicked on ${category.name} category with ${category.count} plugins`);
  };

  return (
    <>
      <Head>
        <title>Category Analytics Demo - Claude Marketplace Aggregator</title>
        <meta name="description" content="Demo of CategoryAnalytics component" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainLayout>
        {/* Demo Header */}
        <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Category Analytics Component Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Interactive plugin category breakdown with visualizations and insights.
                This demo showcases the CategoryAnalytics component with all its features.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📊 Interactive Visualizations
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Click on pie chart segments to filter categories
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    📈 Growth Analytics
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Track trending categories and growth indicators
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    🤖 AI Insights
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Get AI-generated insights about category trends
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Responsive Design
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  TypeScript
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Recharts Integration
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Accessibility (ARIA)
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Error Handling
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  Loading States
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Component Demo */}
        <section className="py-12 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CategoryAnalytics
              onCategoryClick={handleCategoryClick}
              period="30d"
              showEmerging={true}
              enableFiltering={true}
            />
          </div>
        </section>

        {/* Component Features Documentation */}
        <section className="py-12 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Component Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  🎯 Core Functionality
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Fetches category data from `/api/ecosystem-stats?categories`
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Interactive pie/donut charts using Recharts
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Growth rate bar charts with visual indicators
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Clickable categories for filtering capabilities
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Trending and emerging categories highlighting
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  🎨 User Experience
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Responsive design for all screen sizes
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Hover states with detailed category information
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Loading states and error handling
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Dark mode support
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Smooth animations and transitions
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  🔧 Technical Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    TypeScript with strict type safety
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Accessibility with ARIA labels and keyboard navigation
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Proper error boundaries and fallback states
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Component composition and reusability
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Custom hooks for data fetching and state management
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  📊 Analytics Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Category distribution visualization
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Growth rate analysis and comparison
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    AI-generated insights and recommendations
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Opportunity identification (underserved categories)
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Top plugins per category display
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    </>
  );
};

export default CategoryAnalyticsDemo;