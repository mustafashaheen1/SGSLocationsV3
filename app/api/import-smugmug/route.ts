import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabase';
import { generateOAuthSignature, createOAuthParams } from '@/lib/smugmug-oauth';
import axios from 'axios';
import { randomUUID } from 'crypto';

function createS3Client() {
  // Use server-side environment variables (NO NEXT_PUBLIC_ prefix)
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;

  console.log('AWS Credentials Check:');
  console.log('  - Region:', region);
  console.log('  - Bucket:', bucketName);
  console.log('  - Access Key exists:', !!accessKeyId);
  console.log('  - Access Key length:', accessKeyId?.length || 0);
  console.log('  - Access Key (first 10):', accessKeyId?.substring(0, 10) || 'MISSING');
  console.log('  - Secret Key exists:', !!secretAccessKey);
  console.log('  - Secret Key length:', secretAccessKey?.length || 0);
  console.log('  - Secret Key (first 10):', secretAccessKey?.substring(0, 10) || 'MISSING');

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured. Check AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in Vercel');
  }

  if (accessKeyId.length < 16 || secretAccessKey.length < 40) {
    throw new Error('AWS credentials appear invalid. Access key should be ~20 chars, secret should be ~40 chars.');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

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

    console.log('Environment Variables Check:');
    console.log('  - API Key:', apiKey);
    console.log('  - API Secret (first 15):', apiSecret.substring(0, 15));
    console.log('  - API Secret length:', apiSecret.length);

    console.log('📡 Fetching stored access tokens...');

    const { data: tokenData, error: tokenError } = await supabase
      .from('smugmug_tokens')
      .select('access_token, access_token_secret')
      .eq('is_temporary', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Token Validation:');
    console.log('  - tokenData:', !!tokenData);
    console.log('  - access_token:', tokenData?.access_token ? `${tokenData.access_token.substring(0, 20)}...` : 'MISSING');
    console.log('  - access_token length:', tokenData?.access_token?.length || 0);
    console.log('  - access_token_secret:', tokenData?.access_token_secret ? `${tokenData.access_token_secret.substring(0, 20)}...` : 'MISSING');
    console.log('  - secret length:', tokenData?.access_token_secret?.length || 0);

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

    const oauthParams = createOAuthParams(apiKey, tokenData.access_token.trim());

    console.log('OAuth Parameters:');
    Object.keys(oauthParams).forEach(key => {
      console.log(`  ${key}: ${oauthParams[key as keyof typeof oauthParams]}`);
    });

    console.log('\nSignature Generation:');
    console.log('  - Method: GET');
    console.log('  - URL:', baseUrl);
    console.log('  - Consumer Secret (first 15):', apiSecret.substring(0, 15));
    console.log('  - Token Secret (first 15):', tokenData.access_token_secret.substring(0, 15));

    const signature = generateOAuthSignature(
      'GET',
      baseUrl,
      oauthParams,
      apiSecret.trim(),
      tokenData.access_token_secret.trim()
    );

    console.log('  - Generated Signature:', signature.substring(0, 30) + '...');

    const sortedParams = Object.keys(oauthParams)
      .sort()
      .map(key => {
        const value = oauthParams[key as keyof typeof oauthParams];
        return `${encodeURIComponent(key)}=${encodeURIComponent(value || '')}`;
      })
      .join('&');

    const ourSBS = `GET&${encodeURIComponent(baseUrl)}&${encodeURIComponent(sortedParams)}`;
    console.log('  - Our SBS:', ourSBS);

    const allParams = {
      ...oauthParams,
      oauth_signature: signature
    };

    console.log('📸 Fetching album images from SmugMug...');
    console.log('  - Using OAuth params only (no _accept)');

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
    console.log(`📥 Processing all ${images.length} images...`);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];
    const imagesToProcess = images;

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
          oauth_signature: imageSig
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
          oauth_signature: largestSig
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

        const s3Client = createS3Client();
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
          Key: fileName,
          Body: Buffer.from(imageBuffer.data),
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        }));

        const s3Url = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
          ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${fileName}`
          : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

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
      urls: uploadedUrls,
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
