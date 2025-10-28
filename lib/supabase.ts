import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Property = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  county: string | null;
  zipcode: string | null;
  property_type: string;
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
  status: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

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
