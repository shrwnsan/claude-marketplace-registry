# GitHub Actions Workflows

This directory contains the CI/CD pipeline for the Claude Marketplace Aggregator. The workflow set was trimmed to cut Actions minutes and API usage: scheduled and PR-triggered AI review was removed (AI assistance is now on-demand only), and security scanning is deduplicated so each check runs once per event.

## 🚀 Workflow Overview

### Core Pipeline

| Workflow | Triggers | What it does | Cost notes |
|----------|----------|--------------|------------|
| **ci.yml** — [![CI](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/ci.yml) | Push to main, PRs | Lint/type/format checks, tests, build, production `npm audit` gate, scan-script dry-run | PR-triggered; on data-only changes (daily bot PRs) it skips lint/test/security/scan-test and just runs the build check. Concurrency cancels superseded runs. |
| **scan.yml** — [![Scan](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/scan.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/scan.yml) | Daily 00:00 UTC, manual | Multi-strategy GitHub discovery → plugin validation → data generation → opens the automated data-update PR | Runs daily; the heaviest scheduled workflow (GitHub API usage). |
| **auto-merge-data-updates.yml** — [![Auto-merge](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/auto-merge-data-updates.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/auto-merge-data-updates.yml) | PRs to main | Verifies a data-update PR touches only data paths, then auto-approves and auto-merges with `DATA_UPDATES_PAT` (so the merge triggers deploy) | Runs per bot PR; short verification job only. |
| **deploy.yml** — [![Deploy](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/deploy.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/deploy.yml) | Push to main, manual | Builds the static export and deploys to GitHub Pages | Runs on every main push (including bot data merges). Redundant `npm test` step removed — CI gates merges. |

### Security & Maintenance

| Workflow | Triggers | What it does | Cost notes |
|----------|----------|--------------|------------|
| **security.yml** — [![Security](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/security.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/security.yml) | Push to main, PRs, weekly (Mon 02:00 UTC), manual | CodeQL (security-extended), secrets scan (single scanner), weekly `npm audit` with automatic issue creation | Each check runs once per event: CodeQL lives only here (removed from CI), and the per-PR audit-comment spam was dropped — the audit *gate* lives in CI. |
| **performance.yml** — [![Performance](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/performance.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/performance.yml) | Monthly (1st, 03:00 UTC), manual | Build-performance analysis | Monthly only; bundle-analyzer, Lighthouse, and the template-issue job were removed. |
| **issue-triage.yml** — [![Triage](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/issue-triage.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/issue-triage.yml) | Issue opened/reopened, issue comments | Auto-labels issues and posts a welcome comment | Event-driven, near-zero volume. |
| **.github/dependabot.yml** (config, not a workflow) | Weekly schedule | Native Dependabot updates for npm + GitHub Actions dependencies | Replaces the deleted `dependency-update.yml` workflow; runs on GitHub's infrastructure, no Actions minutes. |

### AI Assistants (on-demand only)

These workflows never run automatically on PRs or schedules — they fire only when a trusted author (OWNER/MEMBER/COLLABORATOR) invokes them.

| Workflow | Trigger | What it does | Cost notes |
|----------|---------|--------------|------------|
| **claude-code.yml** | Comment `@claude` on an open PR/issue, or manual dispatch | Single job: runs the review, then triages its own findings | On-demand only; the automatic PR-review runs were removed. |
| **droid.yml** | `@droid` mention in a comment, or issue events | Factory Droid assistance on demand | On-demand only, trusted authors. |
| **follow-up-implementation.yml** | Merge of a maintainer PR to main, or manual dispatch | Implements issues labeled `follow-up`/`claude-generated` linked to that PR | Runs only after a maintainer merge. |

## 💰 Cost & Usage Notes

Rationale for the trim (Actions minutes + API rate limits):

- **AI PR-review fleet removed**: `route-pr-to-model.yml`, `amp-review-tier1.yml`, `claude-auto-pr-review.yml`, and `droid-review.yml` formed an automated 3-tier AI review pipeline that produced no visible output while driving run volume and GitHub API rate limits. AI assistance is now on-demand only (`@claude` / `@droid`).
- **CodeQL once per event**: CodeQL analysis runs only in `security.yml`, not duplicated in CI.
- **Audits once per event**: the `npm audit` *gate* runs in CI; `security.yml` handles the weekly scheduled audit + issue creation. Per-PR audit comment jobs were removed.
- **Light path for data-only PRs**: CI skips lint/test/security/scan-test when a PR touches only data files — the daily bot PRs get a build check and move on.
- **Dependabot over a workflow**: the broken `dependency-update.yml` (invalid permissions) was replaced by native `.github/dependabot.yml`, which costs no Actions minutes.
- **Performance trim**: `performance.yml` keeps only the monthly build-performance analysis (bundle-analyzer, Lighthouse, and the template-issue job were cut).

## 🔧 Configuration

Required secrets beyond the built-in `GITHUB_TOKEN`:

| Secret | Workflow | Purpose |
|--------|----------|---------|
| `DATA_UPDATES_PAT` | auto-merge-data-updates.yml | PAT-attributed merge so the data-update merge triggers deploy |
| `ANTHROPIC_API_KEY` | claude-code.yml | Claude Code assistance |

All workflows run with minimal, explicit permissions. Workflow-file changes are gated: AI-assist workflows only accept trusted authors, and merges use `DATA_UPDATES_PAT` (merges made with `GITHUB_TOKEN` do not trigger deploy).

## 📝 Maintenance Notes

- **Adding a workflow**: create the `.yml` here, set minimal permissions, and update this README (and `badges.md` if it should show a badge).
- **Monitoring**: check the Actions tab for run status; scheduled failures surface as workflow failure notifications to maintainers.

---

🤖 **Claude Marketplace Aggregator** | **Last updated:** 2026-09-22
