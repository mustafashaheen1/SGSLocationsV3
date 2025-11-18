interface AddressComponents {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress: string;
}

/**
 * Extract Google Maps link from text
 */
export function extractGoogleMapsLink(text: string): string | null {
  if (!text) return null;

  const patterns = [
    /https?:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+/,
    /https?:\/\/goo\.gl\/maps\/[a-zA-Z0-9]+/,
    /https?:\/\/maps\.google\.com\/\?q=[^&\s]+/,
    /https?:\/\/www\.google\.com\/maps\/place\/[^&\s]+/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Expand shortened Google Maps URL
 */
async function expandShortenedUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });
    return response.url;
  } catch (error) {
    console.error('Error expanding URL:', error);
    return shortUrl;
  }
}

/**
 * Extract coordinates from Google Maps URL
 */
function extractCoordinates(url: string): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2])
    };
  }

  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return {
      lat: parseFloat(qMatch[1]),
      lng: parseFloat(qMatch[2])
    };
  }

  return null;
}

/**
 * Get address from Google Maps Geocoding API
 */
async function geocodeCoordinates(lat: number, lng: number): Promise<AddressComponents | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status);
      return null;
    }

    const result = data.results[0];
    const components = result.address_components;

    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let country = '';

    components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        route = component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
    });

    const streetAddress = `${streetNumber} ${route}`.trim();

    return {
      streetAddress,
      city,
      state,
      zipCode,
      country,
      fullAddress: result.formatted_address
    };
  } catch (error) {
    console.error('Error geocoding:', error);
    return null;
  }
}

/**
 * Main function: Extract address from Google Maps link
 */
export async function getAddressFromGoogleMapsLink(
  mapsLink: string
): Promise<AddressComponents | null> {
  try {
    console.log('📍 Extracting address from Google Maps link:', mapsLink);

    let fullUrl = mapsLink;
    if (mapsLink.includes('maps.app.goo.gl') || mapsLink.includes('goo.gl/maps')) {
      console.log('  Expanding shortened URL...');
      fullUrl = await expandShortenedUrl(mapsLink);
      console.log('  Expanded to:', fullUrl);
    }

    const coords = extractCoordinates(fullUrl);

    if (!coords) {
      console.error('  Could not extract coordinates from URL');
      return null;
    }

    console.log(`  Coordinates: ${coords.lat}, ${coords.lng}`);

    const address = await geocodeCoordinates(coords.lat, coords.lng);

    if (address) {
      console.log('  ✓ Address extracted:', address.fullAddress);
    }

    return address;
  } catch (error) {
    console.error('Error extracting address:', error);
    return null;
  }
}

/**
 * Search SmugMug metadata for Google Maps links
 */
export function findGoogleMapsLinkInMetadata(metadata: {
  name?: string;
  description?: string;
  keywords?: string;
}): string | null {
  if (metadata.description) {
    const link = extractGoogleMapsLink(metadata.description);
    if (link) return link;
  }

  if (metadata.keywords) {
    const link = extractGoogleMapsLink(metadata.keywords);
    if (link) return link;
  }

  if (metadata.name) {
    const link = extractGoogleMapsLink(metadata.name);
    if (link) return link;
  }

  return null;
}
