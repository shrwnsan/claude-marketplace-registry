# GitHub Actions Workflow Review & Optimization

## Issues Found & Recommendations

### 🔴 HIGH PRIORITY

#### 1. **Redundant npm ci in CI Pipeline**
**Files:** `ci.yml`, `security.yml`, `deploy.yml`

**Issue:** Each job runs `npm ci` independently, re-installing dependencies multiple times per workflow.

**Impact:**
- ~30-60 seconds per job × 5 jobs = ~5 minutes total per CI run
- ⚠️ **Note:** Original estimate of "3-5 min per job / 20+ min total" was overstated. All workflows already use `actions/setup-node` with `cache: 'npm'`, which caches the npm download cache. The actual overhead is the `node_modules/` extraction step, not full downloads.

**Recommendation:**
```yaml
# Option A: Cache the node_modules directory explicitly (bigger win but has correctness tradeoffs)
- uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Option B: Use npm ci caching (already set but could be more efficient)
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: package-lock.json  # Be explicit
```

**Priority:** MEDIUM - Could save ~5 minutes per CI run (downgraded from HIGH)

---

#### 2. **Security Audit Logic Bug** ✅ FIXED
**File:** `security.yml` (lines 42-45)

**Issue:**
```yaml
# BEFORE (broken):
run: |
  npm audit --audit-level=moderate --json > audit-results.json || echo "vulnerabilities_found=true" >> $GITHUB_OUTPUT
  echo "vulnerabilities_found=false" >> $GITHUB_OUTPUT  # ❌ This always overwrites to false!
```

The second echo always overwrites the first, so `vulnerabilities_found` is **always false**. This silently broke the issue-creation gate (line 59) and PR security comments (line 135). This is an **original defect** (not a regression) — the logic was never correct.

**Fix applied:**
```yaml
run: |
  if npm audit --audit-level=moderate --json > audit-results.json; then
    echo "vulnerabilities_found=false" >> $GITHUB_OUTPUT
  else
    echo "vulnerabilities_found=true" >> $GITHUB_OUTPUT
  fi
```

**Priority:** HIGH - Security alerts won't trigger properly
**Status:** ✅ Fixed (2026-02-21)

---

#### 3. **Deploy Workflow Dependency Issue** ✅ FIXED
**File:** `deploy.yml` (line 67)

**Issue:** Build job has `needs: [scan]`, but scan is optional (`if: github.event.inputs.scan_before_deploy == 'true'`).

⚠️ **Severity was underestimated.** On `push` events (the primary deploy trigger), `github.event.inputs` is null, so `scan` is always skipped → `build` is silently skipped → `deploy` is silently skipped → **the deploy workflow never deploys on push to main**. This is not just "confusing failures" — it's a fundamentally broken deploy pipeline for its primary trigger.

**Fix applied:**
```yaml
build:
  needs: [scan]
  if: ${{ always() && (needs.scan.result == 'success' || needs.scan.result == 'skipped') }}
```

This ensures `build` runs when `scan` succeeds or is skipped, but still blocks if `scan` explicitly fails.

**Priority:** HIGH (CRITICAL) - Deploy pipeline broken on push to main
**Status:** ✅ Fixed (2026-02-21)

---

### 🟡 MEDIUM PRIORITY

#### 4. **Timeout Configurations Vary Inconsistently**
**Files:** `amp-review-tier1.yml` (15m), `claude-auto-pr-review.yml` (30m), `droid-review.yml` (30m)

**Issue:** Tier 1 is marked as "Fast Triage" but only 15m timeout. If it uses external APIs, that's too tight.

**Recommendation:**
- Tier 1 (docs): 10-15 minutes ✓ (currently OK)
- Tier 2 (standard): 30 minutes ✓ (currently OK)
- Tier 3 (deep): Should be **45 minutes** not 30 (Droid is thorough)

**Priority:** MEDIUM - May cause timeouts during complex reviews

---

#### 5. **Artifact Retention Too Short**
**Files:** `ci.yml`, `scan.yml`, `security.yml`

**Current:**
- Build artifacts: 1 day
- Scan results: 1 day
- Security audit: 7 days

**Issue:** 1 day is very short for debugging failed deployments or scans.

**Recommendation:**
```yaml
# Keep longer
retention-days: 7   # For CI/build artifacts
retention-days: 14  # For scan results (might need historical comparison)
retention-days: 30  # For security audits (compliance)
```

**Priority:** MEDIUM - May hamper debugging

---

#### 6. **No Workflow Run Limits (Concurrency)**
**Files:** `scan.yml` has concurrency, but `ci.yml` doesn't

**Issue:** Multiple PRs + pushes can create race conditions on shared resources.

**Recommendation:**
```yaml
# Add to ci.yml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true  # Cancel old CI runs when new one starts
```

**Priority:** MEDIUM - Can waste CI minutes

---

#### 7. **API Rate Limiting Risk**
**Files:** `scan.yml` (GitHub API calls), `route-pr-to-model.yml`

**Issue:**
- Scan runs daily + can be triggered manually = potential rate limit issues
- No exponential backoff configured for retries

**Recommendation:**
```yaml
- name: Run marketplace scan
  run: npm run scan:marketplaces
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    MAX_RETRIES: 3
    RETRY_DELAY: 5  # seconds
    BACKOFF_MULTIPLIER: 2
```

⚠️ **Review note:** The env vars above (`MAX_RETRIES`, `RETRY_DELAY`, `BACKOFF_MULTIPLIER`) are no-ops unless the scan scripts are updated to read and act on them. This recommendation requires **both** workflow and application code changes to be effective.

**Priority:** MEDIUM - Could cause scan failures

---

### 🟢 LOW PRIORITY

#### 8. **Verbose Logging in Prod Workflows**
**Files:** All workflows using `continue-on-error: true`

**Issue:** 
- `security.yml` security audit continues on error without logging why
- `continue-on-error: true` masks real failures

**Recommendation:**
```yaml
# Instead of:
continue-on-error: true

# Do:
continue-on-error: ${{ github.event_name == 'schedule' }}  # Only skip on schedule, not PR
```

**Priority:** LOW - Harder to debug, but workflows still function

---

#### 9. **No Secret Validation**
**File:** Multiple files use secrets without pre-validation

**Issue:** If secret is missing, workflow fails at step instead of at start.

**Recommendation:**
```yaml
jobs:
  validate-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Validate secrets
        run: |
          [[ -n "${{ secrets.GITHUB_TOKEN }}" ]] || (echo "GITHUB_TOKEN missing" && exit 1)
          [[ -n "${{ secrets.DATA_UPDATES_PAT }}" ]] || (echo "DATA_UPDATES_PAT missing" && exit 1)
```

⚠️ **Review note:** The recommended approach is an **anti-pattern** — `${{ secrets.X }}` expands the secret value into the shell script text. Prefer job-level `if: secrets.DATA_UPDATES_PAT != ''` conditions instead. Also, `GITHUB_TOKEN` is auto-provided by GitHub Actions and never needs validation.

**Priority:** LOW - Nice to have

---

#### 10. **No Cost Optimization Markers**
**File:** `claude-auto-pr-review.yml` uses `api.z.ai` proxy (good!)

**Issue:** `droid-review.yml` and review workflows should document cost optimization.

**Recommendation:**
Add comments to expensive operations:
```yaml
# Cost: ~$1.50 per run (Factory Droid with GPT-5.2)
- name: Run Droid Auto Review
  uses: Factory-AI/droid-action@v1
```

**Priority:** LOW - Documentation only

---

## Summary Table

| Issue | File | Severity | Impact | Fix Time | Status |
|-------|------|----------|--------|----------|--------|
| npm ci duplication | ci.yml, security.yml, deploy.yml | MEDIUM | ~5 min/run | 15 min | 📋 Open |
| Security audit logic bug | security.yml | HIGH | Broken alerts | 5 min | ✅ Fixed |
| Deploy dependency | deploy.yml | CRITICAL | Deploy broken on push | 10 min | ✅ Fixed |
| Timeout inconsistency | *-review.yml | MEDIUM | Timeout errors | 10 min | 📋 Open |
| Artifact retention | multiple | MEDIUM | Poor debugging | 5 min | 📋 Open |
| No CI concurrency | ci.yml | MEDIUM | Resource waste | 5 min | 📋 Open |
| Rate limiting | scan.yml | MEDIUM | Scan failures | 20 min | 📋 Open (needs code changes too) |
| Logging/continue-on-error | security.yml | LOW | Unclear failures | 10 min | 📋 Open |
| No secret validation | multiple | LOW | Late failure detection | 15 min | ⚠️ Open (anti-pattern in recommendation) |
| Cost markers | droid-review.yml | LOW | Documentation | 5 min | 📋 Open |

## Recommended Implementation Order

1. ~~**Fix security audit logic** (5 min) - Immediate impact~~ ✅ Done
2. ~~**Fix deploy job dependency** (10 min) - Prevents failures~~ ✅ Done
3. **Add npm caching optimization** (15 min) - Moderate perf gain (~5 min/run)
4. **Fix CI concurrency** (5 min) - Prevents waste
5. **Adjust artifact retention** (5 min) - Better debugging
6. **Improve timeout configs** (10 min) - Prevent timeouts
7. **Add rate limit handling** (20 min) - Requires workflow + application code changes
8. **Others** (10-20 min) - Polish (note: #9 secret validation needs revised approach)

**Total estimated time: ~75 minutes for remaining fixes**

**Progress:**
- ✅ Security alerts now trigger correctly (was silently broken since creation)
- ✅ Deploy pipeline now works on push to main (was completely non-functional)

**Expected outcome for remaining fixes:**
- ✅ ~5 min faster CI runs
- ✅ Better error handling & debugging
- ✅ Reduced CI minute waste via concurrency control
