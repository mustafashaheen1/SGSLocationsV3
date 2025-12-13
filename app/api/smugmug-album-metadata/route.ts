import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const albumKey = searchParams.get('albumKey');

    if (!albumKey) {
      return jsonResponseNoCache({ error: 'Album key required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    const { data: tokenData } = await supabase
      .from('smugmug_tokens')
      .select('access_token, access_token_secret')
      .eq('is_temporary', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData) {
      return jsonResponseNoCache({ error: 'Not authorized' }, { status: 401 });
    }

    const albumUrl = `https://api.smugmug.com/api/v2/album/${albumKey}`;
    const albumParams = createOAuthParams(apiKey!, (tokenData as any).access_token);
    const albumSig = generateOAuthSignature(
      'GET',
      albumUrl,
      albumParams,
      apiSecret!,
      (tokenData as any).access_token_secret
    );

    const response = await axios.get(albumUrl, {
      params: {
        ...albumParams,
        oauth_signature: albumSig
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGS-Locations/1.0'
      }
    });

    const album = response.data.Response.Album;

    return jsonResponseNoCache({
      success: true,
      name: album.Name,
      description: album.Description,
      keywords: album.Keywords,
      location: {
        city: album.LocationCity,
        state: album.LocationState,
        country: album.LocationCountry
      }
    });

  } catch (error: any) {
    console.error('Error fetching album metadata:', error);
    return jsonResponseNoCache(
      { error: error.message },
      { status: 500 }
    );
  }
}
