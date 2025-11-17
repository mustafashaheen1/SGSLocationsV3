import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Fetching image:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return NextResponse.json(
        { error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${base64}`;

    console.log(`Successfully fetched image: ${url.substring(0, 50)}... (${buffer.length} bytes)`);

    return NextResponse.json({ base64: base64Image });

  } catch (error: any) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image', details: error.message },
      { status: 500 }
    );
  }
}
