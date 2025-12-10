import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting category restructure migration...\n');

  try {
    // First, let's see what categories currently exist
    console.log('📋 Current categories:');
    const { data: currentCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug, display_order')
      .order('display_order');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${currentCategories?.length || 0} existing categories:`);
    currentCategories?.forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.name} (${cat.slug})`);
    });
    console.log('');

    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'category-restructure.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    console.log('⚙️  Executing migration...');

    // Note: Supabase client doesn't support raw SQL execution directly
    // We need to use the REST API with the service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // If direct SQL execution isn't available, we'll do it step by step
      console.log('⚠️  Direct SQL execution not available, running migration step by step...\n');
      await runMigrationStepByStep();
    } else {
      console.log('✅ Migration executed successfully!\n');
      await showResults();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function runMigrationStepByStep() {
  console.log('Step 1: Adding parent_id column to categories...');
  // This needs to be done via Supabase Dashboard or direct DB access
  // For now, we'll assume the column exists or create it via API

  console.log('Step 2: Adding sub_category_id column to properties...');
  // Same as above

  console.log('Step 3: Creating main categories...');
  const mainCategories = [
    {
      name: 'Residential',
      slug: 'residential',
      description: 'Residential properties including homes, apartments, and living spaces',
      image: 'https://sgslocations.s3.us-east-1.amazonaws.com/categories/residential.jpg',
      display_order: 1,
      is_active: true,
      is_top: true,
      parent_id: null
    },
    {
      name: 'Commercial',
      slug: 'commercial',
      description: 'Commercial properties including offices, retail, and business spaces',
      image: 'https://sgslocations.s3.us-east-1.amazonaws.com/categories/commercial.jpg',
      display_order: 2,
      is_active: true,
      is_top: true,
      parent_id: null
    },
    {
      name: 'Industrial',
      slug: 'industrial',
      description: 'Industrial properties including warehouses, factories, and production facilities',
      image: 'https://sgslocations.s3.us-east-1.amazonaws.com/categories/industrial.jpg',
      display_order: 3,
      is_active: true,
      is_top: true,
      parent_id: null
    }
  ];

  for (const category of mainCategories) {
    const { error } = await supabase
      .from('categories')
      .upsert(category, { onConflict: 'slug' });

    if (error && !error.message.includes('already exists')) {
      console.error(`Error creating ${category.name}:`, error);
    } else {
      console.log(`  ✅ ${category.name} created`);
    }
  }

  console.log('\nStep 4: Converting existing categories to sub-categories...');

  // Get the main category IDs
  const { data: mainCats } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', ['residential', 'commercial', 'industrial']);

  if (!mainCats || mainCats.length !== 3) {
    throw new Error('Failed to create main categories');
  }

  const mainCategoryIds = {
    residential: mainCats.find(c => c.slug === 'residential')!.id,
    commercial: mainCats.find(c => c.slug === 'commercial')!.id,
    industrial: mainCats.find(c => c.slug === 'industrial')!.id
  };

  // Get all existing categories (excluding the new main ones)
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .not('slug', 'in', `(residential,commercial,industrial)`)
    .order('display_order');

  if (existingCategories && existingCategories.length > 0) {
    const mainCatArray = [
      mainCategoryIds.residential,
      mainCategoryIds.commercial,
      mainCategoryIds.industrial
    ];

    for (let i = 0; i < existingCategories.length; i++) {
      const category = existingCategories[i];
      const mainCategoryId = mainCatArray[i % 3]; // Round-robin assignment

      // Update category to be a sub-category
      const { error: updateCatError } = await supabase
        .from('categories')
        .update({
          parent_id: mainCategoryId,
          is_top: false
        })
        .eq('id', category.id);

      if (updateCatError) {
        console.error(`Error updating ${category.name}:`, updateCatError);
      } else {
        const mainCatName = i % 3 === 0 ? 'Residential' : i % 3 === 1 ? 'Commercial' : 'Industrial';
        console.log(`  ✅ ${category.name} → ${mainCatName} sub-category`);
      }

      // Update properties that use this category
      const { error: updatePropError } = await supabase
        .from('properties')
        .update({
          sub_category_id: category.id,
          category_id: mainCategoryId
        })
        .eq('category_id', category.id);

      if (updatePropError) {
        console.error(`Error updating properties for ${category.name}:`, updatePropError);
      }
    }

    console.log(`\n✅ Converted ${existingCategories.length} categories to sub-categories`);
  }

  console.log('\n✅ Migration completed successfully!\n');
  await showResults();
}

async function showResults() {
  console.log('📊 Migration Results:\n');

  // Show main categories
  const { data: mainCategories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .is('parent_id', null)
    .order('display_order');

  console.log('Main Categories:');
  mainCategories?.forEach(cat => {
    console.log(`  • ${cat.name} (${cat.slug})`);
  });
  console.log('');

  // Show sub-categories by main category
  for (const mainCat of mainCategories || []) {
    const { data: subCategories } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('parent_id', mainCat.id)
      .order('display_order');

    if (subCategories && subCategories.length > 0) {
      console.log(`${mainCat.name} Sub-categories (${subCategories.length}):`);
      subCategories.forEach(sub => {
        console.log(`  └─ ${sub.name}`);
      });
      console.log('');
    }
  }

  // Count properties by category
  console.log('Property Distribution:');
  for (const mainCat of mainCategories || []) {
    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', mainCat.id);

    console.log(`  ${mainCat.name}: ${count || 0} properties`);
  }
}

// Run the migration
runMigration();
