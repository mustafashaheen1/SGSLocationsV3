import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    console.log('=== STEP 3: CALLBACK HANDLER ===');

    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');

    console.log('Callback params:', { oauthToken, oauthVerifier });

    if (!oauthToken || !oauthVerifier) {
      return NextResponse.redirect(new URL('/admin/properties/add?error=oauth_failed', request.url));
    }

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.redirect(new URL('/admin/properties/add?error=config_missing', request.url));
    }

    const accessTokenUrl = 'https://api.smugmug.com/services/oauth/1.0a/getAccessToken';

    const oauthParams = {
      ...createOAuthParams(apiKey, oauthToken),
      oauth_verifier: oauthVerifier
    };

    const signature = generateOAuthSignature('GET', accessTokenUrl, oauthParams, apiSecret, '');
    const allParams = { ...oauthParams, oauth_signature: signature };

    console.log('Exchanging for access token...');

    const response = await axios.get(accessTokenUrl, {
      params: allParams,
      headers: {
        'Accept': 'application/json'
      }
    });

    const responseData = response.data.Response || response.data;
    const params = new URLSearchParams(responseData);

    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Failed to get access token');
    }

    console.log('✓ Access token obtained');

    await supabase
      .from('smugmug_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    await supabase
      .from('smugmug_tokens')
      .insert({
        access_token: accessToken,
        access_token_secret: accessTokenSecret
      });

    console.log('✓ Tokens stored in database');

    return NextResponse.redirect(new URL('/admin/properties/add?smugmug_authorized=true', request.url));

  } catch (error: any) {
    console.error('Callback error:', error.response?.data || error.message);
    return NextResponse.redirect(new URL('/admin/properties/add?error=token_exchange_failed', request.url));
  }
}
