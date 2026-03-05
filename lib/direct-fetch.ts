// Server-safe directFetch — no browser dependencies
// Can be imported from both server and client components

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    if (options?.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url += `&${key}=eq.${encodeURIComponent(String(value))}`;
        }
      });
    }

    if (options?.neq) {
      Object.entries(options.neq).forEach(([key, value]) => {
        url += `&${key}=neq.${encodeURIComponent(String(value))}`;
      });
    }

    if (options?.gt) {
      Object.entries(options.gt).forEach(([key, value]) => {
        url += `&${key}=gt.${encodeURIComponent(String(value))}`;
      });
    }

    if (options?.gte) {
      Object.entries(options.gte).forEach(([key, value]) => {
        url += `&${key}=gte.${encodeURIComponent(String(value))}`;
      });
    }

    if (options?.lt) {
      Object.entries(options.lt).forEach(([key, value]) => {
        url += `&${key}=lt.${encodeURIComponent(String(value))}`;
      });
    }

    if (options?.lte) {
      Object.entries(options.lte).forEach(([key, value]) => {
        url += `&${key}=lte.${encodeURIComponent(String(value))}`;
      });
    }

    if (options?.in) {
      Object.entries(options.in).forEach(([key, values]) => {
        url += `&${key}=in.(${values.map(v => encodeURIComponent(String(v))).join(',')})`;
      });
    }

    if (options?.contains) {
      Object.entries(options.contains).forEach(([key, values]) => {
        url += `&${key}=cs.{${values.map(v => encodeURIComponent(String(v))).join(',')}}`;
      });
    }

    if (options?.is) {
      Object.entries(options.is).forEach(([key, value]) => {
        if (value === null) {
          url += `&${key}=is.null`;
        }
      });
    }

    if (options?.order) {
      const direction = options.ascending === false ? '.desc' : '.asc';
      url += `&order=${options.order}${direction}`;
    }

    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }

    if (options?.range) {
      url += `&offset=${options.range[0]}&limit=${options.range[1] - options.range[0] + 1}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      cache: 'no-store',
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
