#!/usr/bin/env ts-node

/**
 * Generated Data Validator
 *
 * Validates the generated data files before they are committed to the repository.
 * This ensures data integrity and catches issues early in the pipeline.
 */

import fs from 'fs';
import path from 'path';

/* eslint-disable no-console */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  file: string;
}

interface DataValidationReport {
  overallValid: boolean;
  files: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

class GeneratedDataValidator {
  private dataDir: string;
  private generatedDir: string;
  private publicDataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.generatedDir = path.join(this.dataDir, 'generated');
    this.publicDataDir = path.join(process.cwd(), 'public', 'data');
  }

  /**
   * Validate all generated data files
   */
  async validateAll(): Promise<DataValidationReport> {
    console.log('🔍 Validating generated data files...');
    console.log('');

    const results: ValidationResult[] = [];
    const filesToValidate = this.getFilesToValidate();

    for (const file of filesToValidate) {
      const result = await this.validateFile(file);
      results.push(result);
      this.printResult(result);
    }

    const report = this.generateReport(results);
    this.printSummary(report);

    return report;
  }

  /**
   * Get list of files to validate
   */
  private getFilesToValidate(): string[] {
    const files: string[] = [];

    // Check generated directory
    if (fs.existsSync(this.generatedDir)) {
      const generatedFiles = ['complete.json', 'marketplaces.json', 'plugins.json', 'stats.json'];

      for (const file of generatedFiles) {
        const filePath = path.join(this.generatedDir, file);
        if (fs.existsSync(filePath)) {
          files.push(filePath);
        }
      }
    }

    // Check public data directory
    if (fs.existsSync(this.publicDataDir)) {
      const publicFiles = ['index.json', 'health.json', 'status.json', 'analytics.json'];

      for (const file of publicFiles) {
        const filePath = path.join(this.publicDataDir, file);
        if (fs.existsSync(filePath)) {
          files.push(filePath);
        }
      }
    }

    return files;
  }

  /**
   * Validate a single file
   */
  private async validateFile(filePath: string): Promise<ValidationResult> {
    const relativePath = path.relative(process.cwd(), filePath);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file exists and is readable
      if (!fs.existsSync(filePath)) {
        return {
          isValid: false,
          errors: [`File does not exist`],
          warnings: [],
          file: relativePath,
        };
      }

      // Check file size
      const stats = fs.statSync(filePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        errors.push(
          `File size (${this.formatBytes(stats.size)}) exceeds maximum (${this.formatBytes(maxSize)})`
        );
      }
      if (stats.size === 0) {
        errors.push('File is empty');
      }

      // Read and parse JSON
      let data: unknown;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(content);
      } catch (parseError) {
        errors.push(`Invalid JSON: ${(parseError as Error).message}`);
        return {
          isValid: false,
          errors,
          warnings,
          file: relativePath,
        };
      }

      // Validate based on file type
      const fileName = path.basename(filePath);
      const specificErrors = this.validateByFileType(fileName, data);
      errors.push(...specificErrors.errors);
      warnings.push(...specificErrors.warnings);
    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      file: relativePath,
    };
  }

  /**
   * Validate data based on file type
   */
  private validateByFileType(fileName: string, data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (fileName) {
      case 'complete.json':
        this.validateCompleteData(data, errors, warnings);
        break;
      case 'marketplaces.json':
        this.validateMarketplacesData(data, errors, warnings);
        break;
      case 'plugins.json':
        this.validatePluginsData(data, errors, warnings);
        break;
      case 'stats.json':
        this.validateStatsData(data, errors, warnings);
        break;
      case 'index.json':
        this.validateIndexData(data, errors, warnings);
        break;
      case 'health.json':
        this.validateHealthData(data, errors, warnings);
        break;
      case 'status.json':
        this.validateStatusData(data, errors, warnings);
        break;
      case 'analytics.json':
        this.validateAnalyticsData(data, errors, warnings);
        break;
      default:
        warnings.push('No specific validation for this file type');
    }

    return { isValid: errors.length === 0, errors, warnings, file: fileName };
  }

  /**
   * Validate complete.json structure
   */
  private validateCompleteData(data: unknown, errors: string[], _warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('complete.json must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;
    const requiredFields = ['marketplaces', 'plugins', 'stats', 'categories', 'tags'];
    for (const field of requiredFields) {
      if (!obj[field]) {
        errors.push(`Missing required field: ${field}`);
      } else if (!Array.isArray(obj[field]) && field !== 'stats') {
        errors.push(`${field} must be an array`);
      }
    }

    // Validate stats object
    if (obj.stats) {
      this.validateStatsObject(obj.stats, errors, _warnings);
    }

    // Sanity check on array lengths
    if (Array.isArray(obj.marketplaces) && obj.marketplaces.length === 0) {
      _warnings.push('No marketplaces found in data');
    }

    if (Array.isArray(obj.plugins) && obj.plugins.length === 0) {
      _warnings.push('No plugins found in data');
    }
  }

  /**
   * Validate marketplaces.json structure
   */
  private validateMarketplacesData(data: unknown, errors: string[], warnings: string[]): void {
    if (!Array.isArray(data)) {
      errors.push('marketplaces.json must be an array');
      return;
    }

    if (data.length === 0) {
      warnings.push('Marketplaces array is empty');
    }

    // Sample validation (check first 10 items)
    const sampleSize = Math.min(data.length, 10);
    for (let i = 0; i < sampleSize; i++) {
      const mp = data[i] as Record<string, unknown>;
      if (!mp.id) errors.push(`Marketplace at index ${i} missing id`);
      if (!mp.name) errors.push(`Marketplace at index ${i} missing name`);
      if (!mp.url && !(mp.repository as Record<string, unknown>)?.url) {
        errors.push(`Marketplace at index ${i} missing url`);
      }
      const stars = mp.stars as number | undefined;
      if (typeof stars !== 'number')
        errors.push(`Marketplace at index ${i} has invalid stars count`);
      if (stars !== undefined && stars < 0)
        errors.push(`Marketplace at index ${i} has negative stars count`);
    }
  }

  /**
   * Validate plugins.json structure
   */
  private validatePluginsData(data: unknown, errors: string[], warnings: string[]): void {
    if (!Array.isArray(data)) {
      errors.push('plugins.json must be an array');
      return;
    }

    if (data.length === 0) {
      warnings.push('Plugins array is empty');
    }

    // Sample validation
    const sampleSize = Math.min(data.length, 10);
    for (let i = 0; i < sampleSize; i++) {
      const plugin = data[i] as Record<string, unknown>;
      if (!plugin.id) errors.push(`Plugin at index ${i} missing id`);
      if (!plugin.name) errors.push(`Plugin at index ${i} missing name`);
      if (typeof plugin.isValid !== 'boolean') {
        errors.push(`Plugin at index ${i} missing isValid field`);
      }
    }
  }

  /**
   * Validate stats.json structure
   */
  private validateStatsData(data: unknown, errors: string[], warnings: string[]): void {
    this.validateStatsObject(data, errors, warnings);
  }

  /**
   * Validate stats object (used by multiple files)
   */
  private validateStatsObject(data: unknown, errors: string[], _warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('Stats must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;
    const requiredFields = ['totalMarketplaces', 'totalPlugins', 'lastUpdated'];
    for (const field of requiredFields) {
      if (obj[field] === undefined) {
        errors.push(`Stats missing required field: ${field}`);
      }
    }

    // Type checks
    if (typeof obj.totalMarketplaces !== 'number') {
      errors.push('totalMarketplaces must be a number');
    } else if (obj.totalMarketplaces < 0) {
      errors.push('totalMarketplaces cannot be negative');
    }

    if (typeof obj.totalPlugins !== 'number') {
      errors.push('totalPlugins must be a number');
    } else if (obj.totalPlugins < 0) {
      errors.push('totalPlugins cannot be negative');
    }

    // Date validation
    if (obj.lastUpdated) {
      const date = new Date(obj.lastUpdated as string);
      if (isNaN(date.getTime())) {
        errors.push('lastUpdated is not a valid ISO date string');
      } else {
        // Check if date is not in the future (with 5 minute buffer for clock skew)
        const now = new Date();
        const maxDate = new Date(now.getTime() + 5 * 60 * 1000);
        if (date > maxDate) {
          errors.push('lastUpdated date is in the future');
        }
      }
    }

    // Sanity check: validPlugins should not exceed totalPlugins
    if (typeof obj.validPlugins === 'number' && typeof obj.totalPlugins === 'number') {
      if (obj.validPlugins > obj.totalPlugins) {
        errors.push('validPlugins cannot exceed totalPlugins');
      }
    }
  }

  /**
   * Validate index.json structure
   */
  private validateIndexData(data: unknown, errors: string[], _warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('index.json must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;
    if (!obj.stats) errors.push('index.json missing stats field');
    if (!Array.isArray(obj.categories)) errors.push('index.json categories must be an array');
    if (!obj.lastUpdated) errors.push('index.json missing lastUpdated field');
  }

  /**
   * Validate health.json structure
   */
  private validateHealthData(data: unknown, errors: string[], warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('health.json must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;
    const status = obj.status as string;
    if (status !== 'healthy' && status !== 'degraded' && status !== 'unhealthy') {
      warnings.push(`Unexpected health status: ${status}`);
    }

    if (!obj.timestamp) errors.push('health.json missing timestamp');
  }

  /**
   * Validate status.json structure
   */
  private validateStatusData(data: unknown, errors: string[], _warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('status.json must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;
    const expectedFields = ['api', 'database', 'scanning', 'lastScan'];
    for (const field of expectedFields) {
      if (!obj[field]) {
        errors.push(`status.json missing required field: ${field}`);
      }
    }
  }

  /**
   * Validate analytics.json structure
   */
  private validateAnalyticsData(data: unknown, errors: string[], _warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('analytics.json must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;
    if (!obj.summary) errors.push('analytics.json missing summary field');
    if (!Array.isArray(obj.marketplaces))
      errors.push('analytics.json marketplaces must be an array');
    if (!Array.isArray(obj.plugins)) errors.push('analytics.json plugins must be an array');
  }

  /**
   * Generate validation report
   */
  private generateReport(results: ValidationResult[]): DataValidationReport {
    const total = results.length;
    const passed = results.filter((r) => r.isValid).length;
    const failed = results.filter((r) => !r.isValid).length;
    const warnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      overallValid: failed === 0,
      files: results,
      summary: { total, passed, failed, warnings },
    };
  }

  /**
   * Print validation result for a single file
   */
  private printResult(result: ValidationResult): void {
    const icon = result.isValid ? '✅' : '❌';
    console.log(`${icon} ${result.file}`);

    if (result.errors.length > 0) {
      result.errors.forEach((error) => console.log(`   ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`   ⚠️  ${warning}`));
    }
  }

  /**
   * Print validation summary
   */
  private printSummary(report: DataValidationReport): void {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Validation Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files:   ${report.summary.total}`);
    console.log(`Passed:        ${report.summary.passed}`);
    console.log(`Failed:        ${report.summary.failed}`);
    console.log(`Warnings:      ${report.summary.warnings}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (report.overallValid) {
      console.log('');
      console.log('✅ All data files are valid!');
    } else {
      console.log('');
      console.log('❌ Validation failed! Please fix the errors above.');
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// CLI execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔍 Generated Data Validator');
  console.log(`Mode: ${dryRun ? 'Dry Run' : 'Production'}`);
  console.log('');

  try {
    const validator = new GeneratedDataValidator();
    const report = await validator.validateAll();

    if (dryRun) {
      console.log('');
      console.log('🔍 Dry run completed');
    }

    // Exit with error code if validation failed
    if (!report.overallValid) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

// Note: Exports are not used at runtime, script runs standalone
// but types are available for import if needed
export type { DataValidationReport, ValidationResult };
export { GeneratedDataValidator };
