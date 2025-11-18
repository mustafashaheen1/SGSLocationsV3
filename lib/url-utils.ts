/**
 * Ensure URL has protocol prefix (https://)
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
}

/**
 * Normalize array of URLs
 */
export function normalizeUrls(urls: string[]): string[] {
  return urls.map(normalizeUrl);
}

/**
 * Validate if URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}
