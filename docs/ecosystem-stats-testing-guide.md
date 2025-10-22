# EcosystemStats Testing Guide

## 🚀 Quick Start

### 1. Run the Smoke Test Script
```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the smoke test
./scripts/smoke-test-ecosystem-stats.sh
```

### 2. Manual Testing URLs
Open your browser and test these URLs:

- **Homepage**: http://localhost:3001
- **API Endpoints**:
  - http://localhost:3001/api/ecosystem-stats
  - http://localhost:3001/api/ecosystem-stats?metric=overview
  - http://localhost:3001/api/ecosystem-stats?metric=growth&timeRange=30d
  - http://localhost:3001/api/ecosystem-stats?metric=categories

## 📋 Testing Checklist

### ✅ Basic Functionality
- [ ] Homepage loads without errors
- [ ] Ecosystem Statistics section appears
- [ ] All four component sections render
- [ ] No console errors in browser

### ✅ Overview Metrics Component
- [ ] Plugin count displays correctly
- [ ] Marketplace count displays correctly
- [ ] Developer count displays correctly
- [ ] Download count displays correctly
- [ ] Growth indicators show (arrows up/down)
- [ ] Hover effects work on cards
- [ ] Numbers format correctly (K, M, B)

### ✅ Growth Trends Component
- [ ] Line charts render properly
- [ ] Time range selector works (7d, 30d, 90d, 1y)
- [ ] Interactive tooltips show data points
- [ ] Multiple data lines display (plugins, marketplaces, etc.)
- [ ] Chart legends are clickable
- [ ] Smooth animations work

### ✅ Category Analytics Component
- [ ] Pie chart renders correctly
- [ ] Categories are colored differently
- [ ] Hover tooltips show category details
- [ ] Click interactions work
- [ ] Growth indicators for categories
- [ ] Emerging categories highlighted

### ✅ Quality Indicators Component
- [ ] Progress bars show verification percentages
- [ ] Trust badges display correctly
- [ ] Quality metrics show accurate numbers
- [ ] Security indicators present
- [ ] Maintenance status indicators

### ✅ Responsive Design
- [ ] Mobile (< 768px): Single column layout
- [ ] Tablet (768px - 1024px): Two column layout
- [ ] Desktop (> 1024px): Full multi-column layout
- [ ] Text remains readable on all sizes
- [ ] No horizontal scrolling on mobile

### ✅ Interactive Features
- [ ] Refresh button works and shows loading state
- [ ] Auto-refresh functionality (if enabled)
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators visible
- [ ] Links are clickable

### ✅ Dark/Light Mode
- [ ] Toggle between dark and light modes
- [ ] All components adapt to theme change
- [ ] Text contrast remains readable
- [ ] Charts and colors adjust properly

### ✅ Performance
- [ ] Page loads within 3 seconds
- [ ] API responses under 1 second (cached)
- [ ] Charts render smoothly without lag
- [ ] No memory leaks during extended use
- [ ] Smooth 60fps animations

### ✅ Error Handling
- [ ] Graceful handling of API failures
- [ ] Error messages display when data unavailable
- [ ] Retry functionality works
- [ ] Loading states show properly

## 🧪 Advanced Testing

### Performance Testing
```bash
# Install performance testing tools
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3001 --output html --output-path ./test-results/lighthouse.html
```

### API Load Testing
```bash
# Install siege for load testing
brew install siege  # macOS
# or apt-get install siege  # Ubuntu

# Load test API endpoints
siege -c 10 -t 30s http://localhost:3001/api/ecosystem-stats
```

### Component Integration Testing
```bash
# Run the component test suite
npm run test

# Run with coverage
npm run test:coverage
```

## 🔍 Browser DevTools Testing

### 1. Console Testing
```javascript
// Test API calls in browser console
fetch('/api/ecosystem-stats')
  .then(res => res.json())
  .then(data => console.log('Ecosystem data:', data));

// Test specific endpoints
fetch('/api/ecosystem-stats?metric=overview')
  .then(res => res.json())
  .then(data => console.log('Overview:', data));
```

### 2. Network Testing
- Open DevTools → Network tab
- Reload the page
- Check API responses:
  - Status codes should be 200
  - Response times should be under 2s
  - Data should be properly formatted JSON

### 3. Performance Testing
- DevTools → Performance tab
- Record performance while:
  - Loading the page
  - Switching time ranges
  - Interacting with charts
  - Toggling dark/light mode

### 4. Accessibility Testing
- DevTools → Lighthouse tab
- Run Accessibility audit
- Check for:
  - ARIA labels
  - Keyboard navigation
  - Color contrast
  - Screen reader compatibility

## 📱 Mobile Testing

### Browser Testing
1. Open Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test different devices:
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Android (360x640)

### Real Device Testing
1. Connect your phone to same WiFi network
2. Find your computer's IP: `ifconfig` or `ipconfig`
3. Access: `http://YOUR_IP:3001`

## 🐛 Common Issues & Solutions

### Issue: Components don't load
**Solution**: Check if API endpoints are responding
```bash
curl http://localhost:3001/api/ecosystem-stats
```

### Issue: Charts don't render
**Solution**: Check browser console for Recharts errors
```javascript
// Check if Recharts is loaded
console.log(window.Recharts);
```

### Issue: Slow performance
**Solution**: Check API response times and implement caching
```bash
# Time API calls
time curl http://localhost:3001/api/ecosystem-stats
```

### Issue: Mobile layout broken
**Solution**: Check Tailwind responsive classes
- Ensure proper `sm:`, `md:`, `lg:` prefixes
- Test with actual device dimensions

## 📊 Test Results Template

Create a test report with this format:

```
# EcosystemStats Test Report

## Environment
- Browser: Chrome 119.0.6045.123
- Screen Resolution: 1920x1080
- Date: 2024-XX-XX
- Tester: [Your Name]

## Test Results
- ✅ Homepage Load: PASS (1.2s)
- ✅ Overview Metrics: PASS
- ✅ Growth Trends: PASS
- ✅ Category Analytics: PASS
- ✅ Quality Indicators: PASS
- ⚠️ Mobile Layout: Minor spacing issues
- ✅ Performance: PASS (Lighthouse score 95)

## Issues Found
1. Mobile: Category chart overlaps on small screens
   - Severity: Low
   - Solution: Adjust responsive breakpoints

## Recommendations
- Add more loading states
- Implement error retry logic
- Optimize chart rendering performance
```

## 🚀 Production Readiness Checklist

- [ ] All smoke tests pass
- [ ] Performance budgets met
- [ ] Mobile responsive design verified
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Error handling tested
- [ ] Cross-browser compatibility checked
- [ ] Dark mode functional
- [ ] Load testing completed
- [ ] Security review passed
- [ ] Documentation complete