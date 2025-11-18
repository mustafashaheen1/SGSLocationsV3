import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import { extractGoogleMapsLink } from '@/lib/google-maps-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'SmugMug API credentials not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching all SmugMug albums with metadata...');

    const { data: tokenData, error: tokenError } = await supabase
      .from('smugmug_tokens')
      .select('access_token, access_token_secret')
      .eq('is_temporary', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'SmugMug not authorized. Please authorize first.' },
        { status: 401 }
      );
    }

    // Get authenticated user
    const authUserUrl = 'https://api.smugmug.com/api/v2!authuser';
    const authUserParams = createOAuthParams(apiKey, tokenData.access_token);
    const authUserSig = generateOAuthSignature(
      'GET',
      authUserUrl,
      authUserParams,
      apiSecret,
      tokenData.access_token_secret
    );

    const authUserResponse = await axios.get(authUserUrl, {
      params: {
        ...authUserParams,
        oauth_signature: authUserSig
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGS-Locations/1.0'
      }
    });

    const userUri = authUserResponse.data.Response.User.Uris.UserAlbums?.Uri;
    if (!userUri) {
      throw new Error('Could not get user albums URI');
    }

    console.log('✓ Got user albums URI:', userUri);

    // Get all albums - FIXED: Include count in signature
    const albumsUrl = `https://api.smugmug.com${userUri}`;
    const albumsParams = createOAuthParams(apiKey, tokenData.access_token);

    // Add count parameter BEFORE signature generation
    const albumsParamsWithCount = {
      ...albumsParams,
      count: '100'
    };

    const albumsSig = generateOAuthSignature(
      'GET',
      albumsUrl,
      albumsParamsWithCount,
      apiSecret,
      tokenData.access_token_secret
    );

    const albumsResponse = await axios.get(albumsUrl, {
      params: {
        ...albumsParamsWithCount,
        oauth_signature: albumsSig
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGS-Locations/1.0'
      }
    });

    const albums = albumsResponse.data.Response.Album || [];

    console.log(`✓ Found ${albums.length} albums`);

    // Get detailed metadata for each album
    const albumsWithMetadata = await Promise.all(
      albums.map(async (album: any) => {
        try {
          // Get full album details
          const albumUrl = `https://api.smugmug.com/api/v2/album/${album.AlbumKey}`;
          const albumParams = createOAuthParams(apiKey, tokenData.access_token);
          const albumSig = generateOAuthSignature(
            'GET',
            albumUrl,
            albumParams,
            apiSecret,
            tokenData.access_token_secret
          );

          const albumResponse = await axios.get(albumUrl, {
            params: {
              ...albumParams,
              oauth_signature: albumSig
            },
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SGS-Locations/1.0'
            },
            timeout: 10000
          });

          const albumDetails = albumResponse.data.Response.Album;

          // Get album images count
          const albumImagesUri = album.Uris?.AlbumImages?.Uri;
          let imageCount = 0;
          let thumbnailUrl = null;

          if (albumImagesUri) {
            const imagesUrl = `https://api.smugmug.com${albumImagesUri}`;
            const imagesParams = createOAuthParams(apiKey, tokenData.access_token);

            // Add count for images request
            const imagesParamsWithCount = {
              ...imagesParams,
              count: '1'
            };

            const imagesSig = generateOAuthSignature(
              'GET',
              imagesUrl,
              imagesParamsWithCount,
              apiSecret,
              tokenData.access_token_secret
            );

            const imagesResponse = await axios.get(imagesUrl, {
              params: {
                ...imagesParamsWithCount,
                oauth_signature: imagesSig
              },
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'SGS-Locations/1.0'
              },
              timeout: 10000
            });

            imageCount = imagesResponse.data.Response.Pages?.Total || 0;
            const firstImage = imagesResponse.data.Response.AlbumImage?.[0];

            // Get thumbnail
            if (firstImage?.Uris?.ImageSizes?.Uri) {
              const sizesUrl = `https://api.smugmug.com${firstImage.Uris.ImageSizes.Uri}`;
              const sizesParams = createOAuthParams(apiKey, tokenData.access_token);
              const sizesSig = generateOAuthSignature(
                'GET',
                sizesUrl,
                sizesParams,
                apiSecret,
                tokenData.access_token_secret
              );

              const sizesResponse = await axios.get(sizesUrl, {
                params: {
                  ...sizesParams,
                  oauth_signature: sizesSig
                },
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'SGS-Locations/1.0'
                },
                timeout: 10000
              });

              thumbnailUrl = sizesResponse.data.Response.ImageSizes?.ThumbImageUrl ||
                            sizesResponse.data.Response.ImageSizes?.SmallImageUrl;
            }
          }

          return {
            albumKey: album.AlbumKey,
            name: albumDetails.Name || 'Untitled Album',
            description: albumDetails.Description || '',
            keywords: albumDetails.Keywords || '',
            location: {
              city: albumDetails.LocationCity || '',
              state: albumDetails.LocationState || '',
              country: albumDetails.LocationCountry || ''
            },
            imageCount: imageCount,
            thumbnail: thumbnailUrl,
            webUri: album.WebUri,
            urlPath: album.UrlPath,
            // Additional metadata
            allowDownloads: albumDetails.AllowDownloads,
            protected: albumDetails.Protected,
            privacy: albumDetails.Privacy,
            sortMethod: albumDetails.SortMethod,
            lastUpdated: albumDetails.LastUpdated,
            googleMapsLink: extractGoogleMapsLink(
              albumDetails.Description || albumDetails.Keywords || ''
            )
          };
        } catch (error: any) {
          console.error(`Error getting metadata for album ${album.Name}:`, error.message);
          return null;
        }
      })
    );

    const validAlbums = albumsWithMetadata.filter(a => a !== null && a.imageCount > 0);

    console.log(`✓ Retrieved metadata for ${validAlbums.length} albums with images`);

    return NextResponse.json({
      success: true,
      albums: validAlbums,
      total: validAlbums.length
    });

  } catch (error: any) {
    console.error('Error fetching SmugMug albums:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}
