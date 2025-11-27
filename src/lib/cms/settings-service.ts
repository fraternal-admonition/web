/**
 * Service layer for CMS settings
 * Handles fetching, validation, and merging of settings with schema
 */

import { SETTINGS_SCHEMA } from './settings-schema';
import { SettingDefinition, SettingValue } from './setting-types';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Fetches all settings and merges them with schema definitions
 * Returns settings with their current values or defaults
 */
export async function getAllSettings(): Promise<SettingValue[]> {
  const supabase = await createAdminClient();
  
  // Fetch all settings from database
  const { data: dbSettings } = await supabase
    .from('cms_settings')
    .select('*')
    .order('key');
  
  // Create a map of database values for quick lookup
  const dbMap = new Map(
    (dbSettings || []).map(s => [
      s.key,
      { value: s.value_json, updatedAt: s.updated_at }
    ])
  );
  
  // Merge schema with database values
  return SETTINGS_SCHEMA.map(definition => {
    const dbValue = dbMap.get(definition.key);
    return {
      key: definition.key,
      value: dbValue?.value ?? definition.defaultValue,
      definition,
      isDefault: !dbValue,
      updatedAt: dbValue?.updatedAt,
    };
  });
}

/**
 * Fetches a single setting by key
 * Returns null if setting is not defined in schema
 */
export async function getSettingByKey(key: string): Promise<SettingValue | null> {
  const definition = SETTINGS_SCHEMA.find(s => s.key === key);
  if (!definition) return null;
  
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('cms_settings')
    .select('*')
    .eq('key', key)
    .single();
  
  return {
    key,
    value: data?.value_json ?? definition.defaultValue,
    definition,
    isDefault: !data,
    updatedAt: data?.updated_at,
  };
}

/**
 * Validates a setting value against its schema definition
 * Returns validation result with error message if invalid
 */
export function validateSettingValue(
  definition: SettingDefinition,
  value: unknown
): { valid: boolean; error?: string } {
  // Required field validation
  if (definition.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: 'This field is required' };
  }
  
  // Skip further validation if value is empty and not required
  if (!definition.required && (value === null || value === undefined || value === '')) {
    return { valid: true };
  }
  
  // Type-specific validation
  switch (definition.type) {
    case 'number': {
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: 'Must be a valid number' };
      }
      
      if (definition.validation?.min !== undefined && value < definition.validation.min) {
        return { 
          valid: false, 
          error: `Must be at least ${definition.validation.min}` 
        };
      }
      
      if (definition.validation?.max !== undefined && value > definition.validation.max) {
        return { 
          valid: false, 
          error: `Must be at most ${definition.validation.max}` 
        };
      }
      break;
    }
    
    case 'string':
    case 'textarea': {
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be text' };
      }
      
      if (definition.validation?.minLength !== undefined && 
          value.length < definition.validation.minLength) {
        return { 
          valid: false, 
          error: `Must be at least ${definition.validation.minLength} characters` 
        };
      }
      
      if (definition.validation?.maxLength !== undefined && 
          value.length > definition.validation.maxLength) {
        return { 
          valid: false, 
          error: `Must be at most ${definition.validation.maxLength} characters` 
        };
      }
      
      if (definition.validation?.pattern && value.length > 0) {
        const regex = new RegExp(definition.validation.pattern);
        if (!regex.test(value)) {
          return { 
            valid: false, 
            error: 'Invalid format' 
          };
        }
      }
      break;
    }
    
    case 'boolean': {
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Must be true or false' };
      }
      break;
    }
    
    case 'select': {
      if (!definition.options?.some(opt => opt.value === value)) {
        return { valid: false, error: 'Invalid option selected' };
      }
      break;
    }
  }
  
  return { valid: true };
}
