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

export async function POST(request: NextRequest) {
  try {
    const { albumKey, propertyId } = await request.json();

    console.log('=== SMUGMUG IMPORT DEBUG ===');
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

    const { data: tokenData, error: tokenError } = await supabase
      .from('smugmug_tokens')
      .select('access_token, access_token_secret')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        error: 'SmugMug not authorized',
        details: 'Please authorize SmugMug access first using the "Authorize SmugMug" button.',
        needsAuth: true
      }, { status: 401 });
    }

    console.log('✓ Using stored access token');

    const baseUrl = `https://api.smugmug.com/api/v2/album/${albumKey}!images`;

    const oauthParams = {
      ...createOAuthParams(apiKey, tokenData.access_token),
      _accept: 'application/json'
    };

    const signature = generateOAuthSignature(
      'GET',
      baseUrl,
      oauthParams,
      apiSecret,
      tokenData.access_token_secret
    );

    const allParams = { ...oauthParams, oauth_signature: signature };

    console.log('Fetching album images...');

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
      console.error('✗ Album fetch failed:', albumError.response?.data);

      if (albumError.response?.status === 401) {
        return NextResponse.json({
          error: 'Authorization expired',
          details: 'Please reauthorize SmugMug access.',
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
        error: 'No images found in this album'
      }, { status: 400 });
    }

    console.log(`✓ Found ${images.length} images`);
    console.log('Processing first 20...');

    const uploadedUrls: string[] = [];
    const errors: string[] = [];
    const imagesToProcess = images.slice(0, 20);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];

      try {
        console.log(`[${i + 1}/${imagesToProcess.length}] ${image.FileName}`);

        const imageUri = image.Uris?.Image?.Uri;
        if (!imageUri) throw new Error('No image URI');

        const imageUrl = `https://api.smugmug.com${imageUri}`;
        const imageOAuthParams = {
          ...createOAuthParams(apiKey, tokenData.access_token),
          _accept: 'application/json'
        };
        const imageSig = generateOAuthSignature('GET', imageUrl, imageOAuthParams, apiSecret, tokenData.access_token_secret);
        const imageAllParams = { ...imageOAuthParams, oauth_signature: imageSig };

        const imageResponse = await axios.get(imageUrl, {
          params: imageAllParams,
          timeout: 20000
        });

        const imageData = imageResponse.data.Response?.Image;
        if (!imageData?.Uris?.LargestImage?.Uri) throw new Error('No largest image URI');

        const largestUrl = `https://api.smugmug.com${imageData.Uris.LargestImage.Uri}`;
        const largestOAuthParams = {
          ...createOAuthParams(apiKey, tokenData.access_token),
          _accept: 'application/json'
        };
        const largestSig = generateOAuthSignature('GET', largestUrl, largestOAuthParams, apiSecret, tokenData.access_token_secret);
        const largestAllParams = { ...largestOAuthParams, oauth_signature: largestSig };

        const largestResponse = await axios.get(largestUrl, {
          params: largestAllParams,
          timeout: 20000
        });

        const downloadUrl = largestResponse.data.Response?.LargestImage?.Url;
        if (!downloadUrl) throw new Error('No download URL');

        const imgDownload = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          maxContentLength: 50 * 1024 * 1024
        });

        const buffer = Buffer.from(imgDownload.data);
        const contentType = imgDownload.headers['content-type'] || 'image/jpeg';
        const ext = contentType.split('/')[1] || 'jpg';
        const fileName = `properties/${propertyId || 'temp'}/${randomUUID()}.${ext}`;

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        }));

        const url = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
          ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${fileName}`
          : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;

        uploadedUrls.push(url);
        console.log(`  ✓ Success`);

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        console.error(`  ✗ Failed:`, err.message);
        errors.push(`${image.FileName}: ${err.message}`);
      }
    }

    console.log('=== COMPLETE ===');
    console.log(`Success: ${uploadedUrls.length}`);

    return NextResponse.json({
      success: true,
      imported: uploadedUrls.length,
      total: images.length,
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      note: images.length > 20 ? 'Imported first 20 images' : undefined
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: error.message || 'Import failed',
      details: error.response?.data?.Message || error.toString()
    }, { status: 500 });
  }
}
