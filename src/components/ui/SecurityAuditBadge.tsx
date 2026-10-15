import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import type { SecurityAuditSummary } from '../../../scripts/security-audit';

interface SecurityAuditBadgeProps {
  audit: SecurityAuditSummary;
  /** Tailwind size classes for the icon */
  className?: string;
}

const RISK_STYLES: Record<string, string> = {
  safe: 'text-success-500',
  low: 'text-success-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

/**
 * skills.sh audit verdict on marketplace cards: a shield colored by the
 * worst auditor risk across the repo's audited skills (Gen Agent Trust Hub,
 * Socket, Snyk). The hover tooltip carries the attribution ("via skills.sh",
 * coverage, date); role="img" + aria-label covers screen readers. Verdicts
 * are indicative, not authoritative — the tooltip wording reflects that.
 * Renders nothing by design when a marketplace has no audit data; absence
 * handling lives at the call site (`{marketplace.securityAudit && ...}`).
 */
const SecurityAuditBadge: React.FC<SecurityAuditBadgeProps> = ({ audit, className }) => {
  const risk = (audit.risk || '').toLowerCase();
  const Alert =
    risk === 'medium' || risk === 'high' || risk === 'critical' ? ShieldAlert : ShieldCheck;
  const color = RISK_STYLES[risk] || 'text-gray-400';
  const date = audit.auditedAt
    ? new Date(audit.auditedAt).toISOString().slice(0, 10)
    : 'unknown date';
  const label = `skills.sh audit: ${risk} (${audit.auditedSkills}/${audit.totalSkills} skills, ${date})`;
  return (
    <span className='group/audit relative inline-flex'>
      <Alert role='img' aria-label={label} className={className || `w-5 h-5 ${color}`} />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 font-mono text-[11px] leading-4 text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/audit:opacity-100 dark:bg-gray-700'
      >
        {label} · via skills.sh
      </span>
    </span>
  );
};

export default SecurityAuditBadge;
