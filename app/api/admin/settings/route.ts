import { NextRequest } from 'next/server';
import { createServerSideClient } from '@/lib/supabase-server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET - Fetch all settings
export async function GET(request: NextRequest) {
  try {
    // Try to get user from Authorization header first
    const authHeader = request.headers.get('authorization');
    let user: any = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await serviceClient.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }

    // Fallback to cookie-based auth
    if (!user) {
      const supabase = await createServerSideClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      return jsonResponseNoCache(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use service role for all database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user is admin
    const { data: adminData } = await serviceSupabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (!adminData) {
      return jsonResponseNoCache(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all settings
    const { data: settings, error } = await serviceSupabase
      .from('app_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('Error fetching settings:', error);
      return jsonResponseNoCache(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return jsonResponseNoCache({ settings });
  } catch (error: any) {
    console.error('Settings API error:', error);
    return jsonResponseNoCache(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Try to get user from Authorization header first
    const authHeader = request.headers.get('authorization');
    let user: any = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await serviceClient.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }

    // Fallback to cookie-based auth
    if (!user) {
      const supabase = await createServerSideClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      return jsonResponseNoCache(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use service role for all database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user is admin
    const { data: adminData } = await serviceSupabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (!adminData) {
      return jsonResponseNoCache(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return jsonResponseNoCache(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Upsert each setting (insert if doesn't exist, update if exists)
    const updatePromises = settings.map(async (setting: { setting_key: string; setting_value: string; description?: string }) => {
      const { error } = await serviceSupabase
        .from('app_settings')
        .upsert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          description: setting.description || `Setting for ${setting.setting_key}`,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error(`Error upserting setting ${setting.setting_key}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    return jsonResponseNoCache({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return jsonResponseNoCache(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
