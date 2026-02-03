# Next.js Security Upgrade Plan

**Date:** January 30, 2026  
**Completed:** February 3, 2026  
**Issue:** Next.js v14.2.5 Security Vulnerability  
**Target:** Upgrade to Next.js v16.1.6 (Latest)
**Actual:** Upgraded to Next.js v16.1.6 and React v19.2.4

---

## 🚨 Security Vulnerability

### Affected Package
- **next@14.2.5** - Current version

### Vulnerabilities
1. **GHSA-9g9p-9gw9-jx7f** (HIGH)
   - Next.js self-hosted applications vulnerable to DoS via Image Optimizer remotePatterns configuration
   
2. **GHSA-h25m-26qc-wcjf** (HIGH)
   - Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components

### Recommended Fix
- ✅ **COMPLETED**: Upgraded to **next@16.1.6** (latest)
- Upgrade to **next@15.x** (less breaking changes) - SKIPPED

---

## 📋 Upgrade Plan

### Phase 1: Preparation ✅

- [x] Document security issue
- [x] Add temporary CI waiver
- [x] Merge current optimization PR
- [ ] Create dedicated upgrade branch

### Phase 2: Upgrade Implementation

**Branch:** `feat/upgrade-nextjs-v15`

**Steps:**

1. **Create feature branch**
   ```bash
   git checkout -b feat/upgrade-nextjs-v15
   ```

2. **Upgrade Next.js**
   ```bash
   npm install next@15@latest
   ```

3. **Update peer dependencies if needed**
   ```bash
   # Check if React upgrade is needed
   npm install react@latest react-dom@latest
   ```

4. **Test build process**
   ```bash
   npm run build
   ```

5. **Run tests**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

6. **Check for breaking changes**
   - Review Next.js 15 release notes: https://nextjs.org/blog
   - Test Image Optimization
   - Test Server Components
   - Test Static Export

7. **Update documentation**
   - Update package.json version
   - Document any API changes
   - Update CHANGELOG.md

### Phase 3: Testing & Validation

**Test Checklist:**

- [ ] Development server starts: `npm run dev`
- [ ] Production build succeeds: `npm run build`
- [ ] Static export works: Verify `out/` directory
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] Image Optimization works (if used)
- [ ] GitHub Actions CI passes
- [ ] Manual smoke test of deployed site

### Phase 4: Deployment

1. **Create PR**
   ```bash
   git push origin feat/upgrade-nextjs-v15
   ```

2. **PR Description:**
   ```markdown
   ## 🔒 Security Upgrade: Next.js v14 → v15

   ### Changes
   - Upgrade Next.js from v14.2.5 to v15.x (latest)
   - Address GHSA-9g9p-9gw9-jx7f (DoS via Image Optimizer)
   - Address GHSA-h25m-26qc-wcjf (HTTP request deserialization)

   ### Breaking Changes
   - List any breaking changes encountered
   - Document any required code changes

   ### Testing
   - [x] All tests pass
   - [x] Build succeeds
   - [x] Manual testing completed

   ### Risk Assessment
   - **Risk Level:** Medium
   - **Breaking Changes:** Yes (documented above)
   - **Rollback Plan:** Revert commit if issues arise
   ```

3. **Merge after approval**
   - Ensure CI passes
   - At least one approval required
   - Monitor deployment for issues

### Phase 5: Post-Deployment

- [ ] Monitor GitHub Actions for failures
- [ ] Check website functionality
- [ ] Verify Image Optimization (if used)
- [ ] Monitor error logs
- [ ] Gather user feedback

---

## ⚠️ Known Breaking Changes in Next.js 15

### 1. Image Optimization
**Change:** Updated Image Optimization API  
**Impact:** Check if using `next/image`  
**Action:** Test all image usages

### 2. Server Components
**Change:** Enhanced Server Components stability  
**Impact:** May affect React Server Components  
**Action:** Test all Server Components

### 3. Static Export
**Change:** Improved static export handling  
**Impact:** Static generation process  
**Action:** Verify `out/` directory output

### 4. Turbopack (Optional)
**Change:** Turbopack is more stable  
**Impact:** Can enable in `next.config.js`  
**Action:** Optional, test if desired

---

## 🔄 Rollback Plan

If critical issues arise after deployment:

```bash
# 1. Revert the commit
git revert <commit-hash>

# 2. Push the revert
git push origin main

# 3. Verify site is working
# 4. Plan fix for issues
```

---

## 📚 References

- [Next.js 15 Release Notes](https://nextjs.org/blog)
- [GHSA-9g9p-9gw9-jx7f](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f)
- [GHSA-h25m-26qc-wcjf](https://github.com/advisories/GHSA-h25m-26qc-wcjf)
- [Next.js Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)

---

## ✅ Success Criteria

- [x] Temporary waiver in place
- [x] Optimization PR merged
- [x] Next.js upgraded to v16.1.6
- [x] All CI checks pass (type-check, build)
- [x] Manual testing completed
- [x] PR created and approved
- [ ] Deployment successful (pending merge)
- [ ] No critical issues reported (post-deployment)

---

## 📝 Notes

- **Original Plan:** Upgrade to Next.js v15.x for less breaking changes
- **Actual Execution:** Upgraded directly to Next.js v16.1.6 (latest)
- **Reason:** Using `npm install @latest` pulled the latest version, which worked successfully
- **Branch:** feat/upgrade-nextjs-v16 (renamed from feat/upgrade-nextjs-v15)
- **Timeline:** February 3, 2026
- **Priority:** High (security issue) - RESOLVED
- **Complexity:** Medium (major version upgrade) - COMPLETED

### Key Changes from Plan
- Skipped v15 entirely, went straight to v16.1.6
- Migrated to Turbopack (Next.js 16 default) instead of Webpack
- Migrated ESLint to v9 flat config instead of legacy format
- Fixed React 19 compatibility issues (useRef requires initial value)

---

**Plan Created:** January 30, 2026  
**Completed:** February 3, 2026  
**Status:** ✅ COMPLETED - PR created and awaiting merge
