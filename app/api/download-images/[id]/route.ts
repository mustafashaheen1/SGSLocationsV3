import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let JSZip: any;
try {
  JSZip = require('jszip');
} catch (e) {
  console.error('JSZip not installed. Run: npm install jszip');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const propertyId = params.id;

    console.log('📦 Starting ZIP generation for property:', propertyId);

    if (!JSZip) {
      return NextResponse.json(
        { error: 'Server configuration error: JSZip not installed' },
        { status: 500 }
      );
    }

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property not found:', propertyError);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    console.log('✓ Property found:', property.name);

    const { data: images, error: imagesError } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order');

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images found for this property' },
        { status: 404 }
      );
    }

    console.log(`✓ Found ${images.length} images`);

    const zip = new JSZip();
    const folderName = property.name.replace(/[^a-z0-9]/gi, '-');
    const propertyFolder = zip.folder(folderName);

    if (!propertyFolder) {
      throw new Error('Failed to create ZIP folder');
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageNum = String(i + 1).padStart(3, '0');

      try {
        console.log(`Downloading ${i + 1}/${images.length}: ${image.image_url.substring(0, 50)}...`);

        const response = await fetch(image.image_url, {
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          console.error(`Failed to fetch: ${response.status}`);
          failCount++;
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const urlParts = image.image_url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';

        let filename = `${imageNum}`;
        if (image.tags && image.tags.length > 0) {
          const tagText = image.tags
            .slice(0, 2)
            .join('-')
            .replace(/[^a-z0-9-]/gi, '-')
            .substring(0, 30);
          filename += `-${tagText}`;
        }
        filename += `.${extension}`;

        propertyFolder.file(filename, buffer);
        successCount++;
        console.log(`✓ Added: ${filename}`);

      } catch (error: any) {
        console.error(`✗ Failed:`, error.message);
        failCount++;
      }
    }

    console.log(`ZIP complete: ${successCount} successful, ${failCount} failed`);

    if (successCount === 0) {
      return NextResponse.json(
        { error: 'Failed to download any images' },
        { status: 500 }
      );
    }

    console.log('Generating ZIP file...');
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    console.log(`✓ ZIP generated: ${zipBuffer.length} bytes`);

    const zipFilename = `${folderName}-images.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Error generating ZIP:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate ZIP file',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
