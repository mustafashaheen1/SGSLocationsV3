import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Property = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  county: string;
  zipcode: string;
  property_type: 'Residential' | 'Commercial' | 'Natural' | 'Industrial' | 'Historical';
  square_footage: number | null;
  lot_size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  year_built: number | null;
  features: string[];
  categories: string[];
  permits_available: boolean;
  permit_details: string | null;
  daily_rate: number;
  images: string[];
  primary_image: string | null;
  status: 'active' | 'pending' | 'inactive';
  is_featured: boolean;
  is_exclusive: boolean;
  view_count: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  user_type: 'production' | 'property_owner' | 'admin';
  company_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  property_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
