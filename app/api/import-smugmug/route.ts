import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

    if (!albumKey) {
      return NextResponse.json({ error: 'Album key required' }, { status: 400 });
    }

    const smugmugResponse = await axios.get(
      `https://api.smugmug.com/api/v2/album/${albumKey}!images`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SMUGMUG_API_KEY}`
        }
      }
    );

    const images = smugmugResponse.data.Response.AlbumImage || [];
    const uploadedUrls: string[] = [];

    for (const image of images) {
      try {
        const imageDetailResponse = await axios.get(
          `https://api.smugmug.com${image.Uri}`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SMUGMUG_API_KEY}`
            }
          }
        );

        const largestImageUri = imageDetailResponse.data.Response.Image.Uris.LargestImage.Uri;

        const largestImageResponse = await axios.get(
          `https://api.smugmug.com${largestImageUri}`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SMUGMUG_API_KEY}`
            }
          }
        );

        const downloadUrl = largestImageResponse.data.Response.LargestImage.Url;

        const imageResponse = await axios.get(downloadUrl, {
          responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(imageResponse.data);
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
        const fileExtension = contentType.split('/')[1] || 'jpg';
        const fileName = `properties/${propertyId || 'temp'}/${randomUUID()}.${fileExtension}`;

        const command = new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        });

        await s3Client.send(command);

        const url = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
          ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${fileName}`
          : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;

        uploadedUrls.push(url);

        console.log(`Imported: ${image.FileName} -> ${url}`);
      } catch (imgError) {
        console.error(`Failed to import image ${image.FileName}:`, imgError);
      }
    }

    return NextResponse.json({
      success: true,
      imported: uploadedUrls.length,
      total: images.length,
      urls: uploadedUrls
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
