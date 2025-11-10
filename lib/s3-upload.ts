import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET!;
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

export async function uploadImageToS3(file: File, folder: string = 'properties'): Promise<string> {
  try {
    const fileName = `${folder}/${generateUniqueFileName(file.name)}`;

    const buffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(buffer),
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    if (CLOUDFRONT_URL) {
      return `${CLOUDFRONT_URL}/${fileName}`;
    }
    return `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadMultipleImages(files: File[], folder: string = 'properties'): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImageToS3(file, folder));
  return Promise.all(uploadPromises);
}

export async function deleteImageFromS3(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const key = url.pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete image');
  }
}
