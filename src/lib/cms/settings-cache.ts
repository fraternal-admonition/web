/**
 * Settings cache service
 * Provides in-memory caching for CMS settings with automatic expiration
 */

import { SETTINGS_SCHEMA } from './settings-schema';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Simplified settings structure for caching
 * Only includes the actual values, not the full SettingValue structure
 */
export interface CachedSettings {
  site_name: string;
  maintenance_mode: boolean;
  site_lock_mode: 'off' | 'auth' | 'password';
  site_lock_password_hash: string;
  max_upload_size_mb: number;
  contact_email: string;
}

interface CacheEntry {
  data: CachedSettings;
  timestamp: number;
}

/**
 * Settings cache class
 * Implements cache-aside pattern with TTL-based expiration
 */
class SettingsCache {
  private cache: CacheEntry | null = null;
  private readonly TTL = 10 * 1000; // 10 seconds - short TTL for quick updates

  /**
   * Get settings from cache or database
   * Returns cached settings if available and not expired
   * Otherwise fetches from database and updates cache
   */
  async get(): Promise<CachedSettings> {
    // Check if cache exists and is not expired
    if (this.cache && !this.isExpired()) {
      return this.cache.data;
    }

    // Cache miss or expired - fetch from database
    try {
      const settings = await this.fetchFromDatabase();
      this.cache = {
        data: settings,
        timestamp: Date.now(),
      };
      return settings;
    } catch (error) {
      console.error('Failed to load settings from database:', error);
      // Return defaults from schema on error
      return this.getDefaults();
    }
  }

  /**
   * Invalidate the cache
   * Forces next get() call to fetch fresh data from database
   */
  invalidate(): void {
    this.cache = null;
  }

  /**
   * Check if cache is expired based on TTL
   */
  private isExpired(): boolean {
    if (!this.cache) return true;
    return Date.now() - this.cache.timestamp > this.TTL;
  }


  /**
   * Fetch settings from database and merge with schema defaults
   */
  private async fetchFromDatabase(): Promise<CachedSettings> {
    const supabase = await createAdminClient();

    // Fetch all settings from database
    const { data: dbSettings, error } = await supabase
      .from('cms_settings')
      .select('key, value_json')
      .order('key');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Create a map of database values for quick lookup
    const dbMap = new Map(
      (dbSettings || []).map(s => [s.key, s.value_json])
    );

    // Build settings object by merging database values with schema defaults
    const settings: CachedSettings = {
      site_name: this.getSettingValue('site_name', dbMap),
      maintenance_mode: this.getSettingValue('maintenance_mode', dbMap),
      site_lock_mode: this.getSettingValue('site_lock_mode', dbMap),
      site_lock_password_hash: this.getSettingValue('site_lock_password_hash', dbMap),
      max_upload_size_mb: this.getSettingValue('max_upload_size_mb', dbMap),
      contact_email: this.getSettingValue('contact_email', dbMap),
    };

    return settings;
  }

  /**
   * Get a setting value from database map or fall back to schema default
   */
  private getSettingValue<K extends keyof CachedSettings>(
    key: K,
    dbMap: Map<string, unknown>
  ): CachedSettings[K] {
    // Check if value exists in database
    if (dbMap.has(key)) {
      return dbMap.get(key) as CachedSettings[K];
    }

    // Fall back to default from schema
    const definition = SETTINGS_SCHEMA.find(s => s.key === key);
    return (definition?.defaultValue ?? this.getHardcodedDefault(key)) as CachedSettings[K];
  }

  /**
   * Get default values from schema
   * Used as fallback when database is unavailable
   */
  private getDefaults(): CachedSettings {
    return {
      site_name: 'Fraternal Admonition',
      maintenance_mode: false,
      site_lock_mode: 'off',
      site_lock_password_hash: '',
      max_upload_size_mb: 10,
      contact_email: '',
    };
  }

  /**
   * Hardcoded defaults as last resort
   * Used if schema is somehow unavailable
   */
  private getHardcodedDefault<K extends keyof CachedSettings>(
    key: K
  ): CachedSettings[K] {
    const defaults = this.getDefaults();
    return defaults[key];
  }
}

// Export singleton instance
export const settingsCache = new SettingsCache();
