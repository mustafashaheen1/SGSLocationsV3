import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    console.log('📍 Expanding shortened URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const finalUrl = response.url;
    console.log('✓ Expanded to:', finalUrl);

    return NextResponse.json({
      success: true,
      expandedUrl: finalUrl
    });

  } catch (error: any) {
    console.error('Error expanding URL:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
