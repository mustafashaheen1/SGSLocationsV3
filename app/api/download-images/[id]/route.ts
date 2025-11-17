import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import archiver from 'archiver';
import { PassThrough } from 'stream';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const folderName = property.name.replace(/[^a-z0-9-\s]/gi, '').replace(/\s+/g, '-');
    const zipFilename = `${folderName}-images.zip`;

    const archive = archiver('zip', {
      zlib: { level: 6 }
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    let archiveFinalized = false;
    const finalizePromise = new Promise<void>((resolve, reject) => {
      archive.on('end', () => {
        console.log('✓ Archive finalized');
        archiveFinalized = true;
        resolve();
      });

      archive.on('error', (err) => {
        console.error('❌ Archive error:', err);
        reject(err);
      });
    });

    (async () => {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageNum = String(i + 1).padStart(3, '0');

        try {
          console.log(`[${i + 1}/${images.length}] Fetching...`);

          const response = await fetch(image.image_url, {
            signal: AbortSignal.timeout(15000)
          });

          if (!response.ok) {
            console.error(`✗ HTTP ${response.status}`);
            failCount++;
            continue;
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

          archive.append(buffer, { name: `${folderName}/${filename}` });

          successCount++;
          console.log(`✓ Added: ${filename}`);

        } catch (error: any) {
          console.error(`✗ Error:`, error.message);
          failCount++;
        }
      }

      console.log(`Images complete: ${successCount} success, ${failCount} failed`);

      console.log('Finalizing archive...');
      await archive.finalize();
      console.log('Archive finalized successfully');

    })().catch(err => {
      console.error('Error in image processing:', err);
      archive.emit('error', err);
    });

    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        passThrough.on('end', () => {
          controller.close();
        });

        passThrough.on('error', (err) => {
          console.error('Stream error:', err);
          controller.error(err);
        });
      }
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}
