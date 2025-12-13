import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
export const runtime = 'edge';
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
export async function POST(request: NextRequest) {
import { jsonResponseNoCache } from '@/lib/api-helpers';
  try {
import { jsonResponseNoCache } from '@/lib/api-helpers';
    const { url } = await request.json();
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    if (!url) {
import { jsonResponseNoCache } from '@/lib/api-helpers';
      return jsonResponseNoCache({ error: 'URL is required' }, { status: 400 });
import { jsonResponseNoCache } from '@/lib/api-helpers';
    }
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    console.log('Fetching image:', url);
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    const response = await fetch(url, {
import { jsonResponseNoCache } from '@/lib/api-helpers';
      headers: {
import { jsonResponseNoCache } from '@/lib/api-helpers';
        'Accept': 'image/*',
import { jsonResponseNoCache } from '@/lib/api-helpers';
      },
import { jsonResponseNoCache } from '@/lib/api-helpers';
      signal: AbortSignal.timeout(10000)
import { jsonResponseNoCache } from '@/lib/api-helpers';
    });
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    if (!response.ok) {
import { jsonResponseNoCache } from '@/lib/api-helpers';
      console.error(`Failed to fetch ${url}: ${response.status}`);
import { jsonResponseNoCache } from '@/lib/api-helpers';
      return jsonResponseNoCache(
import { jsonResponseNoCache } from '@/lib/api-helpers';
        { error: `HTTP ${response.status}` },
import { jsonResponseNoCache } from '@/lib/api-helpers';
        { status: response.status }
import { jsonResponseNoCache } from '@/lib/api-helpers';
      );
import { jsonResponseNoCache } from '@/lib/api-helpers';
    }
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    const arrayBuffer = await response.arrayBuffer();
import { jsonResponseNoCache } from '@/lib/api-helpers';
    const buffer = Buffer.from(arrayBuffer);
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    const base64 = buffer.toString('base64');
import { jsonResponseNoCache } from '@/lib/api-helpers';
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
import { jsonResponseNoCache } from '@/lib/api-helpers';
    const base64Image = `data:${mimeType};base64,${base64}`;
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    console.log(`Successfully fetched image: ${url.substring(0, 50)}... (${buffer.length} bytes)`);
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
    return jsonResponseNoCache({ base64: base64Image });
import { jsonResponseNoCache } from '@/lib/api-helpers';

import { jsonResponseNoCache } from '@/lib/api-helpers';
  } catch (error: any) {
import { jsonResponseNoCache } from '@/lib/api-helpers';
    console.error('Error fetching image:', error);
import { jsonResponseNoCache } from '@/lib/api-helpers';
    return jsonResponseNoCache(
import { jsonResponseNoCache } from '@/lib/api-helpers';
      { error: 'Failed to fetch image', details: error.message },
import { jsonResponseNoCache } from '@/lib/api-helpers';
      { status: 500 }
import { jsonResponseNoCache } from '@/lib/api-helpers';
    );
import { jsonResponseNoCache } from '@/lib/api-helpers';
  }
import { jsonResponseNoCache } from '@/lib/api-helpers';
}
import { jsonResponseNoCache } from '@/lib/api-helpers';
