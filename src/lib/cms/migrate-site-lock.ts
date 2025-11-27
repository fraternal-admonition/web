/**
 * Migration script for site lock settings
 * Converts old site_lock_enabled (boolean) to new site_lock_mode (string)
 */

import { createAdminClient } from '@/lib/supabase/server';

/**
 * Migrate site_lock_enabled to site_lock_mode
 * - true → 'auth' (require authentication)
 * - false → 'off' (public access)
 */
export async function migrateSiteLockSettings(): Promise<{
    success: boolean;
    message: string;
    migrated?: boolean;
}> {
    try {
        const supabase = await createAdminClient();

        // Check if old setting exists
        const { data: oldSetting, error: fetchError } = await supabase
            .from('cms_settings')
            .select('*')
            .eq('key', 'site_lock_enabled')
            .maybeSingle();

        if (fetchError) {
            console.error('[Migration] Error fetching old setting:', fetchError);
            return {
                success: false,
                message: `Error fetching old setting: ${fetchError.message}`,
            };
        }

        if (!oldSetting) {
            console.log('[Migration] No site_lock_enabled setting found - nothing to migrate');
            return {
                success: true,
                message: 'No migration needed - site_lock_enabled not found',
                migrated: false,
            };
        }

        // Determine new mode based on old value
        const oldValue = oldSetting.value_json;
        const newMode = oldValue === true ? 'auth' : 'off';

        console.log('[Migration] Migrating site_lock_enabled:', {
            oldValue,
            newMode,
        });

        // Check if new setting already exists
        const { data: existingNewSetting } = await supabase
            .from('cms_settings')
            .select('*')
            .eq('key', 'site_lock_mode')
            .maybeSingle();

        if (existingNewSetting) {
            console.log('[Migration] site_lock_mode already exists, skipping creation');
        } else {
            // Create new setting
            const { error: insertError } = await supabase
                .from('cms_settings')
                .insert({
                    key: 'site_lock_mode',
                    value_json: newMode,
                    updated_at: new Date().toISOString(),
                });

            if (insertError) {
                console.error('[Migration] Error creating new setting:', insertError);
                return {
                    success: false,
                    message: `Error creating new setting: ${insertError.message}`,
                };
            }

            console.log('[Migration] Created site_lock_mode with value:', newMode);
        }

        // Delete old setting
        const { error: deleteError } = await supabase
            .from('cms_settings')
            .delete()
            .eq('key', 'site_lock_enabled');

        if (deleteError) {
            console.error('[Migration] Error deleting old setting:', deleteError);
            return {
                success: false,
                message: `Error deleting old setting: ${deleteError.message}`,
            };
        }

        console.log('[Migration] Deleted old site_lock_enabled setting');

        return {
            success: true,
            message: `Successfully migrated site_lock_enabled (${oldValue}) to site_lock_mode (${newMode})`,
            migrated: true,
        };
    } catch (error) {
        console.error('[Migration] Unexpected error:', error);
        return {
            success: false,
            message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Check if migration is needed
 */
export async function checkMigrationNeeded(): Promise<boolean> {
    try {
        const supabase = await createAdminClient();

        const { data: oldSetting } = await supabase
            .from('cms_settings')
            .select('key')
            .eq('key', 'site_lock_enabled')
            .maybeSingle();

        return !!oldSetting;
    } catch (error) {
        console.error('[Migration] Error checking migration status:', error);
        return false;
    }
}
