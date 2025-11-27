# Design Document

## Overview

This design transforms the admin settings page from a technical JSON editor into a user-friendly interface with predefined setting schemas, appropriate form controls, and consistent theming. The design also removes the standalone Assets page from navigation, streamlining the admin experience.

### Key Design Principles

1. **Schema-Driven UI**: Settings are defined in a central schema that specifies types, labels, validation, and categories
2. **Progressive Enhancement**: Existing JSON-based settings continue to work while new schema-based settings provide better UX
3. **Consistent Theming**: Match the elegant design language of other admin pages
4. **Type Safety**: Leverage TypeScript for setting definitions and validation
5. **Backward Compatibility**: No database migrations required; works with existing data

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Settings Page (UI)                    │
│  - Category tabs/sections                                │
│  - Dynamic form controls based on schema                 │
│  - Validation feedback                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Settings Schema Definition                  │
│  - Setting types, labels, descriptions                   │
│  - Validation rules                                      │
│  - Default values                                        │
│  - Categories                                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Settings API Layer                      │
│  - GET /api/admin/cms/settings (with schema merge)      │
│  - PUT /api/admin/cms/settings/:key (validation)        │
│  - Audit logging                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase cms_settings Table                 │
│  - Stores actual setting values                          │
│  - key: unique identifier                                │
│  - value_json: JSONB storage                             │
└─────────────────────────────────────────────────────────┘
```

### Component Structure

```
src/
├── lib/
│   └── cms/
│       ├── settings-schema.ts          # Central setting definitions
│       ├── settings-service.ts         # Business logic for settings
│       └── setting-types.ts            # TypeScript types
├── app/
│   ├── admin/
│   │   ├── cms/
│   │   │   └── settings/
│   │   │       ├── page.tsx            # Server component (data fetching)
│   │   │       └── SettingsClient.tsx  # Client component (UI)
│   │   └── layout.tsx                  # Update navigation (remove Assets)
│   └── api/
│       └── admin/
│           └── cms/
│               ├── settings/
│               │   ├── route.ts        # GET all settings
│               │   └── [key]/
│               │       └── route.ts    # PUT/DELETE by key
│               └── assets/
│                   └── route.ts        # Add redirect handler
└── components/
    └── admin/
        └── settings/
            ├── SettingControl.tsx      # Dynamic control renderer
            ├── BooleanControl.tsx      # Toggle/checkbox
            ├── TextControl.tsx         # Text input
            ├── NumberControl.tsx       # Number input
            └── SelectControl.tsx       # Dropdown
```

## Components and Interfaces

### 1. Settings Schema Definition


**File**: `src/lib/cms/settings-schema.ts`

```typescript
export type SettingType = 'boolean' | 'string' | 'number' | 'select' | 'textarea';

export interface SettingOption {
  value: string | number | boolean;
  label: string;
}

export interface SettingDefinition {
  key: string;
  type: SettingType;
  label: string;
  description: string;
  category: string;
  defaultValue: unknown;
  required?: boolean;
  options?: SettingOption[];  // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface SettingCategory {
  id: string;
  label: string;
  description: string;
  order: number;
}

// Example schema
export const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Basic site configuration',
    order: 1,
  },
  {
    id: 'features',
    label: 'Features',
    description: 'Enable or disable site features',
    order: 2,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Security and access control settings',
    order: 3,
  },
];

export const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: 'site_name',
    type: 'string',
    label: 'Site Name',
    description: 'The name of your website',
    category: 'general',
    defaultValue: 'Fraternal Admonition',
    required: true,
  },
  {
    key: 'maintenance_mode',
    type: 'boolean',
    label: 'Maintenance Mode',
    description: 'Enable to show a maintenance page to visitors',
    category: 'general',
    defaultValue: false,
  },
  {
    key: 'max_upload_size_mb',
    type: 'number',
    label: 'Max Upload Size (MB)',
    description: 'Maximum file size for uploads',
    category: 'general',
    defaultValue: 10,
    validation: { min: 1, max: 100 },
  },
  {
    key: 'site_lock_enabled',
    type: 'boolean',
    label: 'Site Lock',
    description: 'Restrict site access to authenticated users only',
    category: 'security',
    defaultValue: false,
  },
  {
    key: 'contact_email',
    type: 'string',
    label: 'Contact Email',
    description: 'Email address for contact form submissions',
    category: 'general',
    defaultValue: '',
    validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  },
];
```

### 2. Settings Service Layer

**File**: `src/lib/cms/settings-service.ts`


```typescript
import { SETTINGS_SCHEMA, SettingDefinition } from './settings-schema';
import { createAdminClient } from '@/lib/supabase/server';

export interface SettingValue {
  key: string;
  value: unknown;
  definition: SettingDefinition;
  isDefault: boolean;
  updatedAt?: string;
}

export async function getAllSettings(): Promise<SettingValue[]> {
  const supabase = await createAdminClient();
  
  // Fetch all settings from database
  const { data: dbSettings } = await supabase
    .from('cms_settings')
    .select('*')
    .order('key');
  
  // Create a map of database values
  const dbMap = new Map(
    (dbSettings || []).map(s => [s.key, { value: s.value_json, updatedAt: s.updated_at }])
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

export function validateSettingValue(
  definition: SettingDefinition,
  value: unknown
): { valid: boolean; error?: string } {
  // Type validation
  if (definition.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: 'This field is required' };
  }
  
  // Type-specific validation
  switch (definition.type) {
    case 'number':
      if (typeof value !== 'number') {
        return { valid: false, error: 'Must be a number' };
      }
      if (definition.validation?.min !== undefined && value < definition.validation.min) {
        return { valid: false, error: `Must be at least ${definition.validation.min}` };
      }
      if (definition.validation?.max !== undefined && value > definition.validation.max) {
        return { valid: false, error: `Must be at most ${definition.validation.max}` };
      }
      break;
      
    case 'string':
    case 'textarea':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Must be text' };
      }
      if (definition.validation?.pattern) {
        const regex = new RegExp(definition.validation.pattern);
        if (!regex.test(value)) {
          return { valid: false, error: 'Invalid format' };
        }
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Must be true or false' };
      }
      break;
      
    case 'select':
      if (!definition.options?.some(opt => opt.value === value)) {
        return { valid: false, error: 'Invalid option selected' };
      }
      break;
  }
  
  return { valid: true };
}
```

### 3. Settings Page UI

**File**: `src/app/admin/cms/settings/page.tsx`


```typescript
import { requireAdmin } from "@/lib/admin-auth";
import { getAllSettings } from "@/lib/cms/settings-service";
import { SETTING_CATEGORIES } from "@/lib/cms/settings-schema";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  await requireAdmin("/admin/cms/settings");
  
  const settings = await getAllSettings();
  
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Site <span className="text-[#C19A43]">Settings</span>
          </h1>
          <p className="text-[#666]">
            Configure your site's behavior and features
          </p>
        </div>
        
        <SettingsClient 
          settings={settings} 
          categories={SETTING_CATEGORIES}
        />
      </div>
    </div>
  );
}
```

**File**: `src/app/admin/cms/settings/SettingsClient.tsx`

```typescript
"use client";

import { useState } from "react";
import { SettingValue } from "@/lib/cms/settings-service";
import { SettingCategory } from "@/lib/cms/settings-schema";
import SettingControl from "@/components/admin/settings/SettingControl";

export default function SettingsClient({
  settings,
  categories,
}: {
  settings: SettingValue[];
  categories: SettingCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSave = async (key: string, value: unknown) => {
    setSaving(key);
    setErrors({});
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/admin/cms/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save setting');
      }
      
      setSuccess(`${key} updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setErrors({ [key]: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(null);
    }
  };
  
  const settingsByCategory = categories.map(category => ({
    ...category,
    settings: settings.filter(s => s.definition.category === category.id),
  }));
  
  return (
    <div>
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-[#004D40]/10 border border-[#004D40]/20 text-[#004D40] px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      
      {/* Category Tabs */}
      <div className="mb-6 border-b border-[#E5E5E0]">
        <nav className="flex space-x-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeCategory === category.id
                  ? 'border-[#C19A43] text-[#222]'
                  : 'border-transparent text-[#666] hover:text-[#222] hover:border-[#E5E5E0]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Settings for Active Category */}
      {settingsByCategory
        .filter(cat => cat.id === activeCategory)
        .map(category => (
          <div key={category.id}>
            <p className="text-[#666] mb-6">{category.description}</p>
            
            <div className="space-y-6">
              {category.settings.map(setting => (
                <SettingControl
                  key={setting.key}
                  setting={setting}
                  onSave={handleSave}
                  saving={saving === setting.key}
                  error={errors[setting.key]}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
```

### 4. Dynamic Setting Controls

**File**: `src/components/admin/settings/SettingControl.tsx`


```typescript
"use client";

import { useState } from "react";
import { SettingValue } from "@/lib/cms/settings-service";
import BooleanControl from "./BooleanControl";
import TextControl from "./TextControl";
import NumberControl from "./NumberControl";
import SelectControl from "./SelectControl";

export default function SettingControl({
  setting,
  onSave,
  saving,
  error,
}: {
  setting: SettingValue;
  onSave: (key: string, value: unknown) => Promise<void>;
  saving: boolean;
  error?: string;
}) {
  const [value, setValue] = useState(setting.value);
  const [isDirty, setIsDirty] = useState(false);
  
  const handleChange = (newValue: unknown) => {
    setValue(newValue);
    setIsDirty(true);
  };
  
  const handleSave = async () => {
    await onSave(setting.key, value);
    setIsDirty(false);
  };
  
  const handleReset = () => {
    setValue(setting.definition.defaultValue);
    setIsDirty(true);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-[#222] mb-1">
            {setting.definition.label}
            {setting.definition.required && (
              <span className="text-[#C19A43] ml-1">*</span>
            )}
          </label>
          <p className="text-sm text-[#666]">{setting.definition.description}</p>
        </div>
        
        {!setting.isDefault && (
          <button
            onClick={handleReset}
            className="text-xs text-[#666] hover:text-[#C19A43] transition-colors"
          >
            Reset to default
          </button>
        )}
      </div>
      
      <div className="mb-4">
        {setting.definition.type === 'boolean' && (
          <BooleanControl value={value as boolean} onChange={handleChange} />
        )}
        {(setting.definition.type === 'string' || setting.definition.type === 'textarea') && (
          <TextControl
            value={value as string}
            onChange={handleChange}
            multiline={setting.definition.type === 'textarea'}
            validation={setting.definition.validation}
          />
        )}
        {setting.definition.type === 'number' && (
          <NumberControl
            value={value as number}
            onChange={handleChange}
            validation={setting.definition.validation}
          />
        )}
        {setting.definition.type === 'select' && (
          <SelectControl
            value={value}
            onChange={handleChange}
            options={setting.definition.options || []}
          />
        )}
      </div>
      
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
      
      {isDirty && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#004D40] text-white px-6 py-2 rounded-lg hover:bg-[#00695C] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 5. Individual Control Components

**File**: `src/components/admin/settings/BooleanControl.tsx`

```typescript
"use client";

export default function BooleanControl({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-[#004D40]' : 'bg-[#E5E5E0]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
```

**File**: `src/components/admin/settings/TextControl.tsx`

```typescript
"use client";

export default function TextControl({
  value,
  onChange,
  multiline = false,
  validation,
}: {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  validation?: { pattern?: string; minLength?: number; maxLength?: number };
}) {
  const commonClasses = "w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#C19A43] focus:border-[#C19A43] transition-colors";
  
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={commonClasses}
        minLength={validation?.minLength}
        maxLength={validation?.maxLength}
      />
    );
  }
  
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={commonClasses}
      pattern={validation?.pattern}
      minLength={validation?.minLength}
      maxLength={validation?.maxLength}
    />
  );
}
```

**File**: `src/components/admin/settings/NumberControl.tsx`


```typescript
"use client";

export default function NumberControl({
  value,
  onChange,
  validation,
}: {
  value: number;
  onChange: (value: number) => void;
  validation?: { min?: number; max?: number };
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={validation?.min}
      max={validation?.max}
      className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#C19A43] focus:border-[#C19A43] transition-colors"
    />
  );
}
```

**File**: `src/components/admin/settings/SelectControl.tsx`

```typescript
"use client";

import { SettingOption } from "@/lib/cms/settings-schema";

export default function SelectControl({
  value,
  onChange,
  options,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  options: SettingOption[];
}) {
  return (
    <select
      value={String(value)}
      onChange={(e) => {
        const option = options.find(opt => String(opt.value) === e.target.value);
        onChange(option?.value);
      }}
      className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#C19A43] focus:border-[#C19A43] transition-colors bg-white"
    >
      {options.map(option => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

## Data Models

### Database Schema

The existing `cms_settings` table structure remains unchanged:

```sql
CREATE TABLE cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### TypeScript Types

**File**: `src/lib/cms/setting-types.ts`

```typescript
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
```

## Error Handling

### Validation Errors

1. **Client-side validation**: Immediate feedback using HTML5 validation and custom rules
2. **Server-side validation**: API validates against schema before saving
3. **Error display**: Inline error messages below each control

### API Error Responses

```typescript
// Success response
{ success: true, data: { key: string, value: unknown } }

// Validation error
{ error: "Validation failed", details: { field: string, message: string }[] }

// Not found error
{ error: "Setting not found" }

// Server error
{ error: "Internal server error" }
```

### Error Recovery

- Failed saves preserve user input
- Clear error messages guide users to fix issues
- Retry mechanism for network failures

## Testing Strategy

### Unit Tests

1. **Settings Service**
   - Test `getAllSettings()` merges schema with database correctly
   - Test `validateSettingValue()` for each type
   - Test default value fallback

2. **Control Components**
   - Test each control renders correctly
   - Test value changes trigger onChange
   - Test validation rules

### Integration Tests

1. **Settings Page**
   - Test category switching
   - Test saving settings
   - Test error handling
   - Test reset to default

2. **API Endpoints**
   - Test GET returns merged settings
   - Test PUT validates and saves
   - Test authentication required

### E2E Tests

1. Admin can view settings organized by category
2. Admin can change a boolean setting and save
3. Admin can change a text setting with validation
4. Admin can reset a setting to default
5. Invalid input shows error message
6. Assets page redirects correctly

## Navigation Changes

### Remove Assets from Admin Layout

**File**: `src/app/admin/layout.tsx`

Remove the Assets link from navigation:

```typescript
// BEFORE
<Link href="/admin/cms/assets">Assets</Link>

// AFTER
// (removed)
```

### Remove Assets from Dashboard

**File**: `src/app/admin/page.tsx`

Remove Assets card from stats grid and quick actions:

```typescript
// Remove from stats array
const stats = [
  { name: "CMS Pages", ... },
  // { name: "Assets", ... }, // REMOVED
  { name: "Settings", ... },
];

// Remove from quick actions
// <Link href="/admin/cms/assets/upload">+ Upload Asset</Link> // REMOVED
```

### Add Redirect for Assets Routes

**File**: `src/app/admin/cms/assets/page.tsx`

```typescript
import { redirect } from 'next/navigation';

export default function AssetsPage() {
  redirect('/admin/cms/pages');
}
```

**File**: `src/app/admin/cms/assets/upload/page.tsx`

```typescript
import { redirect } from 'next/navigation';

export default function AssetsUploadPage() {
  redirect('/admin/cms/pages');
}
```

## Migration Strategy

### Phase 1: Add Schema-Based Settings (Non-Breaking)

1. Create settings schema with initial definitions
2. Create settings service layer
3. Update settings page to use schema
4. Keep backward compatibility with raw JSON settings

### Phase 2: Remove Assets Navigation

1. Remove Assets links from layout and dashboard
2. Add redirects for assets routes
3. Document asset management within page editor

### Phase 3: Migrate Existing Settings (Optional)

1. Create migration script to convert existing settings to schema format
2. Run migration in production
3. Remove legacy JSON editing fallback

## Design Patterns

### Schema-Driven UI

Settings are defined once in a schema, and the UI automatically renders appropriate controls. This pattern:
- Reduces code duplication
- Ensures consistency
- Makes adding new settings trivial
- Provides type safety

### Progressive Enhancement

The design maintains backward compatibility:
- Existing settings continue to work
- New schema-based settings provide better UX
- No database migration required
- Gradual migration path

### Separation of Concerns

- **Schema**: Defines what settings exist
- **Service**: Handles business logic and data access
- **Components**: Handle presentation and user interaction
- **API**: Handles HTTP requests and validation

## Security Considerations

1. **Authentication**: All settings endpoints require admin authentication
2. **Validation**: Server-side validation prevents invalid data
3. **Audit Logging**: All changes logged to audit_logs table
4. **CSRF Protection**: Use existing CSRF token system
5. **Rate Limiting**: Apply rate limits to prevent abuse
6. **Input Sanitization**: Sanitize text inputs to prevent XSS

## Performance Considerations

1. **Server-side rendering**: Initial page load is fast
2. **Optimistic updates**: UI updates immediately, syncs in background
3. **Minimal re-renders**: Only affected controls re-render on change
4. **Lazy loading**: Load settings on demand if list grows large
5. **Caching**: Consider caching settings in memory for read-heavy workloads

## Accessibility

1. **Keyboard navigation**: All controls accessible via keyboard
2. **Screen reader support**: Proper labels and ARIA attributes
3. **Focus management**: Clear focus indicators
4. **Error announcements**: Errors announced to screen readers
5. **Color contrast**: Meets WCAG AA standards

## Future Enhancements

1. **Search/filter**: Add search to quickly find settings
2. **Bulk edit**: Allow editing multiple settings at once
3. **Import/export**: Export settings as JSON for backup
4. **Setting groups**: Add collapsible groups within categories
5. **Rich text editor**: For settings that need formatted text
6. **File upload**: For settings that need file attachments
7. **Setting dependencies**: Show/hide settings based on other values
8. **Change history**: View history of setting changes
