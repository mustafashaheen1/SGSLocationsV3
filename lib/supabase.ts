import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============================================
// AUTOMATIC SESSION CLEANUP - Prevents hanging
// ============================================

function clearCorruptedSessions() {
  if (typeof window === 'undefined') return;

  try {
    let cleared = 0;

    Object.keys(localStorage).forEach(key => {
      if (!key.includes('supabase') && !key.startsWith('sb-')) return;

      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const data = JSON.parse(item);

        // Check for expired tokens
        const expiresAt = data?.expires_at || data?.currentSession?.expires_at;
        if (expiresAt) {
          const expiryTime = expiresAt * 1000;
          const now = Date.now();

          // Clear if expired (with 1 minute buffer)
          if (now >= expiryTime - 60000) {
            console.log('🧹 Clearing expired session:', key);
            localStorage.removeItem(key);
            cleared++;
          }
        }
      } catch (e) {
        // Invalid JSON - remove it
        console.log('🧹 Clearing corrupted data:', key);
        localStorage.removeItem(key);
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} stale/corrupted items`);
    }
  } catch (error) {
    console.error('Error in clearCorruptedSessions:', error);
  }
}

// Run cleanup IMMEDIATELY on page load
if (typeof window !== 'undefined') {
  clearCorruptedSessions();

  // Also run when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      clearCorruptedSessions();
    }
  });
}

// ============================================
// SUPABASE CLIENT
// ============================================

let _supabase: ReturnType<typeof createSupabaseClient> | null = null;

function getClient(): ReturnType<typeof createSupabaseClient> {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    console.log('✅ Creating new Supabase client');

    _supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'sgs-locations',
        },
      },
    });

    // Listen for sign out to clear client
    if (typeof window !== 'undefined') {
      _supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          console.log('👋 Signed out, will create fresh client');
          _supabase = null;
        }
      });
    }
  }

  return _supabase;
}

// Export proxy
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

// Export createClient for components
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'sgs-locations',
      },
    },
  });
}

// Admin client for server-side operations
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

// ============================================
// INTERFACES
// ============================================

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
  real_name?: string;
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
