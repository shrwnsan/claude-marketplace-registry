/**
 * JSON Schema Validation Utilities
 * Provides schema validation for marketplace and plugin manifests
 */

import { validateJsonContent, ValidationResult } from './security';

/**
 * Base manifest schema
 */
interface BaseManifestSchema {
  name: string;
  version: string;
  description?: string;
  author: string;
  repository: {
    url: string;
    owner: string;
    repo: string;
  };
  tags?: string[];
  license?: string;
}

/**
 * Marketplace manifest schema
 */
export interface MarketplaceManifestSchema extends BaseManifestSchema {
  type: 'marketplace';
  category: string;
  website?: string;
  verified?: boolean;
  featured?: boolean;
  plugins?: PluginManifestSchema[];
}

/**
 * Plugin manifest schema
 */
export interface PluginManifestSchema extends BaseManifestSchema {
  type: 'plugin';
  category: string;
  marketplace?: string;
  main?: string;
  files?: string[];
  dependencies?: Record<string, string>;
  permissions?: string[];
  homepage?: string;
  bugs?: {
    url: string;
  };
}

/**
 * Validation context
 */
export interface ValidationContext {
  maxSize?: number;
  strictMode?: boolean;
  allowedHosts?: string[];
  requiredFields?: string[];
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult extends ValidationResult {
  schemaType?: string;
  data?: any;
  warnings: string[];
}

/**
 * Validates marketplace manifest JSON
 */
export function validateMarketplaceManifest(
  jsonString: string,
  context: ValidationContext = {}
): SchemaValidationResult {
  const { maxSize = 1024 * 1024, strictMode = false } = context;

  // First validate JSON structure
  const jsonValidation = validateJsonContent(jsonString, maxSize);
  if (!jsonValidation.isValid) {
    return {
      ...jsonValidation,
      schemaType: 'marketplace',
      warnings: [],
    };
  }

  try {
    const data = JSON.parse(jsonValidation.sanitized || jsonString);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    const requiredFields = ['name', 'version', 'author', 'repository', 'type', 'category'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Type validation
    if (data.type !== 'marketplace') {
      errors.push(`Invalid type. Expected 'marketplace', got '${data.type}'`);
    }

    // Name validation
    if (data.name && typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name && !/^[a-zA-Z0-9\-_.]+$/.test(data.name)) {
      errors.push('Name contains invalid characters');
    }

    // Version validation (semver-like)
    if (data.version && typeof data.version !== 'string') {
      errors.push('Version must be a string');
    } else if (data.version && !/^\d+\.\d+\.\d+/.test(data.version)) {
      warnings.push('Version should follow semantic versioning (x.y.z)');
    }

    // Author validation
    if (data.author && typeof data.author !== 'string') {
      errors.push('Author must be a string');
    }

    // Repository validation
    if (data.repository) {
      const repoValidation = validateRepositoryInfo(data.repository);
      errors.push(...repoValidation.errors);
      warnings.push(...repoValidation.warnings);
    }

    // Category validation
    if (data.category && typeof data.category !== 'string') {
      errors.push('Category must be a string');
    }

    // Tags validation
    if (data.tags) {
      if (!Array.isArray(data.tags)) {
        errors.push('Tags must be an array');
      } else {
        for (const tag of data.tags) {
          if (typeof tag !== 'string') {
            errors.push('All tags must be strings');
          } else if (tag.length > 50) {
            warnings.push(`Tag '${tag}' is too long (max 50 characters)`);
          }
        }
      }
    }

    // Website validation
    if (data.website) {
      const urlValidation = validateUrl(data.website, ['https:']);
      if (!urlValidation.isValid) {
        errors.push(`Invalid website URL: ${urlValidation.errors[0]}`);
      }
    }

    // Plugins validation (if present)
    if (data.plugins) {
      if (!Array.isArray(data.plugins)) {
        errors.push('Plugins must be an array');
      } else if (data.plugins.length > 1000) {
        errors.push('Too many plugins (max 1000)');
      } else {
        data.plugins.forEach((plugin: any, index: number) => {
          const pluginValidation = validatePluginManifestStructure(plugin, true);
          errors.push(...pluginValidation.errors.map(e => `Plugin ${index + 1}: ${e}`));
          warnings.push(...pluginValidation.warnings.map(w => `Plugin ${index + 1}: ${w}`));
        });
      }
    }

    // Security checks in strict mode
    if (strictMode) {
      const securityValidation = performSecurityValidation(data);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      sanitized: jsonString,
      data: errors.length === 0 ? data : null,
      schemaType: 'marketplace',
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`JSON parsing failed: ${error}`],
      warnings: [],
      schemaType: 'marketplace',
    };
  }
}

/**
 * Validates plugin manifest JSON
 */
export function validatePluginManifest(
  jsonString: string,
  context: ValidationContext = {}
): SchemaValidationResult {
  const { maxSize = 512 * 1024, strictMode = false } = context;

  // First validate JSON structure
  const jsonValidation = validateJsonContent(jsonString, maxSize);
  if (!jsonValidation.isValid) {
    return {
      ...jsonValidation,
      schemaType: 'plugin',
      warnings: [],
    };
  }

  try {
    const data = JSON.parse(jsonValidation.sanitized || jsonString);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    const requiredFields = ['name', 'version', 'author', 'repository', 'type', 'category'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Type validation
    if (data.type !== 'plugin') {
      errors.push(`Invalid type. Expected 'plugin', got '${data.type}'`);
    }

    // Name validation
    if (data.name && typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name && !/^[a-zA-Z0-9\-_.]+$/.test(data.name)) {
      errors.push('Name contains invalid characters');
    }

    // Version validation
    if (data.version && typeof data.version !== 'string') {
      errors.push('Version must be a string');
    } else if (data.version && !/^\d+\.\d+\.\d+/.test(data.version)) {
      warnings.push('Version should follow semantic versioning (x.y.z)');
    }

    // Author validation
    if (data.author && typeof data.author !== 'string') {
      errors.push('Author must be a string');
    }

    // Repository validation
    if (data.repository) {
      const repoValidation = validateRepositoryInfo(data.repository);
      errors.push(...repoValidation.errors);
      warnings.push(...repoValidation.warnings);
    }

    // Category validation
    if (data.category && typeof data.category !== 'string') {
      errors.push('Category must be a string');
    }

    // Main file validation
    if (data.main && typeof data.main !== 'string') {
      errors.push('Main must be a string');
    } else if (data.main && !/^[\w\-./]+$/.test(data.main)) {
      errors.push('Main file path contains invalid characters');
    }

    // Files validation
    if (data.files) {
      if (!Array.isArray(data.files)) {
        errors.push('Files must be an array');
      } else {
        for (const file of data.files) {
          if (typeof file !== 'string') {
            errors.push('All files must be strings');
          } else if (!/^[\w\-./]+$/.test(file)) {
            errors.push(`File path '${file}' contains invalid characters`);
          } else if (file.includes('..')) {
            errors.push(`File path '${file}' contains path traversal`);
          }
        }
      }
    }

    // Dependencies validation
    if (data.dependencies) {
      if (typeof data.dependencies !== 'object' || Array.isArray(data.dependencies)) {
        errors.push('Dependencies must be an object');
      } else {
        for (const [name, version] of Object.entries(data.dependencies)) {
          if (typeof name !== 'string' || typeof version !== 'string') {
            errors.push('Dependency names and versions must be strings');
          }
        }
      }
    }

    // Permissions validation
    if (data.permissions) {
      if (!Array.isArray(data.permissions)) {
        errors.push('Permissions must be an array');
      } else {
        const allowedPermissions = [
          'read', 'write', 'execute', 'network', 'filesystem', 'system',
          'clipboard', 'notification', 'camera', 'microphone', 'location'
        ];

        for (const permission of data.permissions) {
          if (typeof permission !== 'string') {
            errors.push('All permissions must be strings');
          } else if (!allowedPermissions.includes(permission)) {
            warnings.push(`Unknown permission: ${permission}`);
          }
        }
      }
    }

    // URL validations
    const urlFields = ['homepage', 'bugs.url'];
    for (const field of urlFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], data);
      if (value) {
        const urlValidation = validateUrl(value, ['https:', 'http:']);
        if (!urlValidation.isValid) {
          errors.push(`Invalid ${field} URL: ${urlValidation.errors[0]}`);
        }
      }
    }

    // Security checks in strict mode
    if (strictMode) {
      const securityValidation = performSecurityValidation(data);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      sanitized: jsonString,
      data: errors.length === 0 ? data : null,
      schemaType: 'plugin',
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`JSON parsing failed: ${error}`],
      warnings: [],
      schemaType: 'plugin',
    };
  }
}

/**
 * Validates repository information
 */
function validateRepositoryInfo(repository: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!repository || typeof repository !== 'object') {
    errors.push('Repository must be an object');
    return { isValid: false, errors, warnings };
  }

  // URL validation
  if (!repository.url) {
    errors.push('Repository URL is required');
  } else {
    const urlValidation = validateUrl(repository.url, ['https:']);
    if (!urlValidation.isValid) {
      errors.push(`Invalid repository URL: ${urlValidation.errors[0]}`);
    } else if (!repository.url.includes('github.com')) {
      warnings.push('Repository should be hosted on GitHub');
    }
  }

  // Owner validation
  if (!repository.owner) {
    errors.push('Repository owner is required');
  } else if (typeof repository.owner !== 'string') {
    errors.push('Repository owner must be a string');
  } else if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?$/.test(repository.owner)) {
    errors.push('Invalid repository owner format');
  }

  // Repo validation
  if (!repository.repo) {
    errors.push('Repository name is required');
  } else if (typeof repository.repo !== 'string') {
    errors.push('Repository name must be a string');
  } else if (!/^[a-zA-Z0-9._-]+$/.test(repository.repo)) {
    errors.push('Invalid repository name format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates URL
 */
function validateUrl(url: string, allowedSchemes: string[] = ['https:']): ValidationResult {
  const errors: string[] = [];

  try {
    const parsed = new URL(url);

    if (!allowedSchemes.includes(parsed.protocol)) {
      errors.push(`URL protocol must be one of: ${allowedSchemes.join(', ')}`);
    }

    // Check for dangerous URLs
    if (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.')) {
      errors.push('Localhost URLs are not allowed');
    }

    if (parsed.hostname?.startsWith('192.168.') || parsed.hostname?.startsWith('10.')) {
      errors.push('Private network URLs are not allowed');
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  } catch (error) {
    return { isValid: false, errors: ['Invalid URL format'], warnings: [] };
  }
}

/**
 * Validates plugin manifest structure (for nested plugins in marketplace)
 */
function validatePluginManifestStructure(plugin: any, partial: boolean = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!plugin || typeof plugin !== 'object') {
    errors.push('Plugin must be an object');
    return { isValid: false, errors, warnings };
  }

  // Basic required fields (unless partial)
  if (!partial) {
    const requiredFields = ['name', 'version', 'author'];
    for (const field of requiredFields) {
      if (!plugin[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }

  // Type validation
  if (plugin.type && plugin.type !== 'plugin') {
    errors.push(`Invalid type. Expected 'plugin', got '${plugin.type}'`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Performs security validation on manifest data
 */
function performSecurityValidation(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for dangerous patterns in strings
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /on\w+\s*=/i,
  ];

  const checkValue = (value: any, path: string) => {
    if (typeof value === 'string') {
      dangerousPatterns.forEach((pattern, index) => {
        if (pattern.test(value)) {
          errors.push(`Dangerous content detected at ${path} (pattern ${index + 1})`);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        checkValue(val, `${path}.${key}`);
      });
    }
  };

  checkValue(data, 'root');

  // Check for excessive data size
  const jsonString = JSON.stringify(data);
  if (jsonString.length > 10 * 1024 * 1024) { // 10MB
    warnings.push('Manifest is very large, consider optimizing');
  }

  // Check for excessive depth
  const maxDepth = 10;
  const checkDepth = (obj: any, currentDepth: number = 0): number => {
    if (currentDepth > maxDepth) return currentDepth;
    if (typeof obj !== 'object' || obj === null) return currentDepth;

    let max = currentDepth;
    for (const value of Object.values(obj)) {
      max = Math.max(max, checkDepth(value, currentDepth + 1));
    }
    return max;
  };

  const depth = checkDepth(data);
  if (depth > maxDepth) {
    errors.push(`JSON nesting depth (${depth}) exceeds maximum allowed (${maxDepth})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Auto-detect and validate manifest type
 */
export function validateManifest(
  jsonString: string,
  context: ValidationContext = {}
): SchemaValidationResult {
  try {
    const data = JSON.parse(jsonString);

    if (data.type === 'marketplace') {
      return validateMarketplaceManifest(jsonString, context);
    } else if (data.type === 'plugin') {
      return validatePluginManifest(jsonString, context);
    } else {
      // Try to detect type from structure
      if (data.plugins && Array.isArray(data.plugins)) {
        return validateMarketplaceManifest(jsonString, context);
      } else {
        // Default to plugin validation
        return validatePluginManifest(jsonString, context);
      }
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to parse JSON: ${error}`],
      warnings: [],
    };
  }
}