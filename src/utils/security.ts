/**
 * Security Utilities
 * Provides input validation, sanitization, and security-related helper functions
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content using DOMPurify
 * This is the recommended method for HTML sanitization as regex-based filtering
 * is inherently fragile and can be bypassed.
 */
export function sanitizeHtmlContent(
  input: string,
  options?: {
    allowedTags?: string[];
    allowedAttrs?: string[];
  }
): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: options?.allowedTags || ['b', 'i', 'em', 'strong', 'span', 'p', 'br'],
    ALLOWED_ATTR: options?.allowedAttrs || ['class'],
  });
}

/**
 * Configuration for input validation
 */
export interface ValidationConfig {
  maxLength?: number;
  minLength?: number;
  allowEmpty?: boolean;
  pattern?: RegExp;
  whitelist?: string[];
  blacklist?: string[];
  sanitizeHtml?: boolean;
  escapeHtml?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors: string[];
  warnings: string[];
}

/**
 * SQL injection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /--(?!\w)|\*\/|\/\*(?!\*)|(\bOR\b.*=.*\bOR\b)|(\bAND\b.*=.*\bAND\b)/gi,
  /(\bWHERE\b.*\bOR\b.*=)|(\bWHERE\b.*\bAND\b.*=)/gi,
  /[\'"]\s*(OR|AND)\s+[\'"]?\w+[\'"]?\s*=/gi,
  /(?<![\w-])[<>\"'=;](?![\w-])/g, // Only match special chars not part of words
];

/**
 * Command injection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/g,
  /\b(rm|mv|cp|cat|ls|ps|kill|chmod|chown|sudo|su|wget|curl|nc|netcat|telnet)\b/gi,
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [/\.\.\//g, /\.\.\\/g, /[\/\\]\.\.[\/\\]/g, /[\/\\]\.\.$/g];

/**
 * Validates and sanitizes input string
 */
export function validateAndSanitizeInput(
  input: string,
  config: ValidationConfig = {}
): ValidationResult {
  const {
    maxLength = 1000,
    minLength = 0,
    allowEmpty = true,
    pattern,
    whitelist,
    blacklist,
    sanitizeHtml = true,
    escapeHtml = true,
  } = config;

  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = input;

  // Check if empty
  if (!sanitized || sanitized.trim().length === 0) {
    if (!allowEmpty) {
      errors.push('Input cannot be empty');
    }
    return {
      isValid: errors.length === 0,
      sanitized: '',
      errors,
      warnings,
    };
  }

  // Length validation
  if (sanitized.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
    warnings.push('Input was truncated to maximum length');
  }

  if (sanitized.length < minLength) {
    errors.push(`Input must be at least ${minLength} characters long`);
  }

  // Blacklist validation
  if (blacklist) {
    const foundBlacklist = blacklist.find((term) =>
      sanitized.toLowerCase().includes(term.toLowerCase())
    );
    if (foundBlacklist) {
      errors.push(`Input contains blacklisted term: ${foundBlacklist}`);
    }
  }

  // Whitelist validation
  if (whitelist) {
    const foundWhitelist = whitelist.find((term) =>
      sanitized.toLowerCase().includes(term.toLowerCase())
    );
    if (!foundWhitelist) {
      errors.push('Input does not contain any allowed terms');
    }
  }

  // Pattern validation
  if (pattern && !pattern.test(sanitized)) {
    errors.push('Input does not match required pattern');
  }

  // Security checks
  const securityCheck = checkForSecurityThreats(sanitized);
  if (!securityCheck.isValid) {
    errors.push(...securityCheck.errors);
    warnings.push(...securityCheck.warnings);
    sanitized = securityCheck.sanitized || sanitized;
  }

  // HTML sanitization
  if (sanitizeHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
      ALLOWED_ATTR: ['class'],
    });
  }

  // HTML escaping
  if (escapeHtml) {
    sanitized = escapeHtmlEntities(sanitized);
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Checks for security threats in input
 * Note: For HTML/XSS sanitization, use DOMPurify via sanitizeHtmlContent() instead
 */
export function checkForSecurityThreats(
  input: string,
  isSearchQuery: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = input;

  // SQL Injection check - more lenient for search queries
  const sqlPatterns = isSearchQuery
    ? SQL_INJECTION_PATTERNS.slice(0, 1) // Only check for keywords in search
    : SQL_INJECTION_PATTERNS;

  sqlPatterns.forEach((pattern, index) => {
    if (pattern.test(input)) {
      errors.push(`Potential SQL injection pattern detected (pattern ${index + 1})`);
      sanitized = sanitized.replace(pattern, '');
    }
  });

  // Command injection check
  COMMAND_INJECTION_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      errors.push(`Potential command injection pattern detected (pattern ${index + 1})`);
      sanitized = sanitized.replace(pattern, '');
    }
  });

  // Path traversal check
  PATH_TRAVERSAL_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      errors.push(`Potential path traversal pattern detected (pattern ${index + 1})`);
      sanitized = sanitized.replace(pattern, '');
    }
  });

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Escapes HTML entities
 */
export function escapeHtmlEntities(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

/**
 * Validates GitHub repository URL
 */
export function validateGitHubUrl(url: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsedUrl = new URL(url);

    // Check domain
    if (!['github.com', 'api.github.com'].includes(parsedUrl.hostname)) {
      errors.push('URL must be from github.com domain');
    }

    // Check protocol
    if (parsedUrl.protocol !== 'https:') {
      errors.push('URL must use HTTPS protocol');
    }

    // Check path format
    const pathPattern = /^\/[\w\.-]+\/[\w\.-]+\/?$/;
    if (!pathPattern.test(parsedUrl.pathname)) {
      errors.push('Invalid GitHub repository path format');
    }

    return {
      isValid: errors.length === 0,
      sanitized: url,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push('Invalid URL format');
    return {
      isValid: false,
      sanitized: '',
      errors,
      warnings,
    };
  }
}

/**
 * Validates search query for GitHub API
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = query;

  // Basic validation
  if (sanitized.length > 256) {
    errors.push('Search query exceeds maximum length of 256 characters');
    sanitized = sanitized.substring(0, 256);
    warnings.push('Search query was truncated to maximum length');
  }

  // Allow empty queries
  if (!sanitized || sanitized.trim().length === 0) {
    return {
      isValid: true,
      sanitized: '',
      errors,
      warnings,
    };
  }

  // Use DOMPurify for XSS sanitization instead of regex patterns
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [], // No HTML tags allowed in search queries
    ALLOWED_ATTR: [],
  });

  // Basic sanitization
  sanitized = sanitized.trim();

  // Only allow safe characters for search
  if (!/^[a-zA-Z0-9\s\-_.\u00A0-\uFFFF]*$/.test(sanitized)) {
    // Remove any remaining unsafe characters
    sanitized = sanitized.replace(/[<>\"'&;]/g, '');
    warnings.push('Unsafe characters were removed from search query');
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Validates repository owner and name
 */
export function validateRepositoryIdentifier(identifier: string): ValidationResult {
  const config: ValidationConfig = {
    maxLength: 39,
    minLength: 1,
    allowEmpty: false,
    pattern: /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?$/,
    blacklist: ['..', '--', '.-', '-.'],
    sanitizeHtml: false,
    escapeHtml: false,
  };

  return validateAndSanitizeInput(identifier, config);
}

/**
 * Validates JSON content before parsing
 */
export function validateJsonContent(
  jsonString: string,
  maxSize: number = 1024 * 1024
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Size check
  if (jsonString.length > maxSize) {
    errors.push(`JSON content exceeds maximum size of ${maxSize} bytes`);
    return {
      isValid: false,
      errors,
      warnings,
    };
  }

  // Basic JSON syntax check
  try {
    const parsed = JSON.parse(jsonString);

    // Check for potentially dangerous content
    const jsonStringLower = jsonString.toLowerCase();
    const dangerousPatterns = [
      '<script',
      'javascript:',
      'vbscript:',
      'data:text/html',
      'onload=',
      'onerror=',
    ];

    dangerousPatterns.forEach((pattern) => {
      if (jsonStringLower.includes(pattern)) {
        errors.push(`Potentially dangerous content detected: ${pattern}`);
      }
    });

    // Check for nested depth (prevent DoS)
    const maxDepth = 10;
    const depth = checkJsonDepth(parsed);
    if (depth > maxDepth) {
      errors.push(`JSON nesting depth (${depth}) exceeds maximum allowed (${maxDepth})`);
    }

    return {
      isValid: errors.length === 0,
      sanitized: jsonString,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Invalid JSON format: ${error}`);
    return {
      isValid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Checks JSON object nesting depth
 */
function checkJsonDepth(obj: any, currentDepth: number = 0): number {
  if (currentDepth > 20) return currentDepth; // Prevent infinite recursion

  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const value of Object.values(obj)) {
    const depth = checkJsonDepth(value, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
  }

  return maxDepth;
}

/**
 * Creates a CSP nonce for inline scripts
 */
export function createCspNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates file path to prevent path traversal
 */
export function validateFilePath(path: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = path;

  // Normalize path
  sanitized = sanitized.replace(/\\/g, '/');

  // Check for path traversal
  PATH_TRAVERSAL_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(sanitized)) {
      errors.push(`Path traversal pattern detected (pattern ${index + 1})`);
      sanitized = sanitized.replace(pattern, '');
    }
  });

  // Check for absolute paths
  if (sanitized.startsWith('/')) {
    errors.push('Absolute paths are not allowed');
  }

  // Check for null bytes
  if (sanitized.includes('\0')) {
    errors.push('Null bytes are not allowed in file paths');
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Checks if a request should be allowed
   */
  isAllowed(): boolean {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    // Check if under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Gets the number of remaining requests
   */
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Gets the time until the next request is allowed
   */
  getTimeUntilNextRequest(): number {
    if (this.requests.length === 0) return 0;

    const oldestRequest = Math.min(...this.requests);
    const windowEnd = oldestRequest + this.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }

  /**
   * Resets the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

/**
 * Content Security Policy builder
 */
export class CSPBuilder {
  private directives: Record<string, string[]> = {};

  constructor() {
    this.directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://api.github.com'],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    };
  }

  /**
   * Adds a nonce to script-src
   */
  addScriptNonce(nonce: string): CSPBuilder {
    this.directives['script-src'].push(`'nonce-${nonce}'`);
    return this;
  }

  /**
   * Adds a domain to connect-src
   */
  addConnectDomain(domain: string): CSPBuilder {
    this.directives['connect-src'].push(domain);
    return this;
  }

  /**
   * Adds a domain to script-src
   */
  addScriptDomain(domain: string): CSPBuilder {
    this.directives['script-src'].push(domain);
    return this;
  }

  /**
   * Builds the CSP header value
   */
  build(): string {
    return Object.entries(this.directives)
      .map(([directive, sources]) => {
        const sourcesStr = sources.join(' ');
        return sourcesStr ? `${directive} ${sourcesStr}` : directive;
      })
      .join('; ');
  }
}
