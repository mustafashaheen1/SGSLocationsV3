import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✨ NEW: Add session cleanup function
function clearStaleSession() {
  if (typeof window === 'undefined') return;

  try {
    const storedAuth = localStorage.getItem('supabase.auth.token');
    if (!storedAuth) return;

    const authData = JSON.parse(storedAuth);
    const expiresAt = authData?.expires_at;

    if (expiresAt) {
      const expiryTime = new Date(expiresAt * 1000).getTime();
      const now = Date.now();

      // If token expired more than 5 minutes ago, clear it
      if (now > expiryTime + (5 * 60 * 1000)) {
        console.log('🧹 Clearing stale session from localStorage');

        // Clear all Supabase-related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error clearing stale session:', error);
  }
}

// ✨ NEW: Clear stale sessions on page load
if (typeof window !== 'undefined') {
  clearStaleSession();
}

if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production' || (supabaseUrl && supabaseAnonKey)) {
  console.log('🔧 Supabase Client Initialization:');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', !!supabaseAnonKey);
  console.log('Key length:', supabaseAnonKey?.length);
}

let _supabase: ReturnType<typeof createSupabaseClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(target, prop) {
    if (!_supabase) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }
      _supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          // ✨ NEW: Add explicit storage key and flowType
          storageKey: 'supabase.auth.token',
          flowType: 'pkce',
        },
        // ✨ NEW: Add global headers
        global: {
          headers: {
            'x-application-name': 'sgs-locations',
          },
        },
      });
    }
    return (_supabase as any)[prop];
  }
});

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // ✨ NEW: Clear stale sessions before creating new client
  clearStaleSession();

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // ✨ NEW: Add explicit storage configuration
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
    },
    // ✨ NEW: Add global headers
    global: {
      headers: {
        'x-application-name': 'sgs-locations',
      },
    },
  });
}

console.log('✅ Supabase client created');

/**
 * Check if a property with the given SmugMug albumkey already exists
 * @param albumkey SmugMug album identifier
 * @returns True if property exists, false otherwise
 */
export async function albumKeyExists(albumkey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('albumkey', albumkey)
    .maybeSingle();

  if (error) {
    console.error('Error checking albumkey:', error);
    return false;
  }

  return data !== null;
}

/**
 * Get property by SmugMug albumkey
 * @param albumkey SmugMug album identifier
 * @returns Property if found, null otherwise
 */
export async function getPropertyByAlbumKey(albumkey: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('albumkey', albumkey)
    .maybeSingle();

  if (error) {
    console.error('Error fetching property by albumkey:', error);
    return null;
  }

  return data;
}

export interface PropertyContact {
  name: string;
  cell_number: string;
  home_number: string;
  office_number: string;
  email: string;
}

export interface Property {
  id: string;
  name: string;
  real_name?: string; // The actual property name (admin only, not shown publicly)
  description: string | null;
  address: string;
  city: string;
  county: string | null;
  zipcode: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string;
  square_footage: number | null;
  lot_size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  year_built: number | null;
  features: string[];
  categories: string[];
  property_tags: string[];
  permits_available: boolean;
  permit_details: string | null;
  daily_rate: number;
  images: string[];
  primary_image: string | null;
  status: string;
  owner_id: string | null;
  albumkey: string | null;
  is_featured?: boolean;
  is_exclusive?: boolean;
  view_count?: number;
  contacts?: PropertyContact[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_type: string;
  company_name: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  property_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_cost: number;
  notes: string | null;
  created_at: string;
};

export interface Project {
  id: string;
  name: string;
  banner_image: string;
  property_id: string;
  display_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined property data
  property?: Property;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  search_text: string;
  filters: Record<string, any>;
  tags: string[];
  result_count: number;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  property_id: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  message: string;
  crew_size: number | null;
  locations: string | null;
  shooting_date: string | null;
  project_type: string | null;
  how_did_you_hear: string | null;
  status: 'new' | 'responded' | 'archived';
  admin_notes: string | null;
  created_at: string;
  responded_at: string | null;
  properties?: Property;
}

export type CalendarEventType = 'hold_days' | 'blackout_days' | 'director_scout' | 'tech_scout';

export interface PropertyCalendarEvent {
  id: string;
  property_id: string;
  event_type: CalendarEventType;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  color: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
