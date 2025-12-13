import { NextResponse } from 'next/server';

/**
 * Add no-cache headers to API responses to prevent stale auth issues
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

/**
 * Create a JSON response with no-cache headers
 */
export function jsonResponseNoCache(data: any, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  return addNoCacheHeaders(response);
}
