/**
 * Helper functions for guest property listing flow
 * Stores listing data in IndexedDB when user is not logged in
 */

export interface GuestListingData {
  formData: any;
  selectedCategoryId: string;
  propertyTags: string[];
  imageFiles: File[]; // Actual File objects
  timestamp: number;
}

const DB_NAME = 'GuestListingDB';
const DB_VERSION = 1;
const STORE_NAME = 'listings';
const LISTING_KEY = 'current_listing';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveGuestListing(data: Omit<GuestListingData, 'timestamp'>): Promise<void> {
  try {
    const db = await openDB();
    const listingData: GuestListingData = {
      ...data,
      timestamp: Date.now(),
    };

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(listingData, LISTING_KEY);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
    console.log('Guest listing saved to IndexedDB');
  } catch (error) {
    console.error('Error saving guest listing:', error);
    throw error;
  }
}

export async function getGuestListing(): Promise<GuestListingData | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(LISTING_KEY);

    const listing = await new Promise<GuestListingData | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (!listing) return null;

    // Check if data is less than 1 hour old
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - listing.timestamp > ONE_HOUR) {
      await clearGuestListing();
      return null;
    }

    return listing;
  } catch (error) {
    console.error('Error retrieving guest listing:', error);
    return null;
  }
}

export async function clearGuestListing(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(LISTING_KEY);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    db.close();
    console.log('Guest listing cleared from IndexedDB');
  } catch (error) {
    console.error('Error clearing guest listing:', error);
  }
}

