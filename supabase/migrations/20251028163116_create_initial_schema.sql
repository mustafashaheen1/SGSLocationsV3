/*
  # SGS Locations Database Schema

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `name` (text) - Property name
      - `description` (text) - Detailed description
      - `address` (text) - Street address
      - `city` (text) - City name
      - `county` (text) - County name
      - `zipcode` (text) - ZIP code
      - `property_type` (text) - Residential, Commercial, etc.
      - `square_footage` (integer) - Property size in sq ft
      - `lot_size` (decimal) - Lot size in acres
      - `bedrooms` (integer) - Number of bedrooms
      - `bathrooms` (decimal) - Number of bathrooms
      - `parking_spaces` (integer) - Parking capacity
      - `year_built` (integer) - Construction year
      - `features` (text array) - Pool, Kitchen, etc.
      - `categories` (text array) - Modern, Historical, etc.
      - `permits_available` (boolean) - Film permit status
      - `permit_details` (text) - Permit information
      - `daily_rate` (decimal) - Cost per day
      - `images` (text array) - Image URLs
      - `primary_image` (text) - Main display image
      - `status` (text) - active, pending, inactive
      - `owner_id` (uuid) - Foreign key to users
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `users`
      - `id` (uuid, primary key) - Links to auth.users
      - `email` (text, unique) - User email
      - `full_name` (text) - User's full name
      - `phone` (text) - Contact phone
      - `user_type` (text) - production, property_owner, admin
      - `company_name` (text) - Company name if applicable
      - `created_at` (timestamptz) - Creation timestamp

    - `bookings`
      - `id` (uuid, primary key)
      - `property_id` (uuid) - Foreign key to properties
      - `user_id` (uuid) - Foreign key to users
      - `start_date` (date) - Booking start date
      - `end_date` (date) - Booking end date
      - `status` (text) - pending, confirmed, cancelled
      - `total_cost` (decimal) - Total booking cost
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for active properties
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  county text,
  zipcode text,
  property_type text NOT NULL,
  square_footage integer,
  lot_size decimal,
  bedrooms integer,
  bathrooms decimal,
  parking_spaces integer,
  year_built integer,
  features text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  permits_available boolean DEFAULT false,
  permit_details text,
  daily_rate decimal NOT NULL,
  images text[] DEFAULT '{}',
  primary_image text,
  status text DEFAULT 'active',
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  user_type text DEFAULT 'production',
  company_name text,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending',
  total_cost decimal NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Properties policies
CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  USING (status = 'active');

CREATE POLICY "Property owners can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Property owners can insert their properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can update their properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can delete their properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);