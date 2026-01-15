#!/usr/bin/env npx ts-node

/**
 * Data Backup Script
 *
 * This script creates automated backups of all JSON data files
 * with versioning, compression, and integrity checks.
 */

import fs from 'fs';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

interface BackupConfig {
  sourceDir: string;
  backupDir: string;
  maxBackups: number;
  compress: boolean;
  checksum: boolean;
  github: {
    enabled: boolean;
    token: string;
    repo: string;
    branch: string;
  };
}

interface BackupInfo {
  id: string;
  timestamp: string;
  version: string;
  size: number;
  compressedSize?: number;
  checksum?: string;
  files: string[];
  metadata: {
    totalMarketplaces: number;
    totalPlugins: number;
    totalStars: number;
    lastScan: string;
    scanDuration: number;
  };
}

class DataBackupManager {
  private config: BackupConfig;
  private backupInfo: BackupInfo[] = [];

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      sourceDir: path.join(process.cwd(), 'public', 'data'),
      backupDir: path.join(process.cwd(), 'backups'),
      maxBackups: 30, // Keep 30 days of backups
      compress: true,
      checksum: true,
      github: {
        enabled: false,
        token: process.env.GITHUB_TOKEN || '',
        repo: process.env.GITHUB_REPOSITORY || 'claude-marketplace/aggregator',
        branch: 'main',
      },
      ...config,
    };

    this.ensureDirectories();
    this.loadBackupInfo();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.config.backupDir}`);
    }

    const dailyDir = path.join(this.config.backupDir, 'daily');
    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir, { recursive: true });
    }

    const weeklyDir = path.join(this.config.backupDir, 'weekly');
    if (!fs.existsSync(weeklyDir)) {
      fs.mkdirSync(weeklyDir, { recursive: true });
    }

    const monthlyDir = path.join(this.config.backupDir, 'monthly');
    if (!fs.existsSync(monthlyDir)) {
      fs.mkdirSync(monthlyDir, { recursive: true });
    }
  }

  private loadBackupInfo(): void {
    const infoPath = path.join(this.config.backupDir, 'backups.json');
    if (fs.existsSync(infoPath)) {
      try {
        const data = fs.readFileSync(infoPath, 'utf8');
        this.backupInfo = JSON.parse(data);
      } catch (error) {
        console.warn('⚠️ Failed to load backup info:', error);
        this.backupInfo = [];
      }
    }
  }

  private saveBackupInfo(): void {
    const infoPath = path.join(this.config.backupDir, 'backups.json');
    try {
      fs.writeFileSync(infoPath, JSON.stringify(this.backupInfo, null, 2));
    } catch (error) {
      console.error('❌ Failed to save backup info:', error);
    }
  }

  private calculateChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  private async compressFile(inputPath: string, outputPath: string): Promise<number> {
    const gzip = createGzip();
    const source = fs.createReadStream(inputPath);
    const destination = fs.createWriteStream(outputPath);

    await pipeline(source, gzip, destination);

    const stats = fs.statSync(outputPath);
    return stats.size;
  }

  private async createBackup(): Promise<BackupInfo> {
    console.log('🔄 Starting backup process...');

    const timestamp = new Date().toISOString();
    const backupId = `backup-${timestamp.replace(/[:.]/g, '-')}`;
    const backupPath = path.join(this.config.backupDir, 'daily', backupId);

    // Create backup directory
    fs.mkdirSync(backupPath, { recursive: true });

    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp,
      version: this.getVersion(),
      size: 0,
      files: [],
      metadata: {
        totalMarketplaces: 0,
        totalPlugins: 0,
        totalStars: 0,
        lastScan: '',
        scanDuration: 0,
      },
    };

    try {
      // Find all JSON files in source directory
      const files = this.findJsonFiles(this.config.sourceDir);

      console.log(`📄 Found ${files.length} files to backup`);

      // Backup each file
      for (const file of files) {
        const relativePath = path.relative(this.config.sourceDir, file);
        const backupFilePath = path.join(backupPath, relativePath);

        // Ensure directory exists
        const backupFileDir = path.dirname(backupFilePath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }

        if (this.config.compress) {
          // Create compressed backup
          const compressedPath = `${backupFilePath}.gz`;
          const compressedSize = await this.compressFile(file, compressedPath);
          backupInfo.compressedSize = (backupInfo.compressedSize || 0) + compressedSize;
          backupInfo.files.push(`${relativePath}.gz`);

          // Calculate checksum of original file
          if (this.config.checksum) {
            const checksum = this.calculateChecksum(file);
            const checksumPath = `${backupFilePath}.sha256`;
            fs.writeFileSync(checksumPath, checksum);
            backupInfo.files.push(`${relativePath}.sha256`);
          }
        } else {
          // Create uncompressed backup
          fs.copyFileSync(file, backupFilePath);
          backupInfo.files.push(relativePath);
        }

        const stats = fs.statSync(file);
        backupInfo.size += stats.size;
      }

      // Extract metadata from index.json if available
      const indexPath = path.join(this.config.sourceDir, 'index.json');
      if (fs.existsSync(indexPath)) {
        try {
          const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
          if (indexData.stats) {
            backupInfo.metadata = {
              ...backupInfo.metadata,
              totalMarketplaces: indexData.stats.totalMarketplaces || 0,
              totalPlugins: indexData.stats.totalPlugins || 0,
              totalStars: indexData.stats.totalStars || 0,
            };
          }
          if (indexData.metadata) {
            backupInfo.metadata.lastScan = indexData.metadata.lastScan || '';
            backupInfo.metadata.scanDuration = indexData.metadata.scanDuration || 0;
          }
        } catch (error) {
          console.warn('⚠️ Failed to extract metadata from index.json:', error);
        }
      }

      // Save backup metadata
      const metadataPath = path.join(backupPath, 'backup-info.json');
      fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2));

      // Create checksum for entire backup
      if (this.config.checksum) {
        const backupChecksum = this.calculateChecksum(metadataPath);
        const checksumPath = path.join(backupPath, 'backup-checksum.sha256');
        fs.writeFileSync(checksumPath, backupChecksum);
      }

      console.log(`✅ Backup completed: ${backupId}`);
      console.log(`📊 Size: ${this.formatBytes(backupInfo.size)}`);
      if (backupInfo.compressedSize) {
        console.log(
          `📦 Compressed: ${this.formatBytes(backupInfo.compressedSize)} (${Math.round((1 - backupInfo.compressedSize / backupInfo.size) * 100)}% reduction)`
        );
      }

      return backupInfo;
    } catch (error) {
      // Cleanup failed backup
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  private findJsonFiles(dir: string): string[] {
    const files: string[] = [];

    function scanDirectory(currentDir: string): void {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stats.isFile() && item.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory(dir);
    return files;
  }

  private getVersion(): string {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...');

    const dailyDir = path.join(this.config.backupDir, 'daily');
    const weeklyDir = path.join(this.config.backupDir, 'weekly');
    const monthlyDir = path.join(this.config.backupDir, 'monthly');

    // Clean daily backups (keep last 7 days)
    await this.cleanupDirectory(dailyDir, 7);

    // Create weekly backup (keep last 4 weeks)
    await this.createWeeklyBackup();
    await this.cleanupDirectory(weeklyDir, 4);

    // Create monthly backup (keep last 12 months)
    await this.createMonthlyBackup();
    await this.cleanupDirectory(monthlyDir, 12);
  }

  private async cleanupDirectory(dir: string, keepCount: number): Promise<void> {
    try {
      const items = fs
        .readdirSync(dir)
        .map((item) => {
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);
          return { name: item, path: itemPath, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const itemsToDelete = items.slice(keepCount);

      for (const item of itemsToDelete) {
        fs.rmSync(item.path, { recursive: true, force: true });
        console.log(`🗑️ Deleted old backup: ${item.name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup directory ${dir}:`, error);
    }
  }

  private async createWeeklyBackup(): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekId = `weekly-${weekStart.toISOString().split('T')[0]}`;
    const weeklyDir = path.join(this.config.backupDir, 'weekly');
    const weeklyPath = path.join(weeklyDir, weekId);

    // Check if weekly backup already exists
    if (fs.existsSync(weeklyPath)) {
      return;
    }

    // Find the most recent daily backup from this week
    const dailyDir = path.join(this.config.backupDir, 'daily');
    const dailyBackups = fs
      .readdirSync(dailyDir)
      .map((item) => {
        const itemPath = path.join(dailyDir, item);
        const stats = fs.statSync(itemPath);
        return { name: item, path: itemPath, mtime: stats.mtime };
      })
      .filter((item) => item.mtime >= weekStart)
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (dailyBackups.length > 0) {
      const latestBackup = dailyBackups[0];
      fs.cpSync(latestBackup.path, weeklyPath, { recursive: true });
      console.log(`📅 Created weekly backup: ${weekId}`);
    }
  }

  private async createMonthlyBackup(): Promise<void> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthId = `monthly-${monthStart.toISOString().slice(0, 7)}`;
    const monthlyDir = path.join(this.config.backupDir, 'monthly');
    const monthlyPath = path.join(monthlyDir, monthId);

    // Check if monthly backup already exists
    if (fs.existsSync(monthlyPath)) {
      return;
    }

    // Find the most recent weekly backup from this month
    const weeklyDir = path.join(this.config.backupDir, 'weekly');
    const weeklyBackups = fs
      .readdirSync(weeklyDir)
      .map((item) => {
        const itemPath = path.join(weeklyDir, item);
        const stats = fs.statSync(itemPath);
        return { name: item, path: itemPath, mtime: stats.mtime };
      })
      .filter((item) => item.mtime >= monthStart)
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (weeklyBackups.length > 0) {
      const latestBackup = weeklyBackups[0];
      fs.cpSync(latestBackup.path, monthlyPath, { recursive: true });
      console.log(`📅 Created monthly backup: ${monthId}`);
    }
  }

  private async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      const checksumPath = path.join(backupPath, 'backup-checksum.sha256');
      const metadataPath = path.join(backupPath, 'backup-info.json');

      if (!fs.existsSync(checksumPath) || !fs.existsSync(metadataPath)) {
        console.warn('⚠️ Backup verification files missing');
        return false;
      }

      const expectedChecksum = fs.readFileSync(checksumPath, 'utf8').trim();
      const actualChecksum = this.calculateChecksum(metadataPath);

      if (expectedChecksum !== actualChecksum) {
        console.error('❌ Backup checksum verification failed');
        return false;
      }

      console.log('✅ Backup verification passed');
      return true;
    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      return false;
    }
  }

  public async runBackup(): Promise<void> {
    try {
      console.log('🚀 Starting data backup process...');
      console.log(`📁 Source: ${this.config.sourceDir}`);
      console.log(`💾 Destination: ${this.config.backupDir}`);

      // Create backup
      const backupInfo = await this.createBackup();

      // Verify backup
      const backupPath = path.join(this.config.backupDir, 'daily', backupInfo.id);
      const isVerified = await this.verifyBackup(backupPath);

      if (!isVerified) {
        throw new Error('Backup verification failed');
      }

      // Add to backup info
      this.backupInfo.push(backupInfo);
      this.saveBackupInfo();

      // Cleanup old backups
      await this.cleanupOldBackups();

      // Update backup info
      this.backupInfo = this.backupInfo.slice(-this.config.maxBackups);
      this.saveBackupInfo();

      console.log('✅ Backup process completed successfully');
    } catch (error) {
      console.error('❌ Backup process failed:', error);
      throw error;
    }
  }

  public async restoreBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.config.backupDir, 'daily', backupId);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    // Verify backup before restore
    const isVerified = await this.verifyBackup(backupPath);
    if (!isVerified) {
      throw new Error('Backup verification failed');
    }

    console.log(`🔄 Restoring backup: ${backupId}`);

    // Backup current data before restore
    const currentBackup = await this.createBackup();
    console.log(`💾 Current data backed up as: ${currentBackup.id}`);

    // Restore files
    const restorePath = this.config.sourceDir;
    const backupFiles = this.findJsonFiles(backupPath);

    for (const file of backupFiles) {
      if (file.endsWith('.json')) {
        const relativePath = path.relative(backupPath, file);
        const targetPath = path.join(restorePath, relativePath);

        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(file, targetPath);
        console.log(`📄 Restored: ${relativePath}`);
      }
    }

    console.log('✅ Restore completed successfully');
  }

  public listBackups(): BackupInfo[] {
    return this.backupInfo.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

// CLI interface
async function main(): Promise<void> {
  const command = process.argv[2];
  const backupId = process.argv[3];

  const backupManager = new DataBackupManager();

  try {
    switch (command) {
      case 'backup':
        await backupManager.runBackup();
        break;

      case 'restore':
        if (!backupId) {
          console.error('❌ Backup ID required for restore');
          process.exit(1);
        }
        await backupManager.restoreBackup(backupId);
        break;

      case 'list':
        const backups = backupManager.listBackups();
        console.log('📋 Available backups:');
        backups.forEach((backup) => {
          console.log(
            `  ${backup.id} - ${backup.timestamp} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`
          );
        });
        break;

      default:
        console.log('Usage: npm run backup [command]');
        console.log('Commands:');
        console.log('  backup  - Create a new backup');
        console.log('  restore <id> - Restore from backup');
        console.log('  list    - List available backups');
        break;
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default DataBackupManager;
