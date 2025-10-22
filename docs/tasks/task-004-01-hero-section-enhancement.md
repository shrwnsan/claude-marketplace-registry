# Task-004-01: Update Hero Section Information Architecture

**Assigned To**: Junior Developer
**Estimated Time**: 4-6 hours
**Priority**: High
**Sprint**: 1
**PRD Reference**: PRD-004: Metrics Display Restructure

## 📋 Overview

Transform the current hero metrics section into a clear, scannable "Ecosystem at a Glance" overview that eliminates redundancy and provides clear navigation to detailed analytics.

## 🎯 Objectives

- Eliminate redundancy with Ecosystem Overview section
- Improve information hierarchy and user experience
- Provide clear navigation path to detailed analytics
- Ensure data consistency with other sections

## 🔧 Technical Requirements

### Files to Modify:
- `src/pages/index.tsx` (lines 118-166)

### Specific Changes Required:

1. **Add Section Header** (lines 118-120):
   ```typescript
   {/* Ecosystem at a Glance */}
   <div className="text-center mb-8">
     <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
       Ecosystem at a Glance
     </h2>
     <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
       Key metrics from the Claude Code plugin ecosystem. For detailed analytics and trends,
       see the <a href="#analytics-dashboard" className="text-primary-600 dark:text-primary-400 hover:underline">Ecosystem Statistics</a> section below.
     </p>
   </div>
   ```

2. **Update Metric Labels** (lines 130, 140, 150, 160):
   - "Plugins" → "Total Plugins"
   - "Marketplaces" → "Marketplaces" (already correct)
   - "Downloads" → "Total Downloads"
   - "Stars" → "GitHub Stars"

3. **Fix Icon Consistency** (line 135):
   ```typescript
   // Change from Users to Store icon
   <Store className="w-6 h-6 sm:w-8 sm:h-8 text-success-600 dark:text-success-400" />
   ```

4. **Update Color Schemes**:
   - Plugins: Primary color (keep as is)
   - Marketplaces: Success color (green)
   - Downloads: Warning color (orange/yellow)
   - Stars: Purple color (new)

5. **Add Data Freshness Note** (after line 163):
   ```typescript
   {/* Quick Stats Note */}
   <div className="text-center mt-6">
     <p className="text-xs text-gray-500 dark:text-gray-400">
       Data based on {dynamicStats.totalPlugins} indexed plugins across {dynamicStats.totalMarketplaces} marketplaces
     </p>
   </div>
   ```

## ✅ Acceptance Criteria

- [ ] Section displays "Ecosystem at a Glance" header
- [ ] Navigation link to "#analytics-dashboard" works correctly
- [ ] All metric labels are descriptive and clear
- [ ] Store icon is used for marketplaces (not Users)
- [ ] Color schemes follow design system consistently
- [ ] Data freshness note displays at bottom
- [ ] Responsive design works on mobile and desktop
- [ ] No TypeScript errors
- [ ] All existing functionality preserved

## 🧪 Testing Instructions

### Manual Testing:
1. Navigate to localhost:3001
2. Verify section header displays correctly
3. Click the "Ecosystem Statistics" link - should scroll to analytics section
4. Verify all metric cards display with correct icons and colors
5. Test responsive design on different screen sizes
6. Check hover states and transitions work properly

### Automated Testing:
- Run existing unit tests: `npm test`
- Ensure no new TypeScript errors: `npm run type-check`
- Verify build completes: `npm run build`

## 🚧 Implementation Notes

### CSS Classes to Use:
- `bg-success-100 dark:bg-success-900/30` for marketplaces
- `text-success-600 dark:text-success-400` for marketplaces icon
- `bg-warning-100 dark:bg-warning-900/30` for downloads
- `text-warning-600 dark:text-warning-400` for downloads icon
- `bg-purple-100 dark:bg-purple-900/30` for stars
- `text-purple-600 dark:text-purple-400` for stars icon

### Import Requirements:
Ensure `Store` icon is imported from lucide-react:
```typescript
import { Package, Store, Download, Star } from 'lucide-react';
```

## 🔍 Code Review Checklist

- [ ] No duplicate imports
- [ ] Consistent indentation and formatting
- [ ] Proper TypeScript types maintained
- [ ] Accessibility attributes preserved
- [ ] Error handling maintained
- [ ] Loading states preserved

## 🚀 Deployment Notes

- This change is low-risk and only affects UI presentation
- No API changes required
- No database changes required
- Can be deployed independently

## 📚 Additional Resources

- [Lucide React Icons Documentation](https://lucide.dev/)
- [Tailwind CSS Color Reference](https://tailwindcss.com/docs/customizing-colors)
- [PRD-004](./prd-004-metrics-display-restructure.md) for full context

---

**Questions?**: Ask in the #development Slack channel or create an issue in GitHub.