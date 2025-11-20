/**
 * Script to populate projects table from your HTML source
 *
 * Usage:
 * 1. Run: node scripts/populate-portfolio-projects.js
 * 2. Copy the SQL output
 * 3. Run it in Supabase SQL Editor
 */

// Your property IDs
const PROPERTY_IDS = [
  "7342c4c3-b484-4393-97f7-72249de7b04b",
  "1c0d73bf-4dc6-4590-8f77-1eaf8e61ebe8",
  "791eff3c-3f0b-4f0f-bdde-f74c97fb2c5b",
  "8a1a2a27-cee2-4a0d-96ba-b3b9b5d1cbb6",
  "e39dd4b5-8b3f-4539-ab65-f2f6e2c8d154",
  "640853c2-c1dd-44e3-8988-0dafa515c797",
  "e5c20a69-9f2f-41ab-b550-cf7c200d61d6",
  "3eb1c844-cd98-48dc-8409-41f7a900626d",
  "44b689b1-d4e2-49da-8efc-af1ffe9ada9f",
  "4619ef24-1949-46cc-87b4-8df0f8cf296e",
  "e6322dbc-a3b3-43fa-84fb-29971d47ba83",
  "5036c1c1-0e79-4e9c-b230-29abc008d28f",
  "2c522b02-686a-4022-89c1-024436972aef",
  "487d4b92-aa54-4c04-9ffd-077512a36ea7"
];

// Mapping of project names to property IDs (you'll need to update this)
const PROJECT_TO_PROPERTY = {
  "Billi Ellish - WSJ - Mid Century Exotic": "7342c4c3-b484-4393-97f7-72249de7b04b",
  "All's Fair - Hulu - Bel Air Villa": "1c0d73bf-4dc6-4590-8f77-1eaf8e61ebe8",
  "Kawasaki - The Wrapper": "791eff3c-3f0b-4f0f-bdde-f74c97fb2c5b",
  "Suits LA - NBC - Modern 310": "8a1a2a27-cee2-4a0d-96ba-b3b9b5d1cbb6",
  "Elsa Hosk Harpers - Bazaar - Anderson House": "e39dd4b5-8b3f-4539-ab65-f2f6e2c8d154",
  "Ryan Gosling - Wall Street Journal - Retro 6": "640853c2-c1dd-44e3-8988-0dafa515c797",
  "Selena Gomez - Vanity Fair - Hermosa House": "e5c20a69-9f2f-41ab-b550-cf7c200d61d6",
  "Mariah Carey - Vogue - Americana 348": "3eb1c844-cd98-48dc-8409-41f7a900626d",
  "On Call - Amazon - Abandoned Neighborhood": "44b689b1-d4e2-49da-8efc-af1ffe9ada9f",
  "Crawford & Co Productions - McDonalds - Empty Suberbia": "4619ef24-1949-46cc-87b4-8df0f8cf296e",
  "Lady Gaga - Elle Magazine - Hearst House": "e6322dbc-a3b3-43fa-84fb-29971d47ba83",
  "Beyonce - W Magazine": "5036c1c1-0e79-4e9c-b230-29abc008d28f",
  "Ryan Gosling - Gucci - Dolphin Beach House": "2c522b02-686a-4022-89c1-024436972aef",
  "Paris Hilton - Living Proof": "487d4b92-aa54-4c04-9ffd-077512a36ea7"
};

// Projects data extracted from your HTML
const PROJECTS = [
  {
    name: "Billi Ellish - WSJ - Mid Century Exotic",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/324121/conversions/bill-xs.jpg"
  },
  {
    name: "All's Fair - Hulu - Bel Air Villa",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/324120/conversions/alls-fair-xs.jpg"
  },
  {
    name: "Kawasaki - The Wrapper",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/315691/conversions/Kawasaki-tear-xs.jpg"
  },
  {
    name: "Suits LA - NBC - Modern 310",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/312110/conversions/Suits-LA-xs.jpg"
  },
  {
    name: "Elsa Hosk Harpers - Bazaar - Anderson House",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/292352/conversions/Elsa-H-Harpers-anderson-house-069-xs.jpg"
  },
  {
    name: "Ryan Gosling - Wall Street Journal - Retro 6",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/294121/conversions/wsj-ryan-gosling-xs.jpg"
  },
  {
    name: "Selena Gomez - Vanity Fair - Hermosa House",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/300187/conversions/vf-selena-gomez001-xs.jpg"
  },
  {
    name: "Mariah Carey - Vogue - Americana 348",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/307178/conversions/mariah-carey-vogue-xs.jpg"
  },
  {
    name: "On Call - Amazon - Abandoned Neighborhood",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/309870/conversions/OnCall-xs.jpg"
  },
  {
    name: "Crawford & Co Productions - McDonalds - Empty Suberbia",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/309882/conversions/Empty-Suberbia-mcDonalds012-xs.jpg"
  },
  {
    name: "Lady Gaga - Elle Magazine - Hearst House",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/310242/conversions/Lady-Gaga-Mayhem-ELLE-Magazine-xs.jpg"
  },
  {
    name: "Beyonce - W Magazine",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/291133/conversions/beyonc-covers-xs.jpg"
  },
  {
    name: "Ryan Gosling - Gucci - Dolphin Beach House",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/284090/conversions/gucci1-xs.jpg"
  },
  {
    name: "Paris Hilton - Living Proof",
    banner_image: "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/287032/conversions/LivingProof-PH001-xs.jpg"
  }
];

/**
 * Generate SQL INSERT statements
 */
function generateSQL() {
  console.log('/*');
  console.log('  Portfolio Projects Data');
  console.log('  Generated from HTML source');
  console.log('  Total projects:', PROJECTS.length);
  console.log('*/\n');

  // First, clear any existing projects (optional - comment out if you want to keep existing)
  console.log('-- Optional: Clear existing projects first');
  console.log('-- DELETE FROM projects;\n');

  console.log('-- Insert new projects');
  console.log('INSERT INTO projects (name, banner_image, property_id, display_order, status) VALUES');

  const values = PROJECTS.map((project, index) => {
    // Get property ID from mapping or use a default from the list
    let propertyId = PROJECT_TO_PROPERTY[project.name];

    // If no mapping exists, cycle through property IDs
    if (!propertyId) {
      propertyId = PROPERTY_IDS[index % PROPERTY_IDS.length];
      console.warn(`Warning: No property mapping for "${project.name}", using ${propertyId}`);
    }

    const name = project.name.replace(/'/g, "''"); // Escape single quotes
    const bannerImage = project.banner_image;
    const displayOrder = index + 1;

    return `  ('${name}', '${bannerImage}', '${propertyId}', ${displayOrder}, 'active')`;
  });

  console.log(values.join(',\n'));
  console.log(';\n');

  console.log('-- Verify the inserts');
  console.log('-- SELECT * FROM projects ORDER BY display_order;');
}

/**
 * Show instructions
 */
function showInstructions() {
  console.log('\n' + '='.repeat(80));
  console.log('\nNEXT STEPS:\n');
  console.log('1. Copy the SQL INSERT statement above');
  console.log('2. Go to your Supabase project: https://supabase.com/dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and run the SQL');
  console.log('5. Check your portfolio page: http://localhost:3000/portfolio');
  console.log('6. Or manage via admin: http://localhost:3000/admin/projects\n');

  console.log('IMPORTANT NOTES:\n');
  console.log('- All banner images are using your old Laravel S3 URLs');
  console.log('- Make sure these URLs are still accessible');
  console.log('- If images are broken, you\'ll need to:');
  console.log('  a) Upload new images via /admin/projects, OR');
  console.log('  b) Update the banner_image URLs in the database\n');

  console.log('- The PROJECT_TO_PROPERTY mapping may need adjustment');
  console.log('  to match your actual property names in the database');
  console.log('='.repeat(80) + '\n');
}

// Run the script
console.clear();
console.log('='.repeat(80));
console.log('PORTFOLIO PROJECTS SQL GENERATOR');
console.log('='.repeat(80) + '\n');

generateSQL();
showInstructions();
