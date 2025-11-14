import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('=== SMUGMUG OAUTH CALLBACK START ===');

    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');

    console.log('OAuth Token:', oauthToken);
    console.log('OAuth Verifier:', oauthVerifier);

    if (!oauthToken || !oauthVerifier) {
      console.error('Missing OAuth parameters');
      return NextResponse.redirect(new URL('/admin/properties/add?error=missing_params', request.url));
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('smugmug_tokens')
      .select('request_token_secret')
      .eq('request_token', oauthToken)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error('Request token not found:', tokenError);
      return NextResponse.redirect(new URL('/admin/properties/add?error=token_not_found', request.url));
    }

    console.log('✓ Request token secret retrieved');

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('SmugMug credentials not configured');
      return NextResponse.redirect(new URL('/admin/properties/add?error=missing_credentials', request.url));
    }

    const accessTokenUrl = 'https://api.smugmug.com/services/oauth/1.0a/getAccessToken';

    const oauthParams = {
      ...createOAuthParams(apiKey, oauthToken),
      oauth_verifier: oauthVerifier
    };

    const signature = generateOAuthSignature(
      'GET',
      accessTokenUrl,
      oauthParams,
      apiSecret,
      tokenData.request_token_secret
    );

    console.log('Exchanging request token for access token...');

    const response = await axios.get(accessTokenUrl, {
      params: { ...oauthParams, oauth_signature: signature },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGS-Locations/1.0'
      },
      timeout: 30000
    });

    console.log('Token exchange response:', response.data);

    let accessToken: string;
    let accessTokenSecret: string;

    if (typeof response.data === 'string') {
      const params = new URLSearchParams(response.data);
      accessToken = params.get('oauth_token') || '';
      accessTokenSecret = params.get('oauth_token_secret') || '';
    } else {
      accessToken = response.data.oauth_token || response.data.Token?.id || '';
      accessTokenSecret = response.data.oauth_token_secret || response.data.Token?.Secret || '';
    }

    if (!accessToken || !accessTokenSecret) {
      console.error('Failed to extract access tokens:', response.data);
      return NextResponse.redirect(new URL('/admin/properties/add?error=token_exchange_failed', request.url));
    }

    console.log('✓ Access tokens obtained');

    await supabase
      .from('smugmug_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: insertError } = await supabase
      .from('smugmug_tokens')
      .insert({
        access_token: accessToken,
        access_token_secret: accessTokenSecret,
        request_token: '',
        request_token_secret: '',
        is_temporary: false
      });

    if (insertError) {
      console.error('Failed to store tokens:', insertError);
      return NextResponse.redirect(new URL('/admin/properties/add?error=storage_failed', request.url));
    }

    console.log('✓ Tokens stored successfully');
    console.log('=== OAUTH CALLBACK COMPLETE ===');

    return NextResponse.redirect(new URL('/admin/properties/add?smugmug_auth=success', request.url));

  } catch (error: any) {
    console.error('=== CALLBACK ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.redirect(new URL('/admin/properties/add?error=callback_failed', request.url));
  }
}
