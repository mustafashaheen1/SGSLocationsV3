/**
 * Helper functions for guest property listing flow
 * Stores listing data in session storage when user is not logged in
 */

export interface GuestListingData {
  formData: any;
  selectedCategoryId: string;
  propertyTags: string[];
  imageFiles: string[]; // Base64 encoded images
  timestamp: number;
}

const STORAGE_KEY = 'guest_property_listing';

export function saveGuestListing(data: Omit<GuestListingData, 'timestamp'>): void {
  try {
    const listingData: GuestListingData = {
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(listingData));
  } catch (error) {
    console.error('Error saving guest listing:', error);
  }
}

export function getGuestListing(): GuestListingData | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const listing = JSON.parse(data) as GuestListingData;

    // Check if data is less than 1 hour old
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - listing.timestamp > ONE_HOUR) {
      clearGuestListing();
      return null;
    }

    return listing;
  } catch (error) {
    console.error('Error retrieving guest listing:', error);
    return null;
  }
}

export function clearGuestListing(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing guest listing:', error);
  }
}

export async function filesToBase64(files: File[]): Promise<string[]> {
  const promises = files.map(file => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  return Promise.all(promises);
}

export async function base64ToFiles(base64Array: string[], originalFiles?: { name: string; type: string }[]): Promise<File[]> {
  const promises = base64Array.map(async (base64, index) => {
    const response = await fetch(base64);
    const blob = await response.blob();
    const name = originalFiles?.[index]?.name || `image-${index}.jpg`;
    const type = originalFiles?.[index]?.type || 'image/jpeg';
    return new File([blob], name, { type });
  });

  return Promise.all(promises);
}
