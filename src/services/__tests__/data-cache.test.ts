/**
 * Tests for DataCache class
 */

class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private keys = new Set<string>();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.keys.add(key);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.keys.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    this.keys.clear();
  }

  delete(key: string): boolean {
    this.keys.delete(key);
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return [...this.keys];
  }
}

describe('DataCache', () => {
  let cache: DataCache;

  beforeEach(() => {
    cache = new DataCache();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      cache.set('test-key', { value: 'test-data' }, 1000);
      const result = cache.get('test-key');
      expect(result).toEqual({ value: 'test-data' });
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired entries and remove from keys', () => {
      cache.set('expired-key', { value: 'data' }, 1); // 1ms TTL
      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = cache.get('expired-key');
          expect(result).toBeNull();
          expect(cache.getKeys()).not.toContain('expired-key');
          resolve(null);
        }, 10);
      });
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return the number of entries', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key2', 'data2', 1000);
      expect(cache.size()).toBe(2);
    });

    it('should decrease when entry expires', () => {
      cache.set('key1', 'data1', 1);
      return new Promise((resolve) => {
        setTimeout(() => {
          cache.get('key1'); // Trigger expiration
          expect(cache.size()).toBe(0);
          resolve(null);
        }, 10);
      });
    });
  });

  describe('clear', () => {
    it('should clear all cache entries and keys', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key2', 'data2', 1000);
      expect(cache.size()).toBe(2);
      expect(cache.getKeys()).toHaveLength(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.getKeys()).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete existing entry and remove from keys', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key2', 'data2', 1000);
      expect(cache.size()).toBe(2);

      const deleted = cache.delete('key1');

      expect(deleted).toBe(true);
      expect(cache.size()).toBe(1);
      expect(cache.getKeys()).not.toContain('key1');
      expect(cache.getKeys()).toContain('key2');
    });

    it('should return false for non-existent key', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should handle deleting from empty cache', () => {
      const deleted = cache.delete('any-key');
      expect(deleted).toBe(false);
      expect(cache.size()).toBe(0);
    });
  });

  describe('getKeys', () => {
    it('should return empty array for empty cache', () => {
      expect(cache.getKeys()).toEqual([]);
    });

    it('should return all tracked keys', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key2', 'data2', 1000);
      cache.set('key3', 'data3', 1000);

      const keys = cache.getKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return a copy (not reference to internal Set)', () => {
      cache.set('key1', 'data1', 1000);
      const keys1 = cache.getKeys();
      const keys2 = cache.getKeys();

      expect(keys1).toEqual(keys2);
      expect(keys1).not.toBe(keys2); // Different array instances
    });

    it('should not include duplicate keys', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key1', 'data2', 1000); // Overwrite same key

      const keys = cache.getKeys();
      expect(keys).toHaveLength(1);
      expect(keys).toEqual(['key1']);
    });

    it('should remove keys when entries expire', () => {
      cache.set('key1', 'data1', 1);
      cache.set('key2', 'data2', 1000);

      return new Promise((resolve) => {
        setTimeout(() => {
          cache.get('key1'); // Trigger expiration
          const keys = cache.getKeys();
          expect(keys).toHaveLength(1);
          expect(keys).toContain('key2');
          expect(keys).not.toContain('key1');
          resolve(null);
        }, 10);
      });
    });

    it('should clear keys when cache is cleared', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key2', 'data2', 1000);
      expect(cache.getKeys()).toHaveLength(2);

      cache.clear();

      expect(cache.getKeys()).toEqual([]);
    });

    it('should remove keys when entry is deleted', () => {
      cache.set('key1', 'data1', 1000);
      cache.set('key2', 'data2', 1000);
      expect(cache.getKeys()).toHaveLength(2);

      cache.delete('key1');

      expect(cache.getKeys()).toHaveLength(1);
      expect(cache.getKeys()).toContain('key2');
      expect(cache.getKeys()).not.toContain('key1');
    });
  });

  describe('key tracking lifecycle', () => {
    it('should track keys on set, remove on expire, and clear on clear', () => {
      // Initial state
      expect(cache.getKeys()).toEqual([]);

      // Add keys
      cache.set('key1', 'data1', 1000);
      expect(cache.getKeys()).toContain('key1');

      cache.set('key2', 'data2', 1000);
      expect(cache.getKeys()).toContain('key2');

      expect(cache.getKeys()).toHaveLength(2);

      // Delete key
      cache.delete('key1');
      expect(cache.getKeys()).toHaveLength(1);
      expect(cache.getKeys()).not.toContain('key1');

      // Clear all
      cache.clear();
      expect(cache.getKeys()).toEqual([]);
    });
  });
});
