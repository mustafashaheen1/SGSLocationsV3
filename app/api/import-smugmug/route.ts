import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { randomUUID } from 'crypto';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
}

export async function POST(request: NextRequest) {
  try {
    const { albumKey, propertyId } = await request.json();

    if (!albumKey) {
      return NextResponse.json({ error: 'Album key required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    const apiSecret = process.env.SMUGMUG_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        error: 'SmugMug credentials not configured. Please add NEXT_PUBLIC_SMUGMUG_API_KEY and SMUGMUG_API_SECRET to Vercel environment variables.'
      }, { status: 500 });
    }

    console.log('Starting SmugMug import with OAuth...');

    const baseUrl = `https://api.smugmug.com/api/v2/album/${albumKey}!images`;

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
      _accept: 'application/json'
    };

    const signature = generateOAuthSignature('GET', baseUrl, oauthParams, apiSecret);
    oauthParams.oauth_signature = signature;

    const albumResponse = await axios.get(baseUrl, {
      params: oauthParams,
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const images = albumResponse.data.Response?.AlbumImage || [];

    if (images.length === 0) {
      return NextResponse.json({
        error: 'No images found in this album'
      }, { status: 400 });
    }

    console.log(`Found ${images.length} images. Processing first 20...`);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    const imagesToProcess = images.slice(0, 20);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];

      try {
        console.log(`Processing image ${i + 1}/${imagesToProcess.length}: ${image.FileName}`);

        const imageUri = image.Uris?.Image?.Uri;
        if (!imageUri) {
          throw new Error('No image URI');
        }

        const imageUrl = `https://api.smugmug.com${imageUri}`;
        const imageOAuthParams: Record<string, string> = {
          oauth_consumer_key: apiKey,
          oauth_nonce: crypto.randomBytes(16).toString('hex'),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
          oauth_version: '1.0',
          _accept: 'application/json'
        };
        const imageSig = generateOAuthSignature('GET', imageUrl, imageOAuthParams, apiSecret);
        imageOAuthParams.oauth_signature = imageSig;

        const imageResponse = await axios.get(imageUrl, {
          params: imageOAuthParams,
          timeout: 20000
        });

        const imageData = imageResponse.data.Response?.Image;
        if (!imageData?.Uris?.LargestImage?.Uri) {
          throw new Error('No largest image URI');
        }

        const largestUrl = `https://api.smugmug.com${imageData.Uris.LargestImage.Uri}`;
        const largestOAuthParams: Record<string, string> = {
          oauth_consumer_key: apiKey,
          oauth_nonce: crypto.randomBytes(16).toString('hex'),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
          oauth_version: '1.0',
          _accept: 'application/json'
        };
        const largestSig = generateOAuthSignature('GET', largestUrl, largestOAuthParams, apiSecret);
        largestOAuthParams.oauth_signature = largestSig;

        const largestResponse = await axios.get(largestUrl, {
          params: largestOAuthParams,
          timeout: 20000
        });

        const downloadUrl = largestResponse.data.Response?.LargestImage?.Url;
        if (!downloadUrl) {
          throw new Error('No download URL');
        }

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
        console.log(`✓ Uploaded: ${image.FileName}`);

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        console.error(`✗ Failed ${image.FileName}:`, err.message);
        errors.push(`${image.FileName}: ${err.message}`);
      }
    }

    console.log(`Import complete: ${uploadedUrls.length} succeeded, ${errors.length} failed`);

    return NextResponse.json({
      success: true,
      imported: uploadedUrls.length,
      total: images.length,
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      note: images.length > 20 ? 'Imported first 20 images to avoid timeout' : undefined
    });

  } catch (error: any) {
    console.error('Import error:', error);

    if (error.response?.status === 401) {
      return NextResponse.json({
        error: 'SmugMug authentication failed',
        details: 'Please check that both API Key and API Secret are correctly configured in Vercel environment variables.'
      }, { status: 401 });
    }

    return NextResponse.json({
      error: error.message || 'Import failed',
      details: error.response?.data?.Message || error.toString()
    }, { status: 500 });
  }
}
