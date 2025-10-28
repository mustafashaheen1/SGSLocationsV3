# Database Setup Instructions

This directory contains SQL scripts to set up the complete database schema and populate it with realistic dummy data for the SGS Locations website.

## Contents

- `setup-database.sql` - Complete database setup script (65+ properties, users, bookings, RLS policies)

## Database Schema

The database includes three main tables:

### 1. Users Table
- **10 sample users** across three types:
  - Property Owners (3 users)
  - Production Professionals (5 users)
  - Admins (2 users)

### 2. Properties Table
- **65+ properties** across categories:
  - Modern Architecture (15 properties)
  - Luxury Estates (12 properties)
  - Historical Properties (8 properties)
  - Urban & Industrial (10 properties)
  - Natural Settings (8 properties)
  - Mid-Century Modern (7 properties)
  - Commercial Spaces (5 properties)

- **Cities covered**: Dallas, Fort Worth, Plano, Frisco, Denton, Arlington
- **Counties**: Dallas County, Tarrant County, Collin County, Denton County

### 3. Bookings Table
- **20 sample bookings** with varied statuses (pending, confirmed, completed, cancelled)
- Date ranges throughout November-December 2025
- Realistic notes and production details

## How to Run

### Step 1: Access Supabase Dashboard
1. Go to [your Supabase project](https://ttbseourgjpqvxwsjabh.supabase.co)
2. Navigate to **SQL Editor** in the left sidebar

### Step 2: Execute the Script
1. Open `setup-database.sql` in your code editor
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor
4. Click **Run** button

### Step 3: Verify the Data
The script will automatically verify the data at the end. You should see:
```
Users: 10
Properties: 65+
Bookings: 20
```

You can also verify by:
1. Going to **Table Editor** in Supabase
2. Browsing the `users`, `properties`, and `bookings` tables
3. Checking that data is populated correctly

## Security

The script includes **Row Level Security (RLS)** policies:

- ✅ Public can view active properties
- ✅ Property owners can manage their own properties
- ✅ Users can view and create their own bookings
- ✅ Users can view their own profile

## Property Data Highlights

### Categories
Properties are organized into categories like:
- Modern, Luxury, Historical, Industrial, Natural, Mid-Century, Commercial

### Features
Each property includes features such as:
- Pool, Hot Tub, Kitchen, Bathroom, Driveway, Garage, Elevator
- Patio, Balcony, Terrace, Deck
- Hardwood Floors, Tile, Carpet, Marble, Concrete
- Brick Walls, Stone, Wood Panel
- Front Yard, Backyard, Garden, Landscaped, Fenced

### Daily Rates
Properties range from $500 to $5,000 per day based on:
- Property type and size
- Location
- Luxury level
- Amenities

## Sample Properties Include

**Iconic Listings:**
- The Highland Estate - Luxury modern estate with infinity pool
- Pasadena Princess Estate - European architecture showpiece
- Glass House Contemporary - Award-winning modern design
- Victorian Mansion 1892 - Historic restored mansion
- Kaufmann House Replica - Mid-century modern architectural gem
- Lakefront Ranch Property - 15-acre natural setting
- Converted Warehouse Loft - Urban industrial space

**Variety:**
- Residential: Single-family homes, townhouses, penthouses
- Commercial: Restaurants, hotels, offices, retail, galleries
- Historical: Victorian, Colonial, Art Deco, Gothic Revival
- Natural: Ranches, cabins, lakefront, hill country
- Industrial: Warehouses, lofts, converted factories

## Troubleshooting

### If you get errors:
1. Make sure you're connected to the correct Supabase project
2. Check that the SQL Editor has proper permissions
3. Try running the DROP TABLE statements separately first
4. Then run the rest of the script

### To reset and start over:
Run just the DROP TABLE section at the top of the script to clear existing data, then run the full script again.

## TypeScript Types

The TypeScript types in `/lib/supabase.ts` have been updated to match this schema exactly. They include:

```typescript
Property - All property fields with proper types
User - User account information
Booking - Reservation details
```

## Next Steps

After running the setup script:

1. ✅ Visit `/search` to see properties displayed
2. ✅ Visit `/location-library` to browse categorized collections
3. ✅ Visit `/property/[id]` to view individual property details
4. ✅ Test the dashboard to see bookings (when auth is implemented)

## Notes

- All properties use realistic Unsplash images
- Addresses are realistic Dallas/Fort Worth area locations
- Property details are comprehensive and production-ready
- Permit information included for filming/photography
- View counts simulate real engagement data
