import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabase';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import axios from 'axios';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { albumKey, propertyId } = await request.json();

    console.log('=== SMUGMUG IMPORT STARTED ===');
    console.log('Album Key:', albumKey);

    if (!albumKey) {
      return NextResponse.json({ error: 'Album key required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        error: 'SmugMug credentials not configured'
      }, { status: 500 });
    }

    console.log('📡 Fetching stored access tokens...');

    const { data: tokenData, error: tokenError } = await supabase
      .from('smugmug_tokens')
      .select('access_token, access_token_secret')
      .eq('is_temporary', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !tokenData || !tokenData.access_token || !tokenData.access_token_secret) {
      console.error('❌ No valid tokens found');
      return NextResponse.json({
        error: 'SmugMug not authorized',
        details: 'Please authorize SmugMug access first.',
        needsAuth: true
      }, { status: 401 });
    }

    console.log('✓ Access tokens retrieved');

    const baseUrl = `https://api.smugmug.com/api/v2/album/${albumKey}!images`;

    const oauthParams = createOAuthParams(apiKey, tokenData.access_token);

    const signature = generateOAuthSignature(
      'GET',
      baseUrl,
      oauthParams,
      apiSecret,
      tokenData.access_token_secret
    );

    const allParams = {
      ...oauthParams,
      oauth_signature: signature,
      _accept: 'application/json'
    };

    console.log('📸 Fetching album images from SmugMug...');

    let albumResponse;
    try {
      albumResponse = await axios.get(baseUrl, {
        params: allParams,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SGS-Locations/1.0'
        },
        timeout: 30000
      });
      console.log('✓ Album fetch successful');
    } catch (albumError: any) {
      console.error('❌ Album fetch failed');
      console.error('Status:', albumError.response?.status);
      console.error('Error:', albumError.response?.data);

      if (albumError.response?.status === 401) {
        return NextResponse.json({
          error: 'Authorization expired',
          details: 'Please reauthorize SmugMug access using the "Authorize SmugMug" button.',
          needsReauth: true
        }, { status: 401 });
      }

      return NextResponse.json({
        error: 'SmugMug API request failed',
        details: albumError.response?.data?.Message || albumError.message
      }, { status: albumError.response?.status || 500 });
    }

    const images = albumResponse.data.Response?.AlbumImage || [];

    if (images.length === 0) {
      return NextResponse.json({
        error: 'No images found in album',
        details: 'This album appears to be empty.'
      }, { status: 400 });
    }

    console.log(`✓ Found ${images.length} images in album`);
    console.log('📥 Processing first 20 images...');

    const uploadedUrls: string[] = [];
    const errors: string[] = [];
    const imagesToProcess = images.slice(0, 20);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];

      try {
        console.log(`[${i + 1}/${imagesToProcess.length}] Processing ${image.FileName}`);

        const imageUri = image.Uris?.Image?.Uri;
        if (!imageUri) {
          throw new Error('No image URI found');
        }

        const imageUrl = `https://api.smugmug.com${imageUri}`;

        const imageOAuthParams = createOAuthParams(apiKey, tokenData.access_token);
        const imageSig = generateOAuthSignature('GET', imageUrl, imageOAuthParams, apiSecret, tokenData.access_token_secret);
        const imageAllParams = {
          ...imageOAuthParams,
          oauth_signature: imageSig,
          _accept: 'application/json'
        };

        const imageResponse = await axios.get(imageUrl, {
          params: imageAllParams,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SGS-Locations/1.0'
          },
          timeout: 20000
        });

        const imageData = imageResponse.data.Response?.Image;
        if (!imageData?.Uris?.LargestImage?.Uri) {
          throw new Error('No largest image URI found');
        }

        const largestUrl = `https://api.smugmug.com${imageData.Uris.LargestImage.Uri}`;

        const largestOAuthParams = createOAuthParams(apiKey, tokenData.access_token);
        const largestSig = generateOAuthSignature('GET', largestUrl, largestOAuthParams, apiSecret, tokenData.access_token_secret);
        const largestAllParams = {
          ...largestOAuthParams,
          oauth_signature: largestSig,
          _accept: 'application/json'
        };

        const largestResponse = await axios.get(largestUrl, {
          params: largestAllParams,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SGS-Locations/1.0'
          },
          timeout: 20000
        });

        const downloadUrl = largestResponse.data.Response?.LargestImage?.Url;
        if (!downloadUrl) {
          throw new Error('No download URL found');
        }

        console.log(`  ↓ Downloading from SmugMug...`);

        const imageBuffer = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });

        const fileName = `properties/${randomUUID()}.jpg`;

        console.log(`  ↑ Uploading to S3...`);

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
          Key: fileName,
          Body: Buffer.from(imageBuffer.data),
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        }));

        const s3Url = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
          ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${fileName}`
          : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;

        uploadedUrls.push(s3Url);
        console.log(`  ✓ Uploaded: ${s3Url.substring(0, 60)}...`);

      } catch (error: any) {
        console.error(`  ✗ Failed: ${error.message}`);
        errors.push(`${image.FileName}: ${error.message}`);
      }
    }

    console.log('=== IMPORT COMPLETE ===');
    console.log(`✓ Successfully imported: ${uploadedUrls.length}`);
    console.log(`✗ Failed: ${errors.length}`);

    return NextResponse.json({
      success: true,
      uploadedUrls,
      total: images.length,
      imported: uploadedUrls.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${uploadedUrls.length} of ${imagesToProcess.length} images`
    });

  } catch (error: any) {
    console.error('=== IMPORT ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json({
      error: 'Import failed',
      details: error.message
    }, { status: 500 });
  }
}
