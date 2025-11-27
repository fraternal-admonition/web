/**
 * API endpoint to trigger site lock migration
 * Converts site_lock_enabled (boolean) to site_lock_mode (string)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { migrateSiteLockSettings, checkMigrationNeeded } from '@/lib/cms/migrate-site-lock';
import { settingsCache } from '@/lib/cms/settings-cache';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    console.log('[Migration API] Starting site lock migration...');

    // Run migration
    const result = await migrateSiteLockSettings();

    // Invalidate settings cache if migration was successful
    if (result.success && result.migrated) {
      settingsCache.invalidate();
      console.log('[Migration API] Settings cache invalidated');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if migration is needed
    const needed = await checkMigrationNeeded();

    return NextResponse.json({
      migrationNeeded: needed,
      message: needed
        ? 'Migration needed - old site_lock_enabled setting found'
        : 'No migration needed',
    });
  } catch (error) {
    console.error('[Migration API] Error checking migration status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check migration status',
      },
      { status: 500 }
    );
  }
}
