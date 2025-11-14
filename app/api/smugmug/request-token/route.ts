import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import axios from 'axios';

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

    const baseUrl = request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/smugmug/callback`;

    console.log('Callback URL:', callbackUrl);

    const requestTokenUrl = 'https://api.smugmug.com/services/oauth/1.0a/getRequestToken';

    const oauthParams = createOAuthParams(apiKey, undefined, callbackUrl);

    const signature = generateOAuthSignature('GET', requestTokenUrl, oauthParams, apiSecret);
    const allParams = { ...oauthParams, oauth_signature: signature };

    console.log('Requesting token with params:', {
      ...allParams,
      oauth_consumer_key: allParams.oauth_consumer_key.substring(0, 10) + '...',
      oauth_signature: allParams.oauth_signature.substring(0, 20) + '...'
    });

    const response = await axios.get(requestTokenUrl, {
      params: allParams,
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    const responseData = response.data.Response || response.data;
    const params = new URLSearchParams(responseData);

    const requestToken = params.get('oauth_token');
    const requestTokenSecret = params.get('oauth_token_secret');

    if (!requestToken || !requestTokenSecret) {
      throw new Error('Failed to get request token from SmugMug');
    }

    console.log('✓ Request token obtained');

    const authUrl = `https://api.smugmug.com/services/oauth/1.0a/authorize?oauth_token=${requestToken}&Access=Full&Permissions=Read`;

    console.log('Authorization URL:', authUrl);

    return NextResponse.json({
      success: true,
      authUrl,
      requestToken,
      requestTokenSecret
    });

  } catch (error: any) {
    console.error('Request token error:', error.response?.data || error.message);
    return NextResponse.json({
      error: 'Failed to get request token',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}
