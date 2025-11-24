import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-1';
const AWS_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || '';
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

function validateS3Config() {
  if (!AWS_ACCESS_KEY_ID) {
    throw new Error('AWS Access Key ID is not configured. Please set NEXT_PUBLIC_AWS_ACCESS_KEY_ID in .env');
  }
  if (!AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS Secret Access Key is not configured. Please set NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY in .env');
  }
  if (!BUCKET_NAME) {
    throw new Error('AWS S3 Bucket is not configured. Please set NEXT_PUBLIC_AWS_S3_BUCKET in .env');
  }
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
}

export async function uploadImageToS3(file: File, folder: string = 'properties'): Promise<string> {
  try {
    validateS3Config();

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
      // Ensure CloudFront URL has https:// prefix
      const baseUrl = CLOUDFRONT_URL.startsWith('http')
        ? CLOUDFRONT_URL
        : `https://${CLOUDFRONT_URL}`;
      return `${baseUrl}/${fileName}`;
    }

    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

export async function uploadMultipleImages(files: File[], folder: string = 'properties'): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImageToS3(file, folder));
  return Promise.all(uploadPromises);
}

export async function deleteImageFromS3(imageUrl: string): Promise<void> {
  try {
    validateS3Config();

    const url = new URL(imageUrl);
    const key = url.pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error: any) {
    console.error('Error deleting from S3:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
}

/**
 * Upload a document file to S3 documents folder
 * @param file - The document file to upload
 * @param subfolder - Optional subfolder within documents (e.g., 'contracts', 'invoices')
 * @returns The full URL of the uploaded document
 */
export async function uploadDocumentToS3(file: File, subfolder: string = ''): Promise<string> {
  try {
    validateS3Config();

    const folder = subfolder ? `documents/${subfolder}` : 'documents';
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
      const baseUrl = CLOUDFRONT_URL.startsWith('http')
        ? CLOUDFRONT_URL
        : `https://${CLOUDFRONT_URL}`;
      return `${baseUrl}/${fileName}`;
    }

    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error: any) {
    console.error('Error uploading document to S3:', error);
    throw new Error(error.message || 'Failed to upload document');
  }
}

/**
 * Delete a document from S3
 * @param documentUrl - The full URL of the document to delete
 */
export async function deleteDocumentFromS3(documentUrl: string): Promise<void> {
  try {
    validateS3Config();

    const url = new URL(documentUrl);
    const key = url.pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✓ Deleted document: ${documentUrl}`);
  } catch (error: any) {
    console.error('Error deleting document from S3:', error);
    throw new Error(error.message || 'Failed to delete document');
  }
}
