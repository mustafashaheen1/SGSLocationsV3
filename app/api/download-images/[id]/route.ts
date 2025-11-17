import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📦 Starting ZIP generation for property:', params.id);

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { data: images, error: imagesError } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', params.id)
      .order('display_order');

    if (imagesError || !images || images.length === 0) {
      return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    console.log(`Found ${images.length} images to download`);

    const zip = new JSZip();
    const propertyFolder = zip.folder(property.name.replace(/[^a-z0-9]/gi, '-'));

    if (!propertyFolder) {
      throw new Error('Failed to create ZIP folder');
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageNum = String(i + 1).padStart(3, '0');

      try {
        console.log(`Downloading image ${i + 1}/${images.length}`);

        const response = await fetch(image.image_url, {
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          console.error(`Failed to fetch image ${image.image_url}: ${response.status}`);
          failCount++;
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const urlParts = image.image_url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';

        let filename = `${imageNum}`;
        if (image.tags && image.tags.length > 0) {
          const tagText = image.tags.slice(0, 2).join('-').replace(/[^a-z0-9-]/gi, '-');
          filename += `-${tagText}`;
        }
        filename += `.${extension}`;

        propertyFolder.file(filename, buffer);
        successCount++;

      } catch (error: any) {
        console.error(`Error downloading image ${image.image_url}:`, error.message);
        failCount++;
      }
    }

    console.log(`✅ ZIP complete: ${successCount} successful, ${failCount} failed`);

    if (successCount === 0) {
      return NextResponse.json(
        { error: 'Failed to download any images' },
        { status: 500 }
      );
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const zipFilename = `${property.name.replace(/[^a-z0-9]/gi, '-')}-images.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file', details: error.message },
      { status: 500 }
    );
  }
}
