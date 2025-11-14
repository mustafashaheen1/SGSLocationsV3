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
      return NextResponse.json({
        error: 'SmugMug credentials not configured'
      }, { status: 500 });
    }

    const callbackUrl = 'https://sgs-locations.vercel.app/api/smugmug-callback';

    console.log('Callback URL (MUST match SmugMug config):', callbackUrl);

    const requestTokenUrl = 'https://api.smugmug.com/services/oauth/1.0a/getRequestToken';

    const oauthParams = createOAuthParams(apiKey, undefined, callbackUrl);

    const signature = generateOAuthSignature('GET', requestTokenUrl, oauthParams, apiSecret);
    const allParams = { ...oauthParams, oauth_signature: signature };

    console.log('Requesting token from SmugMug...');

    const response = await axios.get(requestTokenUrl, {
      params: allParams,
      headers: {
        'Accept': 'text/plain'
      },
      timeout: 30000
    });

    console.log('✓ Response received from SmugMug');

    const params = new URLSearchParams(response.data);

    const requestToken = params.get('oauth_token');
    const requestTokenSecret = params.get('oauth_token_secret');

    if (!requestToken || !requestTokenSecret) {
      console.error('❌ Missing tokens in response:', response.data);
      throw new Error('Failed to get request token from SmugMug');
    }

    console.log('✓ Request token obtained');

    await supabase
      .from('smugmug_tokens')
      .delete()
      .eq('is_temporary', true);

    await supabase
      .from('smugmug_tokens')
      .insert({
        request_token: requestToken,
        request_token_secret: requestTokenSecret,
        access_token: '',
        access_token_secret: '',
        is_temporary: true
      });

    console.log('✓ Temporary tokens stored');

    const authUrl = `https://api.smugmug.com/services/oauth/1.0a/authorize?oauth_token=${requestToken}&Access=Full&Permissions=Read`;

    console.log('✓ Authorization URL generated');

    return NextResponse.json({
      success: true,
      authUrl,
      requestToken
    });

  } catch (error: any) {
    console.error('❌ Request token error:', error.response?.data || error.message);
    return NextResponse.json({
      error: 'Failed to get request token',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}
