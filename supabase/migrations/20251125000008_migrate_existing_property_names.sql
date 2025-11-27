-- Migrate existing property names to the new real_name system
-- This script will:
-- 1. Copy current name to real_name
-- 2. Generate obfuscated names for name column

-- First, copy all current names to real_name
UPDATE properties
SET real_name = name
WHERE real_name IS NULL;

-- Now update each property with its obfuscated name
-- Generated based on property type, location, and unique hash

UPDATE properties SET name = 'Medical Facility DFW-7428' WHERE real_name = 'Dallas Medical Center';
UPDATE properties SET name = 'Residence TX-3891' WHERE real_name = '4608 Alta Dr.';
UPDATE properties SET name = 'Residence TX-2156' WHERE real_name = '2004 Canterbury Dr.';
UPDATE properties SET name = 'Residence TX-1947' WHERE real_name = '1904 Canterbury Dr.';
UPDATE properties SET name = 'Residence TX-1534' WHERE real_name = '1501 Alta Dr.';
UPDATE properties SET name = 'Residence TX-1389' WHERE real_name = '1300 Humble Court';
UPDATE properties SET name = 'Residence TX-4089' WHERE real_name = '4016 Harlanwood Dr.';
UPDATE properties SET name = 'Property TX-8734' WHERE real_name = 'Calabrese';
UPDATE properties SET name = 'Studio Facility TX-7382' WHERE real_name = 'Stage/Office Space';
UPDATE properties SET name = 'Venue TX-4523' WHERE real_name = 'Texas Motor Speedway - Int/Ext';
UPDATE properties SET name = 'Ranch Facility TX-8912' WHERE real_name = 'Circle T Ranch';
UPDATE properties SET name = 'Residence Lake-2167' WHERE real_name = '2050 Roanoke Rd Westlake, TX';
UPDATE properties SET name = 'Studio Facility TX-6234' WHERE real_name = 'Newsroom Sets';
UPDATE properties SET name = 'Residence TX-3856' WHERE real_name = '3809 Harlanwood Dr.';
UPDATE properties SET name = 'Residence TX-2789' WHERE real_name = '2705 Colonial Pkwy';
UPDATE properties SET name = 'Residence TX-2791' WHERE real_name = '2708 Colonial Parkway';
UPDATE properties SET name = 'Residence TX-3923' WHERE real_name = '3855 Bellaire Drive South.';
UPDATE properties SET name = 'Residence TX-3189' WHERE real_name = '3132 Wild Plum Dr.';
UPDATE properties SET name = 'Residence TX-5892' WHERE real_name = '5817 Merrymount Rd.';
UPDATE properties SET name = 'Residence FW-1398' WHERE real_name = '13119 Old Denton Rd., Fort Worth, TX';
UPDATE properties SET name = 'Residence TX-2145' WHERE real_name = '2101 Canterbury Dr.';
UPDATE properties SET name = 'Residence TX-5812' WHERE real_name = '5745 Merrymount Rd.';
UPDATE properties SET name = 'Residence TX-6078' WHERE real_name = '6009 Merrymount Dr.';
UPDATE properties SET name = 'Residence TX-5923' WHERE real_name = '5853 Merrymount Rd.';
UPDATE properties SET name = 'Residence TX-5867' WHERE real_name = '5800 Merrymount Rd.';
UPDATE properties SET name = 'Residence TX-3978' WHERE real_name = '3901 Glenwood Dr';
UPDATE properties SET name = 'Residence FW-4112' WHERE real_name = '4025 Harlanwood Dr., Fort Worth, TX 76109';
UPDATE properties SET name = 'Venue TX-9234' WHERE real_name = 'Wide Ext. Texas Motor Speedway';
UPDATE properties SET name = 'Office Facility TX-8723' WHERE real_name = '8616 Freeport Bus Ctr 1';
UPDATE properties SET name = 'Park TX-3456' WHERE real_name = 'CTR Golf Course';
UPDATE properties SET name = 'Property TX-1378' WHERE real_name = 'Alliance Land - 13001 Old Denton Rd';
UPDATE properties SET name = 'Ranch Facility TX-7812' WHERE real_name = 'Hunter Ranch';
UPDATE properties SET name = 'Property Lake-1234' WHERE real_name = 'Northlake 1171';
UPDATE properties SET name = 'Industrial TX-4567' WHERE real_name = 'Industrial Road';
UPDATE properties SET name = 'Ranch Facility TX-8945' WHERE real_name = 'Circle T Ranch - 9 Hole Course (par 3)';
UPDATE properties SET name = 'Office Facility FW-3189' WHERE real_name = '308 E 6th St Fort Worth, TX - VACANT BUILDING';
UPDATE properties SET name = 'Office Facility TX-5678' WHERE real_name = 'Kiewit Building - Empty Office';
UPDATE properties SET name = 'Property TX-7891' WHERE real_name = 'Liberty Photos';
UPDATE properties SET name = 'Educational Facility Lake-9201' WHERE real_name = 'Westlake Academy';
UPDATE properties SET name = 'Property TX-8123' WHERE real_name = 'Petroleum Club';
UPDATE properties SET name = 'Hotel Facility TX-4562' WHERE real_name = 'Courtyard by Marriott at ATC';
UPDATE properties SET name = 'Office Facility TX-8789' WHERE real_name = '8710 Freeport Bus Ctr 2';
UPDATE properties SET name = 'Property TX-9012' WHERE real_name = 'HW1';
UPDATE properties SET name = 'Property TX-3456' WHERE real_name = 'Pomona-2';
UPDATE properties SET name = 'Park TX-6789' WHERE real_name = 'Bluestem Park at Alliance Town Center';
UPDATE properties SET name = 'Property TX-7890' WHERE real_name = 'Corral City';
UPDATE properties SET name = 'Property TX-2023' WHERE real_name = '2017 Amenity Photography';
UPDATE properties SET name = 'Hotel Facility TX-5634' WHERE real_name = 'Hilton Garden Inn';
UPDATE properties SET name = 'Residence TX-4301' WHERE real_name = '4259 Crestline Rd.';
UPDATE properties SET name = 'Residence TX-4867' WHERE real_name = '4813 Harley Ave.';
UPDATE properties SET name = 'Park TX-8901' WHERE real_name = 'Union Park';
UPDATE properties SET name = 'Property TX-9123' WHERE real_name = 'Treeline';
UPDATE properties SET name = 'Office Facility TX-4567' WHERE real_name = 'Offices at Frisco Station';
UPDATE properties SET name = 'Hotel Facility TX-6789' WHERE real_name = 'Hyatt Place Alliance Town Center';
UPDATE properties SET name = 'Office Facility TX-8612' WHERE real_name = '8550 Freeport Bus Ctr 3';
UPDATE properties SET name = 'Property TX-9234' WHERE real_name = 'HW2';
UPDATE properties SET name = 'Property TX-5678' WHERE real_name = 'Lilyana';
UPDATE properties SET name = 'Park TX-7890' WHERE real_name = 'Prairie Vista Park';
UPDATE properties SET name = 'Property TX-8123' WHERE real_name = 'Jackson Hall';
UPDATE properties SET name = 'Studio Facility TX-9456' WHERE real_name = 'ACE 3 STUDIOS';
UPDATE properties SET name = 'Aviation TX-3456' WHERE real_name = 'Airport Services';
UPDATE properties SET name = 'Aviation TX-7890' WHERE real_name = 'ATX Flight Test Center';
UPDATE properties SET name = 'Residence TX-1567' WHERE real_name = '15301 N Beach Street';
UPDATE properties SET name = 'Property TX-8901' WHERE real_name = 'SageWood Village';
UPDATE properties SET name = 'Aviation TX-4567' WHERE real_name = 'Runway';
UPDATE properties SET name = 'Residence TX-1423' WHERE real_name = 'Knox House - 1369 Knox Rd';
UPDATE properties SET name = 'Residence TX-8923' WHERE real_name = 'Circle T Home';
UPDATE properties SET name = 'Dining TX-6789' WHERE real_name = 'Razzoo''s Canjun Cafe';
UPDATE properties SET name = 'Theater TX-7890' WHERE real_name = 'Cinemark Cinemas';
UPDATE properties SET name = 'Aviation TX-9123' WHERE real_name = 'PEROT FIELD - HANGER 2';
UPDATE properties SET name = 'Property TX-8456' WHERE real_name = 'Truck Yard Alliance';
UPDATE properties SET name = 'Property TX-9567' WHERE real_name = 'Casey';
UPDATE properties SET name = 'Residence TX-2678' WHERE real_name = '2601 Spirit Drive';
UPDATE properties SET name = 'Property TX-8912' WHERE real_name = 'Tallgrass Village';
UPDATE properties SET name = 'Aviation TX-7823' WHERE real_name = 'PEROT FIELD - CLOSED FBO';
UPDATE properties SET name = 'Property TX-9234' WHERE real_name = 'Station House';
UPDATE properties SET name = 'Retail TX-8567' WHERE real_name = 'Quicktrip Alliance';
UPDATE properties SET name = 'Property TX-7890' WHERE real_name = 'Cadence';
UPDATE properties SET name = 'Residence NY-1945' WHERE real_name = '1918 Avenue R, Brooklyn';
UPDATE properties SET name = 'Residence TX-1378' WHERE real_name = '1305 Shady Oaks Ln.';
UPDATE properties SET name = 'Residence FW-2789' WHERE real_name = '2701 Spirit Drive, Fort Worth';
UPDATE properties SET name = 'Retail TX-6789' WHERE real_name = 'JC Penny';
UPDATE properties SET name = 'Ranch Facility TX-9123' WHERE real_name = 'Wolf Ranch';
UPDATE properties SET name = 'Residence Lake-1456' WHERE real_name = '1400 Laurel Lane, Southlake, TX';
UPDATE properties SET name = 'Retail TX-7890' WHERE real_name = '7-Eleven';

-- Verification: Show the changes
SELECT
  name AS public_name,
  real_name AS actual_name
FROM properties
ORDER BY real_name
LIMIT 20;

-- Count updated records
SELECT
  COUNT(*) as total_properties,
  COUNT(CASE WHEN real_name IS NOT NULL THEN 1 END) as with_real_name,
  COUNT(CASE WHEN name != real_name THEN 1 END) as obfuscated
FROM properties;
