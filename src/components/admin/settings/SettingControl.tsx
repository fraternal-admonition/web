"use client";

import { useState } from "react";
import { SettingValue } from "@/lib/cms/setting-types";
import BooleanControl from "./BooleanControl";
import TextControl from "./TextControl";
import NumberControl from "./NumberControl";
import SelectControl from "./SelectControl";

/**
 * Dynamic setting control that renders the appropriate input type
 * based on the setting definition and handles save/reset logic
 */
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
      {/* Header with label and reset button */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-[#222] mb-1">
            {setting.definition.label}
            {setting.definition.required && (
              <span className="text-[#C19A43] ml-1">*</span>
            )}
          </label>
          <p className="text-sm text-[#666]">
            {setting.definition.description}
          </p>
        </div>
        
        {!setting.isDefault && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#666] hover:text-[#C19A43] transition-colors ml-4 whitespace-nowrap"
          >
            Reset to default
          </button>
        )}
      </div>
      
      {/* Dynamic control based on setting type */}
      <div className="mb-4">
        {setting.definition.type === 'boolean' && (
          <BooleanControl 
            value={value as boolean} 
            onChange={handleChange} 
          />
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
      
      {/* Error message */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      
      {/* Save button (only shown when value changed) */}
      {isDirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={
              "bg-[#004D40] text-white px-6 py-2 rounded-lg " +
              "hover:bg-[#00695C] transition-all font-medium shadow-sm " +
              "disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
