import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only add no-cache headers to HTML pages, not API routes or auth
  const path = request.nextUrl.pathname;

  // Skip cache headers for:
  // - API routes (need to work with auth)
  // - Auth callbacks (Supabase auth)
  // - Static files
  const skipCacheHeaders =
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.includes('/auth/');

  if (!skipCacheHeaders) {
    // Only set cache control for page navigations
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');
  }

  return response;
}

// Apply middleware selectively
export const config = {
  matcher: [
    /*
     * Match all request paths except static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
