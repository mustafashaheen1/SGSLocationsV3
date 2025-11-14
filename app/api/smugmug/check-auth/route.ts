import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 SmugMug Auth Check - Starting...');

    const { data, error } = await supabase
      .from('smugmug_tokens')
      .select('access_token, access_token_secret, created_at, is_temporary')
      .eq('is_temporary', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Database Query Result:');
    console.log('  - Error:', error);
    console.log('  - Data exists:', !!data);

    if (data) {
      console.log('  - access_token exists:', !!data.access_token);
      console.log('  - access_token length:', data.access_token?.length || 0);
      console.log('  - access_token (first 15):', data.access_token?.substring(0, 15) || 'EMPTY');
      console.log('  - access_token_secret exists:', !!data.access_token_secret);
      console.log('  - secret length:', data.access_token_secret?.length || 0);
      console.log('  - secret (first 15):', data.access_token_secret?.substring(0, 15) || 'EMPTY');
      console.log('  - created_at:', data.created_at);
    }

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        authorized: false,
        reason: 'database_error',
        error: error.message
      });
    }

    if (!data ||
        !data.access_token ||
        !data.access_token_secret ||
        data.access_token.trim() === '' ||
        data.access_token_secret.trim() === '') {

      console.log('❌ Missing or empty tokens');
      return NextResponse.json({
        authorized: false,
        reason: 'missing_tokens',
        debug: {
          hasData: !!data,
          hasAccessToken: !!data?.access_token,
          accessTokenLength: data?.access_token?.length || 0,
          hasSecret: !!data?.access_token_secret,
          secretLength: data?.access_token_secret?.length || 0
        }
      });
    }

    console.log('✅ Valid tokens found');
    return NextResponse.json({
      authorized: true,
      authorizedAt: data.created_at
    });

  } catch (error: any) {
    console.error('❌ Check auth exception:', error);
    return NextResponse.json({
      authorized: false,
      reason: 'exception',
      error: error.message
    });
  }
}
