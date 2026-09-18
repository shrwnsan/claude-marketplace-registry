#!/usr/bin/env ts-node

/**
 * Plugin Validator
 *
 * This script validates plugins from discovered marketplaces
 * and extracts plugin metadata.
 */

import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

/**
 * Normalize an author value from a manifest (string or {name|login,email}).
 */
function normalizeAuthor(author: unknown): string {
  if (typeof author === 'string') return author.trim();
  if (author && typeof author === 'object') {
    const a = author as { name?: string; login?: string };
    return (a.name || a.login || '').trim();
  }
  return '';
}

/**
 * The GitHub user/org that publishes the marketplace repo — the honest
 * fallback when a plugin entry carries no author of its own.
 */
function ownerFromUrl(url: string): string {
  const match = url?.match(/github\.com\/([^/]+)/);
  return match ? match[1] : '';
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repository: string;
  manifestPath: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: any;
}

interface ValidationResult {
  totalPlugins: number;
  validPlugins: number;
  invalidPlugins: number;
  validationDate: string;
  errors: string[];
  warnings: string[];
}

class PluginValidator {
  private octokit: Octokit;
  private outputDir: string;
  private inputDir: string;
  private strictMode: boolean;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'claude-marketplace-aggregator/1.0.0',
    });

    this.inputDir = path.join(process.cwd(), 'data', 'marketplaces');
    this.outputDir = path.join(process.cwd(), 'data', 'plugins');
    this.strictMode = process.env.VALIDATION_STRICT_MODE === 'true';

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async validateAllPlugins(): Promise<ValidationResult> {
    console.log('🔍 Starting plugin validation...');

    const result: ValidationResult = {
      totalPlugins: 0,
      validPlugins: 0,
      invalidPlugins: 0,
      validationDate: new Date().toISOString(),
      errors: [],
      warnings: [],
    };

    try {
      // Load marketplace data
      const marketplaces = this.loadMarketplaceData();
      console.log(`📁 Loaded ${marketplaces.length} marketplaces`);

      const allPlugins: Plugin[] = [];

      for (const marketplace of marketplaces) {
        try {
          const plugins = await this.validateMarketplacePlugins(marketplace);
          allPlugins.push(...plugins);
          console.log(`✅ Validated ${plugins.length} plugins from ${marketplace.name}`);
        } catch (error) {
          console.error(`❌ Error validating plugins from ${marketplace.name}:`, error);
          result.errors.push(`Failed to validate ${marketplace.name}: ${error}`);
        }
      }

      result.totalPlugins = allPlugins.length;
      result.validPlugins = allPlugins.filter((p) => p.isValid).length;
      result.invalidPlugins = allPlugins.filter((p) => !p.isValid).length;

      // Save results
      await this.saveValidationResults(allPlugins, result);

      console.log('');
      console.log('🎉 Validation complete!');
      console.log(`📊 Total plugins: ${result.totalPlugins}`);
      console.log(`✅ Valid plugins: ${result.validPlugins}`);
      console.log(`❌ Invalid plugins: ${result.invalidPlugins}`);

      return result;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  private loadMarketplaceData(): any[] {
    const processedDataPath = path.join(this.inputDir, 'processed.json');

    if (!fs.existsSync(processedDataPath)) {
      throw new Error(`Marketplace data not found at ${processedDataPath}`);
    }

    const data = JSON.parse(fs.readFileSync(processedDataPath, 'utf-8'));
    return data.filter((mp: any) => mp.hasManifest);
  }

  private async validateMarketplacePlugins(marketplace: any): Promise<Plugin[]> {
    const plugins: Plugin[] = [];

    if (!marketplace.manifest) {
      console.log(`ℹ️ No manifest for ${marketplace.name}`);
      return plugins;
    }

    try {
      // Parse repository URL to get owner and repo
      const urlParts = marketplace.url.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      // Fetch the actual manifest file
      const manifest = await this.fetchManifest(owner, repo);

      if (manifest && manifest.plugins) {
        for (const plugin of manifest.plugins) {
          const validatedPlugin = await this.validatePlugin(plugin, marketplace);
          plugins.push(validatedPlugin);
        }
      }

      // Also check for plugin directories
      await this.scanPluginDirectories(owner, repo, plugins);
    } catch (error) {
      console.error(`Error processing ${marketplace.name}:`, error);
    }

    return plugins;
  }

  private async validatePlugin(plugin: any, marketplace: any): Promise<Plugin> {
    const validatedPlugin: Plugin = {
      id: plugin.id || plugin.name || '',
      name: plugin.name || '',
      description: plugin.description || '',
      version: plugin.version || '1.0.0',
      author: normalizeAuthor(plugin.author) || ownerFromUrl(marketplace.url) || marketplace.name,
      repository: marketplace.url,
      manifestPath: plugin.manifestPath || '',
      isValid: true,
      errors: [],
      warnings: [],
      metadata: plugin,
    };

    // Validation checks
    if (!validatedPlugin.name) {
      validatedPlugin.errors.push('Plugin name is required');
      validatedPlugin.isValid = false;
    }

    if (!validatedPlugin.description) {
      validatedPlugin.warnings.push('Plugin description is missing');
    }

    if (!validatedPlugin.version) {
      validatedPlugin.warnings.push('Plugin version is not specified');
    }

    if (!validatedPlugin.author) {
      validatedPlugin.warnings.push('Plugin author is not specified');
    }

    // Strict mode checks
    if (this.strictMode) {
      if (!validatedPlugin.id) {
        validatedPlugin.errors.push('Plugin ID is required in strict mode');
        validatedPlugin.isValid = false;
      }

      if (validatedPlugin.warnings.length > 0) {
        validatedPlugin.isValid = false;
      }
    }

    return validatedPlugin;
  }

  private async scanPluginDirectories(
    owner: string,
    repo: string,
    plugins: Plugin[]
  ): Promise<void> {
    const possiblePaths = ['plugins/', '.claude-plugin/plugins/', 'claude-plugins/', 'extensions/'];

    for (const dirPath of possiblePaths) {
      try {
        const contents = await this.octokit.repos.getContent({
          owner,
          repo,
          path: dirPath,
        });

        if (Array.isArray(contents.data)) {
          for (const item of contents.data) {
            if (item.type === 'dir') {
              await this.scanPluginDirectory(owner, repo, item.name, plugins);
            }
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
  }

  private async scanPluginDirectory(
    owner: string,
    repo: string,
    pluginDir: string,
    plugins: Plugin[]
  ): Promise<void> {
    try {
      const pluginManifestPath = `${pluginDir}/plugin.json`;
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: pluginManifestPath,
      });

      if ('content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        const pluginData = JSON.parse(content);

        const plugin: Plugin = {
          id: pluginData.id || pluginDir,
          name: pluginData.name || pluginDir,
          description: pluginData.description || '',
          version: pluginData.version || '1.0.0',
          author: normalizeAuthor(pluginData.author) || owner,
          repository: `https://github.com/${owner}/${repo}`,
          manifestPath: pluginManifestPath,
          isValid: true,
          errors: [],
          warnings: [],
          metadata: pluginData,
        };

        plugins.push(plugin);
      }
    } catch {
      // Plugin doesn't have a manifest, skip
    }
  }

  private async fetchManifest(owner: string, repo: string): Promise<any | null> {
    const manifestPaths = [
      '.claude-plugin/marketplace.json',
      'marketplace.json',
      'claude-marketplace.json',
    ];

    for (const manifestPath of manifestPaths) {
      try {
        const response = await this.octokit.repos.getContent({
          owner,
          repo,
          path: manifestPath,
        });

        if ('content' in response.data) {
          const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
          return JSON.parse(content);
        }
      } catch {
        // Continue to next path
      }
    }

    return null;
  }

  private async saveValidationResults(plugins: Plugin[], result: ValidationResult): Promise<void> {
    console.log('💾 Saving validation results...');

    // Save all plugins
    const allPluginsPath = path.join(this.outputDir, 'all-plugins.json');
    fs.writeFileSync(allPluginsPath, JSON.stringify(plugins, null, 2));

    // Save valid plugins only
    const validPlugins = plugins.filter((p) => p.isValid);
    const validPluginsPath = path.join(this.outputDir, 'valid-plugins.json');
    fs.writeFileSync(validPluginsPath, JSON.stringify(validPlugins, null, 2));

    // Save invalid plugins with errors
    const invalidPlugins = plugins.filter((p) => !p.isValid);
    const invalidPluginsPath = path.join(this.outputDir, 'invalid-plugins.json');
    fs.writeFileSync(invalidPluginsPath, JSON.stringify(invalidPlugins, null, 2));

    // Save summary
    const summaryPath = path.join(this.outputDir, 'validation-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(result, null, 2));

    // Save statistics
    const stats = {
      totalPlugins: result.totalPlugins,
      validPlugins: result.validPlugins,
      invalidPlugins: result.invalidPlugins,
      validationRate:
        result.totalPlugins > 0
          ? ((result.validPlugins / result.totalPlugins) * 100).toFixed(2)
          : 0,
      errors: result.errors,
      warnings: result.warnings,
      commonErrors: this.getCommonErrors(invalidPlugins),
      topAuthors: this.getTopAuthors(validPlugins),
      pluginTypes: this.getPluginTypes(plugins),
    };

    const statsPath = path.join(this.outputDir, 'stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    console.log(`✅ Results saved to ${this.outputDir}`);
  }

  private getCommonErrors(invalidPlugins: Plugin[]): Record<string, number> {
    const errors: Record<string, number> = {};

    for (const plugin of invalidPlugins) {
      for (const error of plugin.errors) {
        errors[error] = (errors[error] || 0) + 1;
      }
    }

    return errors;
  }

  private getTopAuthors(plugins: Plugin[]): Array<{ author: string; count: number }> {
    const authorCount: Record<string, number> = {};

    for (const plugin of plugins) {
      authorCount[plugin.author] = (authorCount[plugin.author] || 0) + 1;
    }

    return Object.entries(authorCount)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getPluginTypes(plugins: Plugin[]): Record<string, number> {
    const types: Record<string, number> = {};

    for (const plugin of plugins) {
      const type = plugin.metadata.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    }

    return types;
  }
}

// CLI execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔍 Claude Plugin Validator');
  console.log(`Mode: ${dryRun ? 'Dry Run' : 'Production'}`);
  console.log(`Strict mode: ${process.env.VALIDATION_STRICT_MODE === 'true'}`);
  console.log('');

  if (!process.env.GITHUB_TOKEN && !dryRun) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const validator = new PluginValidator();

    if (dryRun) {
      console.log('🔍 Dry run: Would validate plugins...');
      console.log('📊 Expected output: plugin validation reports');
      console.log('✅ Dry run completed successfully');
      return;
    }

    const result = await validator.validateAllPlugins();

    console.log('');
    console.log('🎉 Validation completed successfully!');
    console.log(
      `📊 Validation rate: ${((result.validPlugins / result.totalPlugins) * 100).toFixed(2)}%`
    );

    if (result.errors.length > 0) {
      console.log('');
      console.log('⚠️ Errors encountered:');
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
