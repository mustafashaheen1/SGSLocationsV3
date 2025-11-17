import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BATCH_SIZE = 10;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const propertyId = params.id;

    console.log('📦 Starting ZIP generation for property:', propertyId);

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    console.log('✓ Property:', property.name);

    const { data: images, error: imagesError } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order');

    if (imagesError || !images || images.length === 0) {
      return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    console.log(`✓ Found ${images.length} images`);

    const zip = new JSZip();
    const folderName = property.name.replace(/[^a-z0-9-\s]/gi, '').replace(/\s+/g, '-');
    const folder = zip.folder(folderName);

    if (!folder) {
      throw new Error('Failed to create folder in ZIP');
    }

    let successCount = 0;
    let failCount = 0;

    for (let batchStart = 0; batchStart < images.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, images.length);
      const batch = images.slice(batchStart, batchEnd);

      console.log(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(images.length / BATCH_SIZE)}`);

      const batchResults = await Promise.allSettled(
        batch.map(async (image, batchIndex) => {
          const globalIndex = batchStart + batchIndex;
          const imageNum = String(globalIndex + 1).padStart(3, '0');

          try {
            console.log(`  [${globalIndex + 1}/${images.length}] Fetching...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(image.image_url, {
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const urlMatch = image.image_url.match(/\.([a-z0-9]+)(\?|$)/i);
            const extension = urlMatch ? urlMatch[1] : 'jpg';

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

            folder.file(filename, buffer);

            console.log(`  ✓ ${filename}`);
            return { success: true, filename };

          } catch (error: any) {
            console.error(`  ✗ Failed image ${globalIndex + 1}:`, error.message);
            return { success: false, error: error.message };
          }
        })
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          failCount++;
        }
      });

      console.log(`  Batch complete: ${successCount} total success, ${failCount} total failed so far`);
    }

    console.log(`All images processed: ${successCount} success, ${failCount} failed`);

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
      compressionOptions: {
        level: 6
      },
      streamFiles: false
    });

    console.log(`✓ ZIP generated successfully: ${zipBuffer.length} bytes`);

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
    console.error('❌ Fatal error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}
