import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
    const { fileName, fileType, folder = 'videos' } = await request.json();

    if (!fileName || !fileType) {
      return jsonResponseNoCache(
        { error: 'Missing fileName or fileType' },
        { status: 400 }
      );
    }

    // Generate unique file name
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${randomUUID()}.${fileExtension}`;

    // Create presigned URL for upload (valid for 10 minutes)
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
      Key: uniqueFileName,
      ContentType: fileType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600, // 10 minutes
    });

    // Generate the final public URL
    const publicUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
      ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${uniqueFileName}`
      : `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    return jsonResponseNoCache({
      uploadUrl,
      publicUrl,
      key: uniqueFileName,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return jsonResponseNoCache(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
