/**
 * Generate an obfuscated property name from the real name
 * The generated name should be consistent (same input = same output) but not easily reversible
 */

// Simple hash function to generate a consistent code from a string
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive number and format as 4-digit code
  const positiveHash = Math.abs(hash);
  return positiveHash.toString().padStart(4, '0').slice(-4);
}

// Extract property type indicators from the name
function detectPropertyType(name: string): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('ranch') || nameLower.includes('farm')) return 'Ranch';
  if (nameLower.includes('office') || nameLower.includes('business')) return 'Office';
  if (nameLower.includes('stadium') || nameLower.includes('speedway') || nameLower.includes('arena')) return 'Venue';
  if (nameLower.includes('hotel') || nameLower.includes('inn') || nameLower.includes('marriott') || nameLower.includes('hilton') || nameLower.includes('hyatt')) return 'Hotel';
  if (nameLower.includes('park') || nameLower.includes('plaza')) return 'Park';
  if (nameLower.includes('studio') || nameLower.includes('stage')) return 'Studio';
  if (nameLower.includes('airport') || nameLower.includes('runway') || nameLower.includes('hanger') || nameLower.includes('hangar')) return 'Aviation';
  if (nameLower.includes('medical') || nameLower.includes('hospital') || nameLower.includes('clinic')) return 'Medical';
  if (nameLower.includes('school') || nameLower.includes('academy') || nameLower.includes('university')) return 'Educational';
  if (nameLower.includes('restaurant') || nameLower.includes('cafe') || nameLower.includes('diner')) return 'Dining';
  if (nameLower.includes('retail') || nameLower.includes('store') || nameLower.includes('shop')) return 'Retail';
  if (nameLower.includes('warehouse') || nameLower.includes('industrial')) return 'Industrial';
  if (nameLower.includes('church') || nameLower.includes('chapel') || nameLower.includes('temple')) return 'Worship';
  if (nameLower.includes('theater') || nameLower.includes('theatre') || nameLower.includes('cinema')) return 'Theater';

  // Check if it looks like a street address
  if (/\d+\s+[A-Z]/i.test(name) || nameLower.includes('dr.') || nameLower.includes('st.') || nameLower.includes('ave') || nameLower.includes('road') || nameLower.includes('lane')) {
    return 'Residence';
  }

  return 'Property';
}

// Extract location from name if present
function extractLocation(name: string): string | null {
  const nameLower = name.toLowerCase();

  // Common Texas cities
  const cities = ['dallas', 'fort worth', 'houston', 'austin', 'san antonio', 'arlington', 'plano', 'irving', 'frisco', 'mckinney', 'garland', 'southlake', 'westlake', 'northlake', 'brooklyn'];

  for (const city of cities) {
    if (nameLower.includes(city)) {
      if (city === 'fort worth') return 'FW';
      if (city === 'dallas') return 'DFW';
      if (city === 'southlake' || city === 'westlake' || city === 'northlake') return 'Lake';
      if (city === 'brooklyn') return 'NY';
      return city.charAt(0).toUpperCase() + city.charAt(1).toUpperCase();
    }
  }

  // Check for TX in the name
  if (nameLower.includes('tx') || nameLower.includes('texas')) {
    return 'TX';
  }

  return null;
}

/**
 * Generate an obfuscated name from the real property name
 * Format: [PropertyType] [Location]-[Code]
 * Examples:
 *  "Dallas Medical Center" → "Medical Facility DFW-7428"
 *  "4608 Alta Dr." → "Residence TX-3891"
 *  "Texas Motor Speedway" → "Venue TX-4523"
 */
export function generateObfuscatedName(realName: string): string {
  const propertyType = detectPropertyType(realName);
  const location = extractLocation(realName);
  const code = hashCode(realName);

  // Build the obfuscated name
  let obfuscatedName = propertyType;

  if (propertyType === 'Residence' || propertyType === 'Property') {
    obfuscatedName = `${propertyType}`;
  } else {
    obfuscatedName = `${propertyType} Facility`;
  }

  if (location) {
    obfuscatedName += ` ${location}`;
  }

  obfuscatedName += `-${code}`;

  return obfuscatedName;
}

/**
 * Test the obfuscation function with sample names
 */
export function testObfuscation() {
  const testNames = [
    "Dallas Medical Center",
    "4608 Alta Dr.",
    "Texas Motor Speedway - Int/Ext",
    "Circle T Ranch",
    "Newsroom Sets",
    "Hilton Garden Inn"
  ];

  console.log('Obfuscation Test Results:');
  testNames.forEach(name => {
    console.log(`"${name}" → "${generateObfuscatedName(name)}"`);
  });
}
