# Task-004-03: Add Section Anchors and Navigation

**Assigned To**: Junior Developer
**Estimated Time**: 2-3 hours
**Priority**: High
**Sprint**: 1
**PRD Reference**: PRD-004: Metrics Display Restructure

## 📋 Overview

Implement proper section anchors and navigation to improve user flow between the hero section "Ecosystem at a Glance" and the detailed "Analytics Dashboard" sections.

## 🎯 Objectives

- Add semantic section anchors for all major sections
- Implement smooth scrolling navigation between sections
- Update navigation links to use proper anchors
- Ensure URL updates reflect current section
- Improve user navigation experience

## 🔧 Technical Requirements

### Files to Modify:
- `src/pages/index.tsx`
- `src/components/EcosystemStats/EcosystemStats.tsx`
- `src/components/layout/MainLayout.tsx` (if navigation exists)

### Specific Changes Required:

#### 1. Add Section Anchors in index.tsx

**Hero Section Anchor** (around line 118):
```typescript
{/* Ecosystem at a Glance */}
<section id="ecosystem-at-a-glance" className="relative py-12 sm:py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Ecosystem at a Glance
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Key metrics from the Claude Code plugin ecosystem. For detailed analytics and trends,
        see the <a href="#analytics-dashboard" className="text-primary-600 dark:text-primary-400 hover:underline">Ecosystem Statistics</a> section below.
      </p>
    </div>
    {/* ... existing stats content ... */}
  </div>
</section>
```

#### 2. Add EcosystemStats Section Anchor

**Update EcosystemStats.tsx** (around line 30):
```typescript
const EcosystemStats: React.FC<EcosystemStatsProps> = ({
  className = '',
  refreshInterval = 60000,
  autoRefresh = false,
}) => {
  const { data, loading, error, lastUpdated, refetch } = useEcosystemOverview(autoRefresh, refreshInterval);

  return (
    <section id="analytics-dashboard" className={`space-y-4 ${className}`} aria-label="Ecosystem Analytics Dashboard">
      {/* ... existing content ... */}
    </section>
  );
};
```

#### 3. Add Growth Trends Section Anchor

**Update GrowthTrends.tsx** (around line 30):
```typescript
const GrowthTrends: React.FC<GrowthTrendsProps> = ({
  className = '',
  refreshInterval = 60000,
  autoRefresh = false,
}) => {
  const { data, loading, error, refetch } = useGrowthTrends(autoRefresh, refreshInterval);

  return (
    <section id="trend-analysis" className={`space-y-6 ${className}`} aria-label="Growth Trend Analysis">
      {/* ... existing content ... */}
    </section>
  );
};
```

#### 4. Implement Smooth Scrolling

**Create or update smooth scroll utility** (new file: `src/utils/scroll.ts`):
```typescript
/**
 * Smooth scrolling utility
 */
export const smoothScrollTo = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

/**
 * Handle anchor link clicks with smooth scrolling
 */
export const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
  e.preventDefault();
  const href = e.currentTarget.getAttribute('href');
  if (href && href.startsWith('#')) {
    const elementId = href.substring(1);
    smoothScrollTo(elementId);

    // Update URL without page reload
    window.history.pushState(null, '', href);
  }
};
```

#### 5. Update Navigation Links to Use Smooth Scrolling

**In index.tsx**, update the navigation link:
```typescript
import { handleAnchorClick } from '../utils/scroll';

// In the component:
<a
  href="#analytics-dashboard"
  className="text-primary-600 dark:text-primary-400 hover:underline"
  onClick={handleAnchorClick}
>
  Ecosystem Statistics
</a>
```

#### 6. Add Back to Top Navigation (Optional Enhancement)

**Add back-to-top button component** (new file: `src/components/ui/BackToTop.tsx`):
```typescript
import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 p-3 bg-primary-600 dark:bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200 z-50"
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
```

**Add BackToTop to main layout** (in `src/pages/_app.tsx` or `src/pages/index.tsx`):
```typescript
import { BackToTop } from '../components/ui/BackToTop';

// In the component return:
{<BackToTop />}
```

## ✅ Acceptance Criteria

- [ ] Section anchors are properly added to all major sections
- [ ] Navigation links use smooth scrolling behavior
- [ ] URL updates correctly when navigating between sections
- [ ] Back to top button appears after scrolling down
- [ ] All anchor links are accessible (proper aria labels)
- [ ] Smooth scrolling works on mobile and desktop
- [ ] No TypeScript errors
- [ ] All existing functionality is preserved

## 🧪 Testing Instructions

### Navigation Testing:
1. Navigate to localhost:3001
2. Click the "Ecosystem Statistics" link in hero section
3. Verify smooth scrolling to analytics dashboard
4. Check URL updates to include #analytics-dashboard
5. Test browser back/forward buttons
6. Test page refresh with anchor in URL

### Accessibility Testing:
1. Use keyboard to navigate through anchor links
2. Test with screen reader to ensure proper announcements
3. Verify focus management during smooth scrolling
4. Test color contrast of navigation links

### Responsive Testing:
1. Test smooth scrolling on mobile devices
2. Verify back-to-top button positioning on different screen sizes
3. Test touch interactions on mobile

## 🔍 Code Review Checklist

- [ ] All section anchors use semantic HTML elements
- [ ] Smooth scrolling implementation is performant
- [ ] Event handlers are properly cleaned up
- [ ] Accessibility attributes are complete
- [ ] Mobile experience is optimized
- [ ] Code follows project formatting standards

## 🚧 Implementation Notes

### Browser Compatibility:
- Smooth scrolling is supported in all modern browsers
- Consider adding polyfill for older browsers if needed
- Test behavior in Safari, Chrome, Firefox, and Edge

### Performance Considerations:
- Use `requestAnimationFrame` for complex scroll animations
- Debounce scroll event listeners to prevent performance issues
- Consider using Intersection Observer for scroll-based visibility

### SEO Benefits:
- Proper section anchors improve SEO
- Semantic HTML structure helps search engines understand content hierarchy
- Clean URLs with anchors are indexable

## 🚨 Common Pitfalls to Avoid

1. **Don't forget to update all section anchors consistently**
2. **Don't break existing URL patterns**
3. **Don't overlook mobile touch interactions**
4. **Don't forget accessibility attributes**
5. **Don't ignore browser compatibility**

## 📚 Additional Resources

- [MDN Web Docs: Smooth Scrolling](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)
- [React Navigation Best Practices](https://reactrouter.com/web/guides/quick-start)
- [Accessibility Guidelines for Navigation](https://www.w3.org/WAI/WCAG21/quickref/#navigation)
- [PRD-004](../prd-004-metrics-display-restructure.md) - Full project context

---

**Questions?**: Ask in #development Slack channel or create a GitHub issue.