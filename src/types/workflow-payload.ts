/**
 * Structured payload for Claude review workflow inter-job communication.
 * Embedded in PR comments as HTML comments for machine parsing.
 */

export interface Finding {
  id: string;
  severity: 'critical' | 'medium' | 'low';
  category: 'security' | 'quality' | 'performance' | 'breaking-change' | 'style';
  file: string;
  lineStart?: number;
  lineEnd?: number;
  title: string;
  description: string;
  recommendation: string;
  validated?: boolean;
  falsePositive?: boolean;
}

export interface ReviewPayload {
  version: 1;
  job: 'review';
  runId: string;
  prNumber: number;
  timestamp: string;
  findings: Finding[];
}

export interface ValidationPayload {
  version: 1;
  job: 'self-review';
  runId: string;
  prNumber: number;
  timestamp: string;
  sourceRunId: string;
  validatedFindings: Finding[];
  additionalFindings: Finding[];
}

export interface TriagePayload {
  version: 1;
  job: 'triage';
  runId: string;
  prNumber: number;
  timestamp: string;
  sourceRunId: string;
  actions: TriageAction[];
}

export interface TriageAction {
  findingId: string;
  severity: 'critical' | 'medium' | 'low';
  action: 'fixed' | 'issue-created' | 'skipped';
  issueNumber?: number;
  commitSha?: string;
  reason?: string;
}

export type WorkflowPayload = ReviewPayload | ValidationPayload | TriagePayload;

/**
 * Issue body markers for reliable linking in follow-up workflow.
 */
export interface IssueLinkage {
  sourcePr: number;
  sourceSha: string;
  claudeRunId: string;
  findingId: string;
}
