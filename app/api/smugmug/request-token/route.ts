import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    console.log('=== STEP 1: REQUEST TOKEN ===');

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('❌ Missing API credentials');
      return NextResponse.json({
        error: 'SmugMug credentials not configured'
      }, { status: 500 });
    }

    const callbackUrl = 'https://sgs-locations-v3.vercel.app/api/smugmug-callback';
    console.log('Callback URL:', callbackUrl);

    const requestTokenUrl = 'https://api.smugmug.com/services/oauth/1.0a/getRequestToken';
    const oauthParams = createOAuthParams(apiKey, undefined, callbackUrl);
    const signature = generateOAuthSignature('GET', requestTokenUrl, oauthParams, apiSecret);
    const allParams = { ...oauthParams, oauth_signature: signature };

    console.log('📡 Requesting token from SmugMug...');

    const response = await axios.get(requestTokenUrl, {
      params: allParams,
      headers: { 'Accept': 'text/plain' },
      timeout: 30000
    });

    const params = new URLSearchParams(response.data);
    const requestToken = params.get('oauth_token');
    const requestTokenSecret = params.get('oauth_token_secret');

    if (!requestToken || !requestTokenSecret) {
      console.error('❌ Missing tokens in SmugMug response:', response.data);
      throw new Error('Failed to get request token from SmugMug');
    }

    console.log('✓ Request token obtained:', requestToken.substring(0, 10) + '...');

    console.log('🗑️  Cleaning up old temporary tokens...');
    const { error: deleteError } = await supabase
      .from('smugmug_tokens')
      .delete()
      .eq('is_temporary', true);

    if (deleteError) {
      console.error('⚠️  Delete error (non-critical):', deleteError);
    } else {
      console.log('✓ Old tokens cleaned up');
    }

    console.log('💾 Storing temporary token...');
    const { data: insertData, error: insertError } = await supabase
      .from('smugmug_tokens')
      .insert({
        request_token: requestToken,
        request_token_secret: requestTokenSecret,
        access_token: '',
        access_token_secret: '',
        is_temporary: true
      })
      .select();

    if (insertError) {
      console.error('❌ Failed to store temporary token:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('✓ Temporary token stored successfully:', insertData);

    const { data: verifyData, error: verifyError } = await supabase
      .from('smugmug_tokens')
      .select('*')
      .eq('request_token', requestToken)
      .eq('is_temporary', true)
      .maybeSingle();

    if (verifyError || !verifyData) {
      console.error('❌ Failed to verify stored token:', verifyError);
      throw new Error('Token storage verification failed');
    }

    console.log('✓ Token storage verified');

    const authUrl = `https://api.smugmug.com/services/oauth/1.0a/authorize?oauth_token=${requestToken}&Access=Full&Permissions=Read`;

    return NextResponse.json({
      success: true,
      authUrl,
      requestToken
    });

  } catch (error: any) {
    console.error('❌ Request token error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({
      error: 'Failed to get request token',
      details: error.message
    }, { status: 500 });
  }
}
