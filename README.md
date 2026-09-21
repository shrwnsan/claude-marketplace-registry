# Claude Marketplace Registry

<div align="center">

![Claude Marketplace Registry](https://img.shields.io/badge/Claude-Marketplace_Registry-d97757?style=for-the-badge&logo=anthropic)

[![Version](https://img.shields.io/badge/version-v0.5.0-blue)](https://github.com/shrwnsan/claude-marketplace-registry/releases)
[![Changelog](https://img.shields.io/badge/changelog-keep--a--changelog-05A2E4?logo=gitbook)](./CHANGELOG.md)
[![CI](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/ci.yml)
[![Deploy](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/deploy.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/deploy.yml)
[![Scan](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/scan.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/scan.yml)
[![Auto-merge](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/auto-merge-data-updates.yml/badge.svg)](https://github.com/shrwnsan/claude-marketplace-registry/actions/workflows/auto-merge-data-updates.yml)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x+-green?logo=node.js&logoColor=white)](https://nodejs.org/)

An automated, open-source aggregator that discovers and curates Claude Code marketplaces and plugins from across GitHub. Zero infrastructure — runs entirely on GitHub Actions and Pages as a self-updating artifact.

[🌐 Live site](https://shrwnsan.github.io/claude-marketplace-registry) · [📡 JSON API](./docs/ref/DEVELOPER_API.md) · [📖 Documentation](./docs) · [🤝 Contributing](./CONTRIBUTING.md) · [🐛 Report Issues](https://github.com/shrwnsan/claude-marketplace-registry/issues)

</div>

---

## How It Works

Every day at midnight UTC, GitHub Actions scans the GitHub API for Claude Code marketplace repositories, validates their `.claude-plugin/marketplace.json` manifests, generates data files, and publishes the results — fully automated, no servers required.

```
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub Actions (Daily, 00:00 UTC)             │
│                                                                  │
│  Scan GitHub API  →  Validate Plugins  →  Generate Data          │
│                                                                  │
│  Create PR  →  Verify data-only change  →  Merge to main         │
│                                                                  │
│  Build Static Site  →  Deploy to GitHub Pages                    │
└──────────────────────────────────────────────────────────────────┘
```

Data updates happen automatically — the pipeline creates PRs, verifies they only modify data files, and merges them without manual work. Code changes always require human review.

## Features

- 🔍 **Automated discovery** — multi-strategy GitHub search finds Claude Code marketplaces daily; a persistent registry keeps the catalog monotonic and self-healing
- ⌨️ **Typeahead search** — WAI-ARIA combobox with grouped marketplace/plugin results, keyboard navigation, and `Cmd/Ctrl+K` from anywhere
- 🗂️ **Curated categories** — functional filters (MCP servers, skill collections, AI agents, …) derived from real topic data, plus raw topic deep links
- 📊 **Honest metrics** — every number traces back to the daily scan; growth trends accumulate one snapshot per day, and no synthetic downloads or invented scores exist anywhere
- 🌗 **Dark-first design** — terminal-inspired identity with a warm charcoal palette, ember accent, and full light mode
- 🔗 **Shareable views** — search, category, and sort selections persist in the URL
- 🔄 **Self-updating** — scan → validate → PR → auto-merge → deploy, fully automated
- 🔒 **Security gates** — auto-merge only fires for data-only changes; AI-assist workflows are author-gated
- 🌐 **Static site** — Next.js static generation on GitHub Pages, fast and free

## The JSON API

The entire catalog is available as free public JSON — no key, CORS enabled, served from the same GitHub Pages CDN as the site:

```bash
curl -s https://shrwnsan.github.io/claude-marketplace-registry/data/stats.json | jq '.data.overview'
```

Endpoints: `data/stats.json`, `data/marketplaces.json`, `data/plugins.json`, `data/history.json`. See the [API reference](./docs/ref/DEVELOPER_API.md) or the in-site [/docs/api](https://shrwnsan.github.io/claude-marketplace-registry/docs/api) page.

## Getting your marketplace listed

Listing is automatic: publish a spec-compliant `.claude-plugin/marketplace.json` at your repository root and the next daily scan will discover it. Adding the `claude-plugins` or `claude-skills` topic improves discoverability.

## Quick Start

```bash
git clone https://github.com/shrwnsan/claude-marketplace-registry.git
cd claude-marketplace-registry
npm install
cp .env.example .env.local   # Add your GITHUB_TOKEN
npm run dev                  # http://localhost:3000
```

**Prerequisites:** Node.js 24+, npm 8+, and a [GitHub Personal Access Token](https://github.com/settings/tokens).

See the **[Setup Guide](./SETUP.md)** for detailed configuration including environment variables, GitHub Pages deployment, and static asset notes.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |
| `npm run scan:full` | Run complete scanning pipeline |
| `npm run scan:marketplaces` | Scan GitHub for marketplaces |
| `npm run validate:plugins` | Validate discovered plugins |
| `npm run generate:data` | Generate website data files |

## Architecture

```
GitHub API  →  Scan  →  Validate  →  Generate  →  Build  →  Deploy
   ↓            ↓          ↓           ↓           ↓          ↓
Repositories  data/     data/      public/     .next/    GitHub
              marketplaces/ plugins/   data/      out/      Pages
```

For details, see [Architecture](./docs/ref/ARCHITECTURE.md) and [Workflow Architecture](./docs/ref/WORKFLOW_ARCHITECTURE.md).

## Documentation

| | Guide | Description |
|---|---|---|
| 📖 | **[Setup Guide](./SETUP.md)** | Installation, configuration, deployment |
| 👤 | **[User Guide](./docs/guides/USER_GUIDE.md)** | Using the marketplace browser |
| 📡 | **[JSON API](./docs/ref/DEVELOPER_API.md)** | Public data endpoints and response shapes |
| 🏗️ | **[Architecture](./docs/ref/ARCHITECTURE.md)** | System design and data models |
| ⚙️ | **[Workflow Architecture](./docs/ref/WORKFLOW_ARCHITECTURE.md)** | CI/CD pipeline and automation |
| 🔒 | **[Security](./docs/ref/SECURITY.md)** | Security measures and threat model |
| 🔧 | **[Maintenance Guide](./docs/guides/MAINTENANCE_GUIDE.md)** | Operations and troubleshooting |
| 🤝 | **[Contributing](./CONTRIBUTING.md)** | Development workflow and guidelines |
| 📋 | **[Changelog](./CHANGELOG.md)** | Version history and release notes |

## Contributing

We welcome contributions! See the [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes and add tests
4. Submit a pull request

> **Note for new static assets:** `.gitignore` excludes `*.png` (browser-test
> artifacts). Brand assets that must ship — `public/og-image.png`,
> `public/android-chrome-*.png` — are force-listed with `!` negations in
> `.gitignore`. If you add a new PNG under `public/`, add a negation or it
> will silently 404 in production while working locally.

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgments

- [Anthropic](https://anthropic.com) for creating Claude
- [GitHub](https://github.com) for hosting, Actions, and Pages
- [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com) for the frontend

---

<div align="center">

**Made with ❤️ for the Claude Community**

[⭐ Star this repository](https://github.com/shrwnsan/claude-marketplace-registry) · [🐛 Report issues](https://github.com/shrwnsan/claude-marketplace-registry/issues) · [💬 Suggest features](https://github.com/shrwnsan/claude-marketplace-registry/discussions)

</div>
