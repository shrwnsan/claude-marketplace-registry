#!/usr/bin/env node
// Deterministic Dependabot triage — replaces the LLM-driven session automation.
// Policy (mirrors the manual triage process):
//   merge (squash) a Dependabot PR only when ALL hold:
//     - every required check is green
//     - the bump is patch/minor (group PRs are minor-and-patch by construction)
//     - the diff touches only dependency manifests/lockfiles, or workflow files
//       changed exclusively on their `uses:` lines (version/SHA bumps)
//   everything else is left untouched for manual review.
// Never bypasses failing checks; never approves; never touches non-Dependabot PRs.
import { execFileSync } from 'node:child_process';

const REPO = process.env.GITHUB_REPOSITORY;
const DRY_RUN = process.env.DRY_RUN === '1';

function gh(args, opts = {}) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    env: { ...process.env },
    ...opts,
  }).trim();
}

// Transient API/network failures must not look like a policy SKIP; retry a
// couple of times and only then fail the entry over to manual review.
function ghWithRetry(args) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return gh(args);
    } catch (err) {
      lastErr = err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 2000);
    }
  }
  throw lastErr;
}

// A `uses:` line (with its optional SHA/version comment) is the only thing
// Dependabot action bumps should ever touch inside .github/workflows/.
const USES_LINE = /^\s*[-@]?\s*(uses:\s*\S+(\s+#.*)?|#.*|)$/;

function diffIsSafe(diff) {
  const files = [];
  let current = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      current = { path: line.slice(6), unsafeLine: null };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith('+') && !line.startsWith('+++') || line.startsWith('-') && !line.startsWith('---')) {
      const body = line.slice(1);
      if (current.path.startsWith('.github/workflows/') && !USES_LINE.test(body)) {
        current.unsafeLine = line;
      }
    }
  }
  const allowed = (p) =>
    p === 'package.json' ||
    p === 'package-lock.json' ||
    p === 'npm-shrinkwrap.json' ||
    p.startsWith('.github/workflows/');
  return files.every((f) => allowed(f.path) && !f.unsafeLine);
}

function isMajorBump(title) {
  // Group PRs ("bump the minor-and-patch group…", "bump the actions group…")
  // are minor/patch by Dependabot config; single-dep titles read
  // "bump X from A to B".
  if (/group .* with \d+ updates/.test(title)) return false;
  const m = title.match(/from ([^\s]+) to ([^\s]+)/);
  if (!m) return true; // unparseable → manual review
  const oldMajor = m[1].replace(/^v/, '').split('.')[0];
  const newMajor = m[2].replace(/^v/, '').split('.')[0];
  return oldMajor !== newMajor;
}

const prs = JSON.parse(ghWithRetry(['pr', 'list', '--repo', REPO, '--state', 'open',
  '--author', 'app/dependabot', '--json', 'number,title']));

const summary = [];
for (const { number, title } of prs) {
  const entry = { number, title, decision: 'skip', reason: '' };
  try {
    if (isMajorBump(title)) {
      entry.reason = 'major bump (or unparseable title) — manual review';
      summary.push(entry);
      continue;
    }
    let checksOk = false;
    try {
      ghWithRetry(['pr', 'checks', String(number), '--repo', REPO]);
      checksOk = true;
    } catch {
      entry.reason = 'checks missing, pending, or failing';
    }
    if (!checksOk) { summary.push(entry); continue; }

    const diff = ghWithRetry(['pr', 'diff', String(number), '--repo', REPO]);
    if (!diffIsSafe(diff)) {
      entry.reason = 'diff touches non-dependency paths or non-uses workflow lines';
      summary.push(entry);
      continue;
    }
    entry.decision = 'merge';
    entry.reason = 'green checks + minor/patch + dependency-only diff';
    if (DRY_RUN) { summary.push(entry); continue; }
    gh(['pr', 'merge', String(number), '--repo', REPO, '--squash']);
    gh(['pr', 'comment', String(number), '--repo', REPO, '--body',
      `✅ Auto-approved by deterministic triage: ${entry.reason}.`]);
  } catch (err) {
    entry.decision = 'error';
    entry.reason = String(err.message || err).slice(0, 200);
  }
  summary.push(entry);
}

for (const s of summary) {
  console.log(`${s.decision.toUpperCase().padEnd(6)} #${s.number} — ${s.reason} — ${s.title}`);
}
if (summary.length) {
  console.log('\n### Dependabot triage summary\n');
  console.log(...summary.map((s) => `- **#${s.number}** ${s.decision}: ${s.reason}`));
}
