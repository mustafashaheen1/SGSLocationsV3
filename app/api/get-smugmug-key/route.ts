import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    const response = await axios.get(url);
    const html = response.data;

    const metaMatch = html.match(/<meta property="og:url" content="[^"]*\/n-([^/"]+)/);
    if (metaMatch) {
      return NextResponse.json({ albumKey: metaMatch[1] });
    }

    const jsonMatch = html.match(/"AlbumKey":"([^"]+)"/);
    if (jsonMatch) {
      return NextResponse.json({ albumKey: jsonMatch[1] });
    }

    const apiMatch = html.match(/\/api\/v2\/album\/([^"!]+)/);
    if (apiMatch) {
      return NextResponse.json({ albumKey: apiMatch[1] });
    }

    return NextResponse.json({ error: 'Album key not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error extracting album key:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
