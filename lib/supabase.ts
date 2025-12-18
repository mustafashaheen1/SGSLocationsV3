import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ============================================
// DIRECT REST API FETCH - Bypasses JS client entirely
// This NEVER hangs because it's just a simple fetch()
// ============================================

export async function directFetch(
  table: string, 
  options?: {
    select?: string;
    eq?: Record<string, any>;
    in?: Record<string, any[]>;
    order?: string;
    limit?: number;
    single?: boolean;
  }
): Promise<{ data: any; error: any }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}?select=${options?.select || '*'}`;
    
    // Add eq filters
    if (options?.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        url += `&${key}=eq.${encodeURIComponent(String(value))}`;
      });
    }
    
    // Add in filters
    if (options?.in) {
      Object.entries(options.in).forEach(([key, values]) => {
        url += `&${key}=in.(${values.map(v => encodeURIComponent(String(v))).join(',')})`;
      });
    }
    
    // Add order
    if (options?.order) {
      url += `&order=${options.order}`;
    }
    
    // Add limit
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: errorText };
    }

    const data = await response.json();
    
    if (options?.single && Array.isArray(data)) {
      return { data: data[0] || null, error: null };
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error(`Direct fetch error for ${table}:`, error);
    return { data: null, error: error.message };
  }
}

// ============================================
// SUPABASE CLIENT - For auth only
// ============================================

let _supabase: ReturnType<typeof createSupabaseClient> | null = null;

function getClient(): ReturnType<typeof createSupabaseClient> {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    console.log('✅ Creating Supabase client');
    
    _supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce',
      },
    });
  }

  return _supabase;
}

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

export function createClient() {
  return getClient();
}

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
// INTERFACES (unchanged)
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

export async function albumKeyExists(albumkey: string): Promise<boolean> {
  const { data } = await directFetch('properties', {
    select: 'id',
    eq: { albumkey },
    single: true
  });
  return data !== null;
}

export async function getPropertyByAlbumKey(albumkey: string): Promise<Property | null> {
  const { data } = await directFetch('properties', {
    eq: { albumkey },
    single: true
  });
  return data;
}