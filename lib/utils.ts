import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Property } from './supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sort locations by exclusivity status and then alphabetically
 * Exclusive locations appear first, then sorted by name
 * @param locations Array of properties to sort
 * @returns Sorted array with exclusive properties first, then alphabetical
 */
export function sortLocationsByExclusivity(locations: Property[]): Property[] {
  return [...locations].sort((a, b) => {
    // First, sort by is_exclusive (true before false)
    if (a.is_exclusive !== b.is_exclusive) {
      return a.is_exclusive ? -1 : 1;
    }

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}
