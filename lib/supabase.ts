import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ============================================
// DIRECT REST API FETCH - Bypasses JS client entirely
// ============================================

export async function directFetch(
  table: string,
  options?: {
    select?: string;
    eq?: Record<string, any>;
    neq?: Record<string, any>;
    gt?: Record<string, any>;
    gte?: Record<string, any>;
    lt?: Record<string, any>;
    lte?: Record<string, any>;
    in?: Record<string, any[]>;
    contains?: Record<string, any[]>;
    is?: Record<string, null>;
    order?: string;
    limit?: number;
    range?: [number, number];
    single?: boolean;
    maybeSingle?: boolean;
    authToken?: string;
    ascending?: boolean;
  }
): Promise<{ data: any; error: any }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(options?.select || '*')}`;
    
    // Add eq filters
    if (options?.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url += `&${key}=eq.${encodeURIComponent(String(value))}`;
        }
      });
    }

    // Add neq filters
    if (options?.neq) {
      Object.entries(options.neq).forEach(([key, value]) => {
        url += `&${key}=neq.${encodeURIComponent(String(value))}`;
      });
    }

    // Add gt filters (greater than)
    if (options?.gt) {
      Object.entries(options.gt).forEach(([key, value]) => {
        url += `&${key}=gt.${encodeURIComponent(String(value))}`;
      });
    }

    // Add gte filters (greater than or equal)
    if (options?.gte) {
      Object.entries(options.gte).forEach(([key, value]) => {
        url += `&${key}=gte.${encodeURIComponent(String(value))}`;
      });
    }

    // Add lt filters (less than)
    if (options?.lt) {
      Object.entries(options.lt).forEach(([key, value]) => {
        url += `&${key}=lt.${encodeURIComponent(String(value))}`;
      });
    }

    // Add lte filters (less than or equal)
    if (options?.lte) {
      Object.entries(options.lte).forEach(([key, value]) => {
        url += `&${key}=lte.${encodeURIComponent(String(value))}`;
      });
    }

    // Add in filters
    if (options?.in) {
      Object.entries(options.in).forEach(([key, values]) => {
        url += `&${key}=in.(${values.map(v => encodeURIComponent(String(v))).join(',')})`;
      });
    }

    // Add contains filters (for arrays)
    if (options?.contains) {
      Object.entries(options.contains).forEach(([key, values]) => {
        url += `&${key}=cs.{${values.map(v => encodeURIComponent(String(v))).join(',')}}`;
      });
    }

    // Add is filters (for null checks)
    if (options?.is) {
      Object.entries(options.is).forEach(([key, value]) => {
        if (value === null) {
          url += `&${key}=is.null`;
        }
      });
    }

    // Add order
    if (options?.order) {
      const direction = options.ascending === false ? '.desc' : '.asc';
      url += `&order=${options.order}${direction}`;
    }
    
    // Add limit
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }

    // Add range
    if (options?.range) {
      url += `&offset=${options.range[0]}&limit=${options.range[1] - options.range[0] + 1}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Use auth token if provided (for RLS-protected tables), otherwise use anon key
    const authHeader = options?.authToken
      ? `Bearer ${options.authToken}`
      : `Bearer ${supabaseAnonKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error for ${table}:`, errorText);
      return { data: null, error: { message: errorText } };
    }

    const data = await response.json();
    
    if ((options?.single || options?.maybeSingle) && Array.isArray(data)) {
      return { data: data[0] || null, error: null };
    }
    
    return { data, error: null };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`Timeout fetching ${table}`);
      return { data: null, error: { message: 'Request timeout' } };
    }
    console.error(`Direct fetch error for ${table}:`, error);
    return { data: null, error: { message: error.message } };
  }
}

// ============================================
// QUERY BUILDER - Mimics Supabase's .from().select() API
// but uses direct REST calls under the hood
// ============================================

class QueryBuilder {
  private table: string;
  private selectColumns: string = '*';
  private filters: { type: string; column: string; value: any }[] = [];
  private orderColumns: string[] = [];
  private limitCount?: number;
  private rangeStart?: number;
  private rangeEnd?: number;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private operation: 'select' | 'update' | 'insert' | 'delete' = 'select';
  private updateData?: any;
  private insertData?: any;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  contains(column: string, value: any[]) {
    this.filters.push({ type: 'cs', column, value });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  overlaps(column: string, values: any[]) {
    this.filters.push({ type: 'ov', column, value: values });
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  upsert(data: any) {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const direction = options?.ascending === false ? 'desc' : 'asc';
    const nulls = options?.nullsFirst ? '.nullsfirst' : '';
    this.orderColumns.push(`${column}.${direction}${nulls}`);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeStart = from;
    this.rangeEnd = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  then(resolve: (result: { data: any; error: any }) => void, reject?: (error: any) => void) {
    return this.execute().then(resolve, reject);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      let url = `${supabaseUrl}/rest/v1/${this.table}`;
      let method = 'GET';
      let body: any = undefined;

      // Get session token for authenticated operations (all operations including SELECT)
      let authToken = supabaseAnonKey;
      try {
        // Import dynamically to avoid circular dependencies
        const { createClient } = await import('@/lib/supabase');
        const client = createClient();
        const { data: { session } } = await client.auth.getSession();
        if (session?.access_token) {
          authToken = session.access_token;
        }
      } catch (err) {
        console.warn('Could not get session token, using anon key');
      }

      // Build URL and request based on operation type
      if (this.operation === 'select') {
        // For select, we need to preserve PostgREST syntax for nested selects (joins)
        // Only encode if necessary, but preserve the structure
        const encodedSelect = this.selectColumns
          .replace(/\s+/g, '') // Remove whitespace/newlines
          .replace(/\(/g, '(')  // Keep parentheses
          .replace(/\)/g, ')')  // Keep parentheses
          .replace(/,/g, ',');  // Keep commas
        url += `?select=${encodedSelect}`;

        // Add filters
        for (const filter of this.filters) {
          if (filter.type === 'eq') {
            url += `&${filter.column}=eq.${encodeURIComponent(String(filter.value))}`;
          } else if (filter.type === 'neq') {
            url += `&${filter.column}=neq.${encodeURIComponent(String(filter.value))}`;
          } else if (filter.type === 'in') {
            url += `&${filter.column}=in.(${filter.value.map((v: any) => encodeURIComponent(String(v))).join(',')})`;
          } else if (filter.type === 'cs') {
            url += `&${filter.column}=cs.{${filter.value.map((v: any) => encodeURIComponent(String(v))).join(',')}}`;
          } else if (filter.type === 'is') {
            url += `&${filter.column}=is.${filter.value}`;
          } else if (filter.type === 'ov') {
            url += `&${filter.column}=ov.{${filter.value.map((v: any) => encodeURIComponent(String(v))).join(',')}}`;
          }
        }

        // Add order
        if (this.orderColumns.length > 0) {
          url += `&order=${this.orderColumns.join(',')}`;
        }

        // Add limit
        if (this.limitCount) {
          url += `&limit=${this.limitCount}`;
        }

        // Add range (pagination)
        if (this.rangeStart !== undefined && this.rangeEnd !== undefined) {
          url += `&offset=${this.rangeStart}&limit=${this.rangeEnd - this.rangeStart + 1}`;
        }
      } else if (this.operation === 'update') {
        method = 'PATCH';
        body = JSON.stringify(this.updateData);

        // Add filters for update
        const filterParams = [];
        for (const filter of this.filters) {
          if (filter.type === 'eq') {
            filterParams.push(`${filter.column}=eq.${encodeURIComponent(String(filter.value))}`);
          } else if (filter.type === 'neq') {
            filterParams.push(`${filter.column}=neq.${encodeURIComponent(String(filter.value))}`);
          }
        }
        if (filterParams.length > 0) {
          url += '?' + filterParams.join('&');
        }
      } else if (this.operation === 'insert') {
        method = 'POST';
        body = JSON.stringify(this.insertData);
      } else if (this.operation === 'delete') {
        method = 'DELETE';

        // Add filters for delete
        const filterParams = [];
        for (const filter of this.filters) {
          if (filter.type === 'eq') {
            filterParams.push(`${filter.column}=eq.${encodeURIComponent(String(filter.value))}`);
          } else if (filter.type === 'neq') {
            filterParams.push(`${filter.column}=neq.${encodeURIComponent(String(filter.value))}`);
          }
        }
        if (filterParams.length > 0) {
          url += '?' + filterParams.join('&');
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // For upsert operations, use resolution=merge-duplicates
      const preferHeader = this.operation === 'insert' && this.insertData
        ? 'return=representation,resolution=merge-duplicates'
        : 'return=representation';

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Prefer': preferHeader,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${method} ${this.table} failed:`, errorText);
        return { data: null, error: { message: errorText } };
      }

      // For DELETE operations, response might be empty
      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if ((this.isSingle || this.isMaybeSingle) && Array.isArray(data)) {
        data = data[0] || null;
      }

      return { data, error: null };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { data: null, error: { message: 'Request timeout' } };
      }
      console.error(`QueryBuilder execute error:`, error);
      return { data: null, error: { message: error.message } };
    }
  }
}

// ============================================
// SUPABASE CLIENT - Real client for auth, QueryBuilder for data
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

// Create a proxy that intercepts .from() calls and uses QueryBuilder instead
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(target, prop) {
    // Intercept .from() to use our QueryBuilder (no hanging!)
    if (prop === 'from') {
      return (table: string) => new QueryBuilder(table);
    }
    
    // Everything else (auth, etc.) uses the real client
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

// Keep all your existing interfaces below...
// (PropertyContact, Property, User, Booking, etc.)

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