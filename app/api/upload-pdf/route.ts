import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return jsonResponseNoCache({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return jsonResponseNoCache({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `pdfs/${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // ACL removed - bucket should have public access configured at bucket level
    });

    await s3Client.send(command);

    // Generate the final public URL
    let url: string;
    if (process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
      const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
      // Ensure CloudFront URL has https:// prefix
      const baseUrl = cloudFrontUrl.startsWith('http')
        ? cloudFrontUrl
        : `https://${cloudFrontUrl}`;
      url = `${baseUrl}/${fileName}`;
    } else {
      url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;
    }

    return jsonResponseNoCache({ url });
  } catch (error) {
    console.error('PDF upload error:', error);
    return jsonResponseNoCache({ error: 'Upload failed' }, { status: 500 });
  }
}
