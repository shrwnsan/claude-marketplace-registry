# Claude Marketplace Aggregator

<div align="center">

![Claude Marketplace Aggregator](https://img.shields.io/badge/Claude-Marketplace_Aggregator-blue?style=for-the-badge&logo=anthropic)

[![Version](https://img.shields.io/badge/version-v0.4.0--beta.1-blue)](https://github.com/shrwnsan/claude-marketplace-registry/releases/tag/v0.4.0-beta.1)
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

[🌐 Live Demo](https://shrwnsan.github.io/claude-marketplace-registry) · [📖 Documentation](./docs) · [🤝 Contributing](./CONTRIBUTING.md) · [🐛 Report Issues](https://github.com/shrwnsan/claude-marketplace-registry/issues)

</div>

---

## How It Works

Every day at midnight UTC, GitHub Actions scans the GitHub API for Claude Code plugin repositories, validates their manifests, generates data files, and publishes the results — fully automated, no servers required.

```
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub Actions (Daily)                         │
│                                                                  │
│  Scan GitHub API  →  Validate Plugins  →  Generate Data          │
│                                                                  │
│  Create PR  →  Auto-approve (data-only check)  →  Merge to main  │
│                                                                  │
│  Build Static Site  →  Deploy to GitHub Pages                    │
└──────────────────────────────────────────────────────────────────┘
```

Data updates happen automatically — the pipeline creates PRs, verifies they only modify data files, and merges them without manual work. Code changes always require human review.

## Features

- 🔍 **Automated Discovery** — Multi-strategy GitHub search finds Claude Code marketplaces and plugins daily
- 📊 **Quality Scoring** — Repositories scored by stars, activity, manifest completeness, and more
- 🔄 **Self-updating** — Scan → validate → PR → auto-merge → deploy, fully automated
- 🔒 **Security Gates** — Auto-merge only fires for data-only changes on the `automated/*` branch
- 🌐 **Static Site** — Next.js static generation on GitHub Pages, fast and free
- 🎯 **Search & Filter** — Browse by language, category, tags, and quality metrics
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Quick Start

```bash
git clone https://github.com/shrwnsan/claude-marketplace-registry.git
cd claude-marketplace-registry
npm install
cp .env.example .env.local   # Add your GITHUB_TOKEN
npm run dev                  # http://localhost:3000
```

**Prerequisites:** Node.js 20+, npm 8+, and a [GitHub Personal Access Token](https://github.com/settings/tokens).

See the **[Setup Guide](./SETUP.md)** for detailed configuration including environment variables, GitHub Pages deployment, and favicon assets.

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
| 🔌 | **[Developer API](./docs/ref/DEVELOPER_API.md)** | Data endpoints and response formats |
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
