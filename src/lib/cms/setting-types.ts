/**
 * Type definitions for the CMS settings system
 */

export type SettingType = 'boolean' | 'string' | 'number' | 'select' | 'textarea';

export interface SettingOption {
  value: string | number | boolean;
  label: string;
}

export interface SettingValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface SettingDefinition {
  key: string;
  type: SettingType;
  label: string;
  description: string;
  category: string;
  defaultValue: unknown;
  required?: boolean;
  options?: SettingOption[];
  validation?: SettingValidation;
}

export interface SettingCategory {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface SettingValue {
  key: string;
  value: unknown;
  definition: SettingDefinition;
  isDefault: boolean;
  updatedAt?: string;
}

export interface DatabaseSetting {
  id: string;
  key: string;
  value_json: Record<string, unknown>;
  updated_at: string;
}
