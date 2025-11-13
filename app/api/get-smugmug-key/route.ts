import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    console.log('Attempting to extract album key from:', url);

    const hasApiKey = !!process.env.NEXT_PUBLIC_SMUGMUG_API_KEY;
    console.log('SmugMug API Key configured:', hasApiKey);

    let html: string;
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000
      });
      html = response.data;
      console.log('Successfully fetched SmugMug page');
    } catch (fetchError: any) {
      console.error('Error fetching SmugMug page:', fetchError.message);

      if (hasApiKey) {
        console.log('Trying API method as fallback...');
        return await extractFromApiPath(url);
      } else {
        throw new Error('Cannot fetch page and no API key configured. Please enter album key manually.');
      }
    }

    const albumKeyMatch = html.match(/"AlbumKey":"([^"]+)"/);
    if (albumKeyMatch) {
      console.log('✓ Found album key via JSON:', albumKeyMatch[1]);
      return NextResponse.json({ albumKey: albumKeyMatch[1] });
    }

    const dataConfigMatch = html.match(/data-config='([^']+)'/);
    if (dataConfigMatch) {
      try {
        const config = JSON.parse(dataConfigMatch[1].replace(/&quot;/g, '"'));
        if (config.albumKey) {
          console.log('✓ Found album key in data-config:', config.albumKey);
          return NextResponse.json({ albumKey: config.albumKey });
        }
      } catch (e) {
        console.log('Could not parse data-config');
      }
    }

    const apiMatch = html.match(/https:\/\/api\.smugmug\.com\/api\/v2\/album\/([^"!\/\s]+)/);
    if (apiMatch) {
      console.log('✓ Found album key in API URL:', apiMatch[1]);
      return NextResponse.json({ albumKey: apiMatch[1] });
    }

    const scriptMatch = html.match(/"albumKey"\s*:\s*"([^"]+)"/i);
    if (scriptMatch) {
      console.log('✓ Found album key in script:', scriptMatch[1]);
      return NextResponse.json({ albumKey: scriptMatch[1] });
    }

    if (hasApiKey) {
      console.log('HTML parsing failed, trying API method...');
      return await extractFromApiPath(url);
    }

    throw new Error('Could not extract album key from page. Please use the manual album key field below.');

  } catch (error: any) {
    console.error('Error in get-smugmug-key:', error);
    return NextResponse.json({
      error: error.message || 'Album key extraction failed',
      suggestion: 'Please enter the album key manually in the field below'
    }, { status: 500 });
  }
}

async function extractFromApiPath(url: string) {
  try {
    const urlObj = new URL(url);
    const username = urlObj.hostname.split('.')[0];

    console.log('Trying API method for username:', username);

    if (!process.env.NEXT_PUBLIC_SMUGMUG_API_KEY) {
      throw new Error('SmugMug API key not configured');
    }

    const response = await axios.get(
      `https://api.smugmug.com/api/v2/user/${username}!albums`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SMUGMUG_API_KEY}`
        }
      }
    );

    const albums = response.data.Response.Album || [];
    const urlPath = urlObj.pathname;

    console.log('Looking for album with path:', urlPath);
    console.log('Found', albums.length, 'albums');

    const album = albums.find((a: any) => {
      const albumPath = a.WebUri?.replace(`https://${username}.smugmug.com`, '') || '';
      const albumUrlPath = a.UrlPath || '';

      return albumPath === urlPath || albumUrlPath === urlPath ||
             albumPath.endsWith(urlPath) || albumUrlPath.endsWith(urlPath);
    });

    if (album && album.AlbumKey) {
      console.log('✓ Found album via API:', album.AlbumKey);
      return NextResponse.json({ albumKey: album.AlbumKey });
    }

    throw new Error(`Album not found in ${albums.length} albums`);

  } catch (apiError: any) {
    console.error('API extraction failed:', apiError.message);
    throw apiError;
  }
}
