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
 * Expand shortened Google Maps URL using backend
 */
async function expandShortenedUrl(shortUrl: string): Promise<string> {
  try {
    console.log('  Calling backend to expand URL...');

    const response = await fetch('/api/expand-google-maps-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: shortUrl })
    });

    if (!response.ok) {
      throw new Error('Backend expansion failed');
    }

    const data = await response.json();

    if (data.success && data.expandedUrl) {
      console.log('  ✓ URL expanded:', data.expandedUrl);
      return data.expandedUrl;
    }

    return shortUrl;
  } catch (error) {
    console.error('  Error expanding URL, using original:', error);
    return shortUrl;
  }
}

/**
 * Extract Place ID from Google Maps URL
 */
function extractPlaceId(url: string): string | null {
  const placeMatch = url.match(/\/place\/([^\/]+)/);
  if (placeMatch) {
    return placeMatch[1];
  }

  const ftidMatch = url.match(/ftid=([^&]+)/);
  if (ftidMatch) {
    return ftidMatch[1];
  }

  return null;
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
 * Parse formatted address into components
 */
function parseFormattedAddress(formattedAddress: string): AddressComponents | null {
  console.log('  Parsing formatted address:', formattedAddress);

  const parts = formattedAddress.split(',').map(p => p.trim());

  if (parts.length < 3) {
    console.log('  ⚠️ Cannot parse formatted address');
    return null;
  }

  const streetAddress = parts[0];
  const city = parts[1];

  const stateZipMatch = parts[2].match(/([A-Z]{2})\s+(\d{5})/);
  const state = stateZipMatch ? stateZipMatch[1] : '';
  const zipCode = stateZipMatch ? stateZipMatch[2] : '';

  const country = parts[3] || '';

  console.log('  Parsed result:', { streetAddress, city, state, zipCode });

  return {
    streetAddress,
    city,
    state,
    zipCode,
    country,
    fullAddress: formattedAddress
  };
}

/**
 * Get address from Google Maps Geocoding API
 */
async function geocodeCoordinates(lat: number, lng: number): Promise<AddressComponents | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('❌ Google Maps API key not configured');
    console.error('  Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in environment variables');
    return null;
  }

  console.log('  API Key present:', apiKey.substring(0, 10) + '...');

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    console.log('  Geocoding URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const data = await response.json();

    console.log('  Geocoding response status:', data.status);

    if (data.status === 'REQUEST_DENIED') {
      console.error('  ❌ API Key is invalid or Geocoding API not enabled');
      console.error('  Error message:', data.error_message);
      return null;
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('  ❌ API quota exceeded');
      return null;
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('  ❌ Geocoding failed with status:', data.status);
      console.error('  Error:', data.error_message);
      return null;
    }

    console.log('  ✓ Geocoding successful');

    const result = data.results[0];

    console.log('  Full formatted address:', result.formatted_address);

    const parsedAddress = parseFormattedAddress(result.formatted_address);
    if (parsedAddress && parsedAddress.streetAddress && parsedAddress.zipCode) {
      console.log('  ✓ Successfully parsed from formatted address');
      return parsedAddress;
    }

    console.log('  Falling back to component parsing...');
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

    console.log('  Parsed components:');
    console.log('    Street Number:', streetNumber);
    console.log('    Route:', route);
    console.log('    City:', city);
    console.log('    State:', state);
    console.log('    Zip:', zipCode);

    return {
      streetAddress: streetAddress || result.formatted_address.split(',')[0],
      city,
      state,
      zipCode,
      country,
      fullAddress: result.formatted_address
    };
  } catch (error: any) {
    console.error('  ❌ Geocoding error:', error);
    console.error('  Error message:', error.message);
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
    console.log('📍 Starting address extraction...');
    console.log('  Input URL:', mapsLink);

    let fullUrl = mapsLink;
    if (mapsLink.includes('maps.app.goo.gl') || mapsLink.includes('goo.gl/maps')) {
      console.log('  URL is shortened, expanding...');
      fullUrl = await expandShortenedUrl(mapsLink);
      console.log('  Expanded URL:', fullUrl);
    } else {
      console.log('  URL is not shortened');
    }

    console.log('  Extracting coordinates...');
    const coords = extractCoordinates(fullUrl);

    if (!coords) {
      console.error('  ❌ Could not extract coordinates from URL');
      console.error('  URL tried:', fullUrl);
      return null;
    }

    console.log(`  ✓ Coordinates found: ${coords.lat}, ${coords.lng}`);
    console.log('  Calling Google Geocoding API...');

    const address = await geocodeCoordinates(coords.lat, coords.lng);

    if (address) {
      console.log('  ✓ Address extracted successfully!');
      console.log('  Street:', address.streetAddress);
      console.log('  City:', address.city);
      console.log('  State:', address.state);
      console.log('  Zip:', address.zipCode);
      console.log('  Full:', address.fullAddress);
    } else {
      console.error('  ❌ Geocoding failed');
    }

    return address;
  } catch (error: any) {
    console.error('❌ Error in getAddressFromGoogleMapsLink:', error);
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
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
