import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  console.log('=== SMUGMUG CALLBACK HIT ===');
  console.log('Full URL:', request.url);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));

  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');

    console.log('OAuth Token from URL:', oauthToken);
    console.log('OAuth Verifier from URL:', oauthVerifier);

    if (!oauthToken || !oauthVerifier) {
      console.error('❌ Missing OAuth parameters');
      console.error('Received params:', Object.fromEntries(searchParams.entries()));
      return NextResponse.redirect(
        new URL('/admin/properties/add?error=missing_params', request.url)
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('❌ Missing SmugMug credentials');
      return NextResponse.redirect(
        new URL('/admin/properties/add?error=missing_credentials', request.url)
      );
    }

    console.log('✓ Credentials found');

    console.log('🔍 Looking up request token in database...');
    console.log('Request token to find:', oauthToken);

    const { data: allTokens, error: allError } = await supabase
      .from('smugmug_tokens')
      .select('*');

    console.log('All tokens in database:', allTokens);

    const { data: tempToken, error: fetchError } = await supabase
      .from('smugmug_tokens')
      .select('request_token_secret, request_token')
      .eq('request_token', oauthToken)
      .eq('is_temporary', true)
      .maybeSingle();

    console.log('Temp token query result:', { tempToken, fetchError });

    if (fetchError || !tempToken) {
      console.error('❌ Request token not found in database');
      console.error('Fetch error:', fetchError);
      console.error('Expected token:', oauthToken);
      console.error('Available tokens:', allTokens);
      return NextResponse.redirect(
        new URL('/admin/properties/add?error=token_not_found&details=' + encodeURIComponent('Token ' + oauthToken.substring(0, 10) + ' not in database'), request.url)
      );
    }

    const requestTokenSecret = tempToken.request_token_secret;
    console.log('✓ Request token secret retrieved');

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
      requestTokenSecret
    );

    const allParams = { ...oauthParams, oauth_signature: signature };

    console.log('📡 Exchanging for access token...');

    const response = await axios.get(accessTokenUrl, {
      params: allParams,
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'SGS-Locations/1.0'
      },
      timeout: 30000
    });

    console.log('✓ SmugMug response received');

    const params = new URLSearchParams(response.data);
    const accessToken = params.get('oauth_token')?.trim();
    const accessTokenSecret = params.get('oauth_token_secret')?.trim();

    console.log('Token Exchange Result:');
    console.log('  - Raw response:', response.data);
    console.log('  - accessToken:', accessToken);
    console.log('  - accessToken length:', accessToken?.length || 0);
    console.log('  - accessTokenSecret:', accessTokenSecret);
    console.log('  - accessTokenSecret length:', accessTokenSecret?.length || 0);

    if (!accessToken || !accessTokenSecret) {
      console.error('❌ Failed to extract tokens:', response.data);
      return NextResponse.redirect(
        new URL('/admin/properties/add?error=token_exchange_failed', request.url)
      );
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
      console.error('❌ Failed to store tokens:', insertError);
      return NextResponse.redirect(
        new URL('/admin/properties/add?error=storage_failed', request.url)
      );
    }

    console.log('✓ Tokens stored successfully');
    console.log('=== CALLBACK COMPLETE ===');

    return NextResponse.redirect(
      new URL('/admin/properties/add?smugmug_auth=success', request.url)
    );

  } catch (error: any) {
    console.error('=== CALLBACK ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.redirect(
      new URL('/admin/properties/add?error=callback_failed', request.url)
    );
  }
}
