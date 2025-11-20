/**
 * Script to generate SQL INSERT statements for projects table
 *
 * Usage:
 * 1. Update the PROPERTY_IDS array below with your actual property IDs from Supabase
 * 2. Update the extractProjectsFromHTML function to parse your HTML source
 * 3. Run: node scripts/generate-project-inserts.js
 * 4. Copy the output SQL and run it in Supabase SQL Editor
 */

// Replace with your actual property IDs from the Supabase properties table
const PROPERTY_IDS = [
  // Example: 'uuid-1', 'uuid-2', 'uuid-3', etc.
  // Paste the property IDs JSON array you have here
];

// Sample HTML structure - replace with your actual HTML
const HTML_CONTENT = `
<!-- Paste your HTML source code here -->
<!-- Example structure:
<div class="portfolio-item">
  <img src="https://imagelocations-laravel.s3.us-west-1.amazonaws.com/some-image.jpg">
  <div class="title">Project Name Here</div>
</div>
-->
`;

/**
 * Extract project data from HTML
 * Modify this function based on your actual HTML structure
 */
function extractProjectsFromHTML(html) {
  const projects = [];

  // Example parsing logic - adjust based on your HTML structure
  // This is a simple regex-based approach, but you might want to use a proper HTML parser

  const itemRegex = /<div class="portfolio-item"[^>]*>(.*?)<\/div>\s*<\/div>/gs;
  const matches = html.matchAll(itemRegex);

  for (const match of matches) {
    const content = match[1];

    // Extract image URL
    const imgMatch = content.match(/src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : '';

    // Extract title/name
    const titleMatch = content.match(/<div class="title">([^<]+)<\/div>/);
    const name = titleMatch ? titleMatch[1].trim() : '';

    if (name && imageUrl) {
      projects.push({ name, banner_image: imageUrl });
    }
  }

  return projects;
}

/**
 * Shuffle array to randomly assign properties
 */
function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Generate SQL INSERT statements
 */
function generateInsertStatements(projects, propertyIds) {
  if (projects.length === 0) {
    console.error('No projects found. Please check your HTML parsing logic.');
    return;
  }

  if (propertyIds.length === 0) {
    console.error('No property IDs provided. Please add property IDs to the PROPERTY_IDS array.');
    return;
  }

  // Shuffle property IDs for random assignment
  const shuffledPropertyIds = shuffle(propertyIds);

  console.log('-- Generated INSERT statements for projects table');
  console.log('-- Total projects:', projects.length);
  console.log('-- Run this in Supabase SQL Editor\n');
  console.log('INSERT INTO projects (name, banner_image, property_id, display_order, status) VALUES');

  const values = projects.map((project, index) => {
    // Cycle through property IDs if we have more projects than properties
    const propertyId = shuffledPropertyIds[index % shuffledPropertyIds.length];
    const name = project.name.replace(/'/g, "''"); // Escape single quotes
    const bannerImage = project.banner_image;
    const displayOrder = index + 1;

    return `  ('${name}', '${bannerImage}', '${propertyId}', ${displayOrder}, 'active')`;
  });

  console.log(values.join(',\n') + ';');
  console.log('\n-- Total projects to insert:', projects.length);
}

// Main execution
function main() {
  console.log('Extracting projects from HTML...\n');

  const projects = extractProjectsFromHTML(HTML_CONTENT);

  if (projects.length === 0) {
    console.log('\nNo projects extracted. Please check:');
    console.log('1. HTML_CONTENT contains valid HTML');
    console.log('2. extractProjectsFromHTML function matches your HTML structure');
    console.log('\nExample HTML structure expected:');
    console.log('<div class="portfolio-item">');
    console.log('  <img src="https://...">');
    console.log('  <div class="title">Project Name</div>');
    console.log('</div>');
    return;
  }

  console.log(`Found ${projects.length} projects\n`);
  console.log('Sample projects:');
  projects.slice(0, 3).forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   ${p.banner_image}\n`);
  });

  console.log('Generating SQL INSERT statements...\n');
  console.log('='.repeat(80));
  console.log('\n');

  generateInsertStatements(projects, PROPERTY_IDS);

  console.log('\n');
  console.log('='.repeat(80));
  console.log('\nNext steps:');
  console.log('1. Copy the INSERT statement above');
  console.log('2. Go to Supabase SQL Editor');
  console.log('3. Paste and run the SQL');
  console.log('4. Verify in your admin panel: http://localhost:3000/admin/projects');
}

// Run the script
main();
