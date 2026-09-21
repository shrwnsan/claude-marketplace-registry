#!/usr/bin/env ts-node

/**
 * Generated Data Validator
 *
 * Validates the generated data files before they are committed to the repository.
 * This ensures data integrity and catches issues early in the pipeline.
 */

import fs from 'fs';
import path from 'path';

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

    const crossFileResult = this.validateCrossFileConsistency();
    results.push(crossFileResult);
    this.printResult(crossFileResult);

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
      const generatedFiles = ['marketplaces.json', 'plugins.json', 'stats.json'];

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
      // Read file content and stats atomically to avoid TOCTOU race condition
      let content: string;
      let stats: fs.Stats;
      try {
        stats = fs.statSync(filePath);
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (readError) {
        const err = readError as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          return {
            isValid: false,
            errors: ['File does not exist'],
            warnings: [],
            file: relativePath,
          };
        }
        return {
          isValid: false,
          errors: [`Cannot read file: ${err.message}`],
          warnings: [],
          file: relativePath,
        };
      }

      // Check file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        errors.push(
          `File size (${this.formatBytes(stats.size)}) exceeds maximum (${this.formatBytes(maxSize)})`
        );
      }
      if (stats.size === 0) {
        errors.push('File is empty');
      }

      // Parse JSON
      let data: unknown;
      try {
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
   *
   * Supports both flat stats format and EcosystemStatsResponse wrapper:
   *   { success: true, data: { overview: { totalMarketplaces, totalPlugins, ... } } }
   */
  private validateStatsData(data: unknown, errors: string[], warnings: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('Stats must be an object');
      return;
    }

    const obj = data as Record<string, unknown>;

    // Check for EcosystemStatsResponse wrapper format
    if ('success' in obj && 'data' in obj) {
      if (typeof obj.success !== 'boolean') {
        errors.push('EcosystemStatsResponse success must be a boolean');
      }
      if (!obj.data || typeof obj.data !== 'object') {
        errors.push('EcosystemStatsResponse data must be an object');
        return;
      }
      const dataObj = obj.data as Record<string, unknown>;
      if (!dataObj.overview || typeof dataObj.overview !== 'object') {
        errors.push('EcosystemStatsResponse data.overview must be an object');
        return;
      }
      // Validate the overview fields as stats
      this.validateStatsObject(dataObj.overview, errors, warnings);
      return;
    }

    // Flat stats format
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
   * Validate the per-marketplace plugin shards in public/data/plugins/.
   * Each *.json file must be an array of records that all have an id and
   * isValid, and every record's metadata.marketplaceId must match the shard's
   * filename — a mismatch means the shard grouping diverged from the index.
   */
  private validatePluginShards(): string[] {
    const errors: string[] = [];
    const shardsDir = path.join(this.publicDataDir, 'plugins');

    if (!fs.existsSync(shardsDir)) return errors;

    for (const file of fs.readdirSync(shardsDir)) {
      if (!file.endsWith('.json')) continue;
      const shardId = file.replace(/\.json$/, '');
      const shardPath = path.join(shardsDir, file);

      let parsed: unknown;
      try {
        parsed = JSON.parse(fs.readFileSync(shardPath, 'utf-8'));
      } catch (parseError) {
        errors.push(`plugin shard ${file} is not valid JSON: ${(parseError as Error).message}`);
        continue;
      }
      if (!Array.isArray(parsed)) {
        errors.push(`plugin shard ${file} must be a JSON array`);
        continue;
      }

      let missingFields = 0;
      let wrongMarketplace = 0;
      let firstMismatch = '';
      for (let i = 0; i < parsed.length; i++) {
        const record = parsed[i] as Record<string, unknown>;
        const meta = record?.metadata as Record<string, unknown> | undefined;
        if (!record?.id || typeof record.isValid !== 'boolean') {
          missingFields++;
          if (!firstMismatch) {
            firstMismatch = `record at index ${i} missing id or isValid`;
          }
        } else if (String(meta?.marketplaceId) !== shardId) {
          wrongMarketplace++;
          if (!firstMismatch) {
            firstMismatch = `record at index ${i} has metadata.marketplaceId '${String(
              meta?.marketplaceId
            )}' != shard id '${shardId}'`;
          }
        }
      }
      if (missingFields > 0) {
        errors.push(
          `plugin shard ${file}: ${missingFields} of ${parsed.length} records missing id or isValid (${firstMismatch})`
        );
      }
      if (wrongMarketplace > 0) {
        errors.push(
          `plugin shard ${file}: ${wrongMarketplace} of ${parsed.length} records have a metadata.marketplaceId that does not match the filename (${firstMismatch})`
        );
      }
    }

    return errors;
  }

  /**
   * Cross-file consistency checks that single-file validation cannot catch:
   * - every plugin must reference a known marketplace (catches ID-format drift)
   * - stats counts must match the actual data (catches hardcoded/stale summaries)
   * - generated data must not be months old (catches frozen-pipeline failures)
   * - per-marketplace plugin shards must be well-formed and self-consistent
   */
  private validateCrossFileConsistency(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const file = 'cross-file consistency';

    try {
      // 0. Plugin shards (independent of the index files)
      errors.push(...this.validatePluginShards());

      const marketplacesPath = path.join(this.generatedDir, 'marketplaces.json');
      const pluginsPath = path.join(this.generatedDir, 'plugins.json');
      const statsPath = path.join(this.generatedDir, 'stats.json');

      if (!fs.existsSync(marketplacesPath) || !fs.existsSync(pluginsPath)) {
        warnings.push('marketplaces.json/plugins.json not found; skipping cross-file checks');
        return { isValid: true, errors, warnings, file };
      }

      const readArray = (filePath: string): Array<Record<string, unknown>> => {
        const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
      };
      const marketplaces = readArray(marketplacesPath);
      const plugins = readArray(pluginsPath);

      // 1. Referential integrity: plugin marketplaceId must resolve
      const marketplaceIds = new Set(marketplaces.map((m) => String(m.id)));
      const orphaned = plugins.filter((p) => {
        const meta = p.metadata as Record<string, unknown> | undefined;
        const mid = meta?.marketplaceId ?? p.marketplaceId;
        return mid === undefined || !marketplaceIds.has(String(mid));
      }).length;
      if (orphaned > 0) {
        errors.push(
          `${orphaned} of ${plugins.length} plugins reference a marketplaceId not present in marketplaces`
        );
      }

      // 2. Stats counts must match actual data
      if (fs.existsSync(statsPath)) {
        const statsRaw = JSON.parse(fs.readFileSync(statsPath, 'utf-8')) as Record<string, any>;
        const overview = (statsRaw?.data?.overview ?? statsRaw) as Record<string, unknown>;

        if (overview && typeof overview === 'object') {
          if (
            typeof overview.totalMarketplaces === 'number' &&
            overview.totalMarketplaces !== marketplaces.length
          ) {
            errors.push(
              `stats totalMarketplaces (${overview.totalMarketplaces}) != actual marketplace count (${marketplaces.length})`
            );
          }
          if (
            typeof overview.totalPlugins === 'number' &&
            overview.totalPlugins !== plugins.length
          ) {
            errors.push(
              `stats totalPlugins (${overview.totalPlugins}) != actual plugin count (${plugins.length})`
            );
          }
        }

        // 3. Freshness: fail on months-old data, warn on weeks-old data
        const lastUpdated =
          statsRaw?.meta?.lastUpdated ?? overview?.lastUpdated ?? statsRaw?.lastUpdated;
        if (typeof lastUpdated === 'string') {
          const ageDays = (Date.now() - new Date(lastUpdated).getTime()) / 86400000;
          if (ageDays > 90) {
            errors.push(
              `generated data is ${Math.floor(ageDays)} days old — pipeline output is stale`
            );
          } else if (ageDays > 7) {
            warnings.push(`generated data is ${Math.floor(ageDays)} days old`);
          }
        }
      }
    } catch (error) {
      errors.push(`Cross-file validation error: ${(error as Error).message}`);
    }

    return { isValid: errors.length === 0, errors, warnings, file };
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
