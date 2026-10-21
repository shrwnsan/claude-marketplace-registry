import {
  slugFromSkillPath,
  repoFromUrl,
  riskSeverity,
  worstRisk,
  aggregateAudit,
  applySecurityAudit,
  parseAuditResponse,
  type RepoAuditEntry,
  type SecurityAuditFile,
} from '../security-audit';

describe('slugFromSkillPath', () => {
  it('extracts the slug from manifest skill paths', () => {
    expect(slugFromSkillPath('./skills/pdf')).toBe('pdf');
    expect(slugFromSkillPath('./skills/brag')).toBe('brag');
    expect(slugFromSkillPath('skills/xlsx')).toBe('xlsx');
  });

  it('returns empty string for unusable paths', () => {
    expect(slugFromSkillPath('')).toBe('');
    expect(slugFromSkillPath('/')).toBe('');
    expect(slugFromSkillPath(undefined as unknown as string)).toBe('');
  });
});

describe('repoFromUrl', () => {
  it('parses owner/repo from GitHub URLs', () => {
    expect(repoFromUrl('https://github.com/anthropics/skills')).toBe('anthropics/skills');
    expect(repoFromUrl('https://github.com/latent-spaces/brag.git')).toBe('latent-spaces/brag');
    expect(repoFromUrl('https://github.com/anthropics/skills#readme')).toBe('anthropics/skills');
  });

  it('returns null for non-GitHub or malformed URLs', () => {
    expect(repoFromUrl('https://gitlab.com/a/b')).toBeNull();
    expect(repoFromUrl('')).toBeNull();
  });
});

describe('worstRisk / riskSeverity', () => {
  it('orders risks safe < low < medium < high < critical', () => {
    expect(riskSeverity('safe')).toBeLessThan(riskSeverity('low'));
    expect(riskSeverity('low')).toBeLessThan(riskSeverity('medium'));
    expect(riskSeverity('medium')).toBeLessThan(riskSeverity('high'));
    expect(riskSeverity('high')).toBeLessThan(riskSeverity('critical'));
    expect(riskSeverity(undefined)).toBe(-1);
    expect(riskSeverity('banana')).toBeLessThan(riskSeverity('low'));
  });

  it('returns the worst verdict across skills and providers', () => {
    const skills = {
      pdf: { ath: { risk: 'safe' }, snyk: { risk: 'medium' } },
      xlsx: { socket: { risk: 'safe', alerts: 0, score: 90 } },
    };
    expect(worstRisk(skills)).toBe('medium');
  });

  it('returns null when nothing carries a risk', () => {
    expect(worstRisk({})).toBeNull();
    expect(worstRisk({ pdf: {} })).toBeNull();
  });
});

describe('aggregateAudit', () => {
  const entry: RepoAuditEntry = {
    repo: 'anthropics/skills',
    auditedAt: '2026-10-15T00:00:00Z',
    skills: {
      pdf: { ath: { risk: 'safe' }, snyk: { risk: 'medium' }, analyzedAt: '2026-09-15T12:20:57Z' },
      docx: { socket: { risk: 'safe', alerts: 2, score: 90 }, analyzedAt: '2026-09-16T00:00:00Z' },
    },
  };

  it('summarizes worst risk, summed alerts, coverage, newest date', () => {
    const summary = aggregateAudit(entry, 4);
    expect(summary).toEqual({
      risk: 'medium',
      alerts: 2,
      auditedSkills: 2,
      totalSkills: 4,
      auditedAt: '2026-09-16T00:00:00Z',
      source: 'skills.sh',
    });
  });

  it('returns null when no skill carries any verdict', () => {
    expect(aggregateAudit({ repo: 'a/b', auditedAt: '', skills: { pdf: {} } }, 1)).toBeNull();
  });
});

describe('applySecurityAudit', () => {
  const file: SecurityAuditFile = {
    source: 'skills.sh',
    generatedAt: '2026-10-15T00:00:00Z',
    entries: {
      mp1: {
        repo: 'anthropics/skills',
        auditedAt: '2026-10-15T00:00:00Z',
        skills: { pdf: { snyk: { risk: 'medium' }, analyzedAt: '2026-09-15T12:20:57Z' } },
      },
    },
  };

  it('attaches the summary only to marketplaces with audit entries', () => {
    const out = applySecurityAudit([{ id: 'mp1' }, { id: 'mp2' }] as Array<{ id: string }>, file);
    expect(out[0]).toHaveProperty('securityAudit');
    expect((out[0] as any).securityAudit.risk).toBe('medium');
    expect(out[1]).not.toHaveProperty('securityAudit');
  });

  it('passes marketplaces through untouched when the sidecar is absent', () => {
    const mps = [{ id: 'mp1' }];
    expect(applySecurityAudit(mps, null)).toBe(mps);
  });
});

describe('parseAuditResponse', () => {
  it('parses the live endpoint shape', () => {
    const parsed = parseAuditResponse({
      pdf: {
        ath: { risk: 'safe', analyzedAt: '2026-09-15T12:21:41.621Z' },
        socket: { risk: 'safe', alerts: 0, score: 90, analyzedAt: '2026-09-15T12:21:30.416Z' },
        snyk: { risk: 'medium', analyzedAt: '2026-09-15T12:20:57.824067+00:00' },
      },
    });
    expect(parsed.pdf?.ath?.risk).toBe('safe');
    expect(parsed.pdf?.socket?.alerts).toBe(0);
    expect(parsed.pdf?.snyk?.risk).toBe('medium');
    expect(parsed.pdf?.analyzedAt).toBe('2026-09-15T12:21:41.621Z');
  });

  it('ignores unknown shapes and non-object payloads', () => {
    expect(parseAuditResponse(null)).toEqual({});
    expect(parseAuditResponse('nope')).toEqual({});
    expect(parseAuditResponse({ pdf: 'garbage', docx: 42 })).toEqual({});
  });
});
