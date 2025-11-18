import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

function createOAuthParams(apiKey: string, accessToken: string) {
  return {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(32).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0'
  };
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  apiSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  return signature;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'SmugMug API credentials not configured' },
        { status: 500 }
      );
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('smugmug_tokens')
      .select('*')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'SmugMug not authorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching all SmugMug albums with metadata...');

    const authUserUrl = 'https://api.smugmug.com/api/v2!authuser';
    const authUserParams = createOAuthParams(apiKey, tokenData.access_token);
    const authUserSig = generateOAuthSignature('GET', authUserUrl, authUserParams, apiSecret, tokenData.access_token_secret);

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

    const albumsUrl = `https://api.smugmug.com${userUri}`;
    const albumsParams = createOAuthParams(apiKey, tokenData.access_token);
    const albumsSig = generateOAuthSignature('GET', albumsUrl, albumsParams, apiSecret, tokenData.access_token_secret);

    const albumsResponse = await axios.get(albumsUrl, {
      params: {
        ...albumsParams,
        oauth_signature: albumsSig,
        count: 100,
        _expand: 'HighlightImage'
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGS-Locations/1.0'
      }
    });

    const albums = albumsResponse.data.Response.Album || [];

    console.log(`✓ Found ${albums.length} albums`);

    const albumsWithMetadata = await Promise.all(
      albums.map(async (album: any) => {
        try {
          const albumUrl = `https://api.smugmug.com/api/v2/album/${album.AlbumKey}`;
          const albumParams = createOAuthParams(apiKey, tokenData.access_token);
          const albumSig = generateOAuthSignature('GET', albumUrl, albumParams, apiSecret, tokenData.access_token_secret);

          const albumResponse = await axios.get(albumUrl, {
            params: {
              ...albumParams,
              oauth_signature: albumSig
            },
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SGS-Locations/1.0'
            }
          });

          const albumDetails = albumResponse.data.Response.Album;

          const albumImagesUri = album.Uris?.AlbumImages?.Uri;
          let imageCount = 0;
          let thumbnailUrl = null;

          if (albumImagesUri) {
            const imagesUrl = `https://api.smugmug.com${albumImagesUri}`;
            const imagesParams = createOAuthParams(apiKey, tokenData.access_token);
            const imagesSig = generateOAuthSignature('GET', imagesUrl, imagesParams, apiSecret, tokenData.access_token_secret);

            const imagesResponse = await axios.get(imagesUrl, {
              params: {
                ...imagesParams,
                oauth_signature: imagesSig,
                count: 1
              },
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'SGS-Locations/1.0'
              },
              timeout: 5000
            });

            imageCount = imagesResponse.data.Response.Pages?.Total || 0;
            const firstImage = imagesResponse.data.Response.AlbumImage?.[0];

            if (firstImage?.Uris?.ImageSizes?.Uri) {
              const sizesUrl = `https://api.smugmug.com${firstImage.Uris.ImageSizes.Uri}`;
              const sizesParams = createOAuthParams(apiKey, tokenData.access_token);
              const sizesSig = generateOAuthSignature('GET', sizesUrl, sizesParams, apiSecret, tokenData.access_token_secret);

              const sizesResponse = await axios.get(sizesUrl, {
                params: {
                  ...sizesParams,
                  oauth_signature: sizesSig
                },
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'SGS-Locations/1.0'
                },
                timeout: 5000
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
            allowDownloads: albumDetails.AllowDownloads,
            protected: albumDetails.Protected,
            privacy: albumDetails.Privacy,
            sortMethod: albumDetails.SortMethod,
            lastUpdated: albumDetails.LastUpdated
          };
        } catch (error) {
          console.error(`Error getting metadata for album ${album.Name}:`, error);
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
