# Security Documentation

## Overview

This document outlines the security measures implemented in the Claude Marketplace Aggregator project to protect against common web vulnerabilities and ensure the safety of user data.

## Security Architecture

### Defense in Depth

We implement a multi-layered security approach:

1. **Input Validation Layer** - All user inputs are validated and sanitized
2. **Content Security Layer** - CSP headers prevent XSS attacks
3. **API Security Layer** - Rate limiting and request validation
4. **Data Validation Layer** - Schema validation for all JSON content
5. **Infrastructure Layer** - Secure headers and HTTPS enforcement

## Implemented Security Measures

### 1. Input Validation and Sanitization

**Location**: `src/utils/security.ts`

All user inputs are validated using the `validateAndSanitizeInput()` function:

- **SQL Injection Protection**: Detects and blocks SQL injection patterns
- **XSS Protection**: Detects and removes XSS attack vectors
- **Command Injection Protection**: Blocks command injection attempts
- **Path Traversal Protection**: Prevents directory traversal attacks
- **Length Validation**: Enforces maximum input lengths
- **Pattern Validation**: Validates input against allowed patterns

**Example Usage**:
```typescript
import { validateSearchQuery } from '@/utils/security';

const validation = validateSearchQuery(userInput);
if (!validation.isValid) {
  // Handle validation error
  return;
}
const sanitizedInput = validation.sanitized;
```

### 2. Content Security Policy (CSP)

**Location**: `next.config.js`

Comprehensive CSP headers are implemented:

```javascript
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-xyz'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

**Features**:
- **Nonce-based Script Execution**: Prevents inline script execution in production
- **Restricted Resources**: Only allows connections to trusted domains
- **Frame Protection**: Prevents clickjacking attacks
- **Mixed Content Blocking**: Blocks HTTP content on HTTPS pages

### 3. Rate Limiting

**Location**: `src/utils/github-client.ts`

Application-level rate limiting protects against API abuse:

- **Configurable Limits**: Default 5000 requests per hour
- **Automatic Throttling**: Requests are queued when limits are exceeded
- **Graceful Degradation**: Returns informative error messages when rate limited
- **GitHub API Integration**: Respects GitHub's rate limits automatically

### 4. JSON Schema Validation

**Location**: `src/utils/schema-validation.ts`

All manifest files are validated against strict schemas:

- **Marketplace Manifests**: Validates structure and required fields
- **Plugin Manifests**: Ensures plugin metadata integrity
- **Security Checks**: Detects dangerous content patterns
- **Size Limits**: Prevents DoS attacks through large payloads
- **Depth Limits**: Prevents deeply nested JSON attacks

### 5. XSS Protection

**Location**: `src/utils/security.ts` and React components

Multiple layers of XSS protection:

- **HTML Sanitization**: Uses DOMPurify to clean HTML content
- **Output Encoding**: Automatically encodes HTML entities
- **CSP Enforcement**: Browser-enforced script execution policies
- **React Protection**: Leverages React's built-in XSS protection

### 6. Secure Headers

**Location**: `next.config.js`

Comprehensive security headers:

- **X-Frame-Options: DENY**: Prevents clickjacking
- **X-Content-Type-Options: nosniff**: Prevents MIME-type sniffing
- **X-XSS-Protection: 1; mode=block**: Legacy XSS protection
- **Referrer-Policy: strict-origin-when-cross-origin**: Controls referrer information
- **Permissions-Policy**: Restricts access to browser APIs
- **Strict-Transport-Security**: HTTPS enforcement (production only)

## Security Testing

### Manual Testing Procedures

1. **Input Validation Testing**:
   ```bash
   # Test SQL injection
   curl -X POST "http://localhost:3000/api/search" -d '{"query":"'\'' OR 1=1--"}'

   # Test XSS
   curl -X POST "http://localhost:3000/api/search" -d '{"query":"<script>alert(1)</script>"}'

   # Test command injection
   curl -X POST "http://localhost:3000/api/search" -d '{"query":"; rm -rf /"}'
   ```

2. **CSP Testing**:
   - Use browser developer tools to verify CSP headers
   - Test inline script execution attempts
   - Verify external resource loading restrictions

3. **Rate Limiting Testing**:
   ```bash
   # Rapid requests to test rate limiting
   for i in {1..6000}; do curl "http://localhost:3000/api/search"; done
   ```

### Automated Security Testing

**Security Dependencies Check**:
```bash
npm audit --audit-level=moderate
```

**Dependency Updates**:
```bash
npm outdated
npm update
```

## Security Configuration

### Environment Variables

Key security-related environment variables:

```env
# Enable strict validation mode
VALIDATION_STRICT_MODE=true

# Enable CSP in production
PROD_ENABLE_CSP=true

# Enable CSRF protection
ENABLE_CSRF_PROTECTION=true

# GitHub API rate limiting
GITHUB_RATE_LIMIT=5000

# Cache TTL for security
CACHE_TTL=3600
```

### Security Middleware

The application uses several security middleware layers:

1. **CSP Middleware**: Automatically adds CSP headers
2. **Rate Limiting Middleware**: API request throttling
3. **Input Validation Middleware**: Request sanitization
4. **Error Handling Middleware**: Secure error responses

## Incident Response

### Security Incident Procedures

1. **Immediate Response**:
   - Identify and isolate affected systems
   - Deploy security patches if available
   - Monitor for continued malicious activity

2. **Investigation**:
   - Review logs for attack patterns
   - Identify root cause
   - Assess data impact

3. **Communication**:
   - Notify stakeholders
   - Prepare public statements if necessary
   - Document lessons learned

4. **Prevention**:
   - Update security measures
   - Implement additional monitoring
   - Conduct security review

## Security Best Practices

### Development Guidelines

1. **Code Review**: All code must pass security review
2. **Dependencies**: Regular security audits of third-party packages
3. **Testing**: Security tests included in CI/CD pipeline
4. **Documentation**: Security measures documented and kept current

### Operational Guidelines

1. **Access Control**: Principle of least privilege
2. **Monitoring**: Real-time security monitoring
3. **Backups**: Regular, encrypted backups
4. **Updates**: Prompt security patch application

## Vulnerability Disclosure

### Reporting Security Issues

If you discover a security vulnerability, please report it privately:

1. **Email**: security@claude-marketplace.org
2. **GitHub Security**: Use GitHub's private vulnerability reporting
3. **Response Time**: We aim to respond within 48 hours

### Responsible Disclosure Policy

- We request responsible disclosure and will work with researchers
- Public disclosure should be coordinated with our team
- We offer recognition for valid security findings

## Compliance

### Standards Compliance

The application aims to comply with:

- **OWASP Top 10**: Protection against common web vulnerabilities
- **GDPR**: Data protection and privacy measures
- **CCPA**: Consumer privacy rights
- **SOC 2**: Security controls and processes

### Data Protection

- **Data Minimization**: Only collect necessary data
- **Encryption**: Data encrypted in transit and at rest
- **Retention**: Data retention policies enforced
- **Rights**: User data access and deletion rights

## Security Metrics

### Key Performance Indicators

- **Vulnerability Response Time**: < 48 hours
- **Patch Deployment Time**: < 24 hours for critical
- **Security Test Coverage**: > 90%
- **Incident Response Time**: < 1 hour

### Monitoring

- **Real-time Alerts**: Security events trigger immediate alerts
- **Log Analysis**: Continuous security log monitoring
- **Threat Intelligence**: Regular threat briefings
- **Compliance Checks**: Automated compliance verification

## Future Security Enhancements

### Planned Improvements

1. **Web Application Firewall**: Implementation of WAF rules
2. **Advanced Threat Detection**: AI-powered anomaly detection
3. **Security Headers**: HSTS preloading, additional CSP restrictions
4. **API Security**: Advanced API authentication and authorization
5. **Code Scanning**: Automated SAST/DAST integration

### Security Roadmap

- **Q1 2025**: Implement WAF and advanced threat detection
- **Q2 2025**: Enhance API security measures
- **Q3 2025**: Automated security testing pipeline
- **Q4 2025**: Compliance certifications and audits

## Contact Information

For security-related questions or concerns:

- **Security Team**: security@claude-marketplace.org
- **GitHub Issues**: Use the `security` label for security issues
- **Emergency**: For critical security incidents, contact us immediately

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Review Required**: Every 6 months or after major security incidents