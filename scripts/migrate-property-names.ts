/**
 * Migration script to convert existing property names to the new system:
 * - Move current "name" to "real_name"
 * - Generate obfuscated names for the "name" field
 *
 * Run this script with: npx tsx scripts/migrate-property-names.ts
 */

import { createClient } from '@supabase/supabase-js';
import { generateObfuscatedName } from '../lib/name-obfuscator';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePropertyNames() {
  console.log('🔄 Starting property name migration...\n');

  try {
    // Fetch all properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, name, real_name')
      .order('name');

    if (error) {
      throw error;
    }

    if (!properties || properties.length === 0) {
      console.log('No properties found to migrate.');
      return;
    }

    console.log(`Found ${properties.length} properties to migrate.\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        // Skip if already has real_name (already migrated)
        if (property.real_name) {
          console.log(`⏭️  Skipping "${property.name}" (already migrated)`);
          skipCount++;
          continue;
        }

        const currentName = property.name;
        const realName = currentName; // Current name becomes real_name
        const obfuscatedName = generateObfuscatedName(realName);

        // Update the property
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            real_name: realName,
            name: obfuscatedName
          })
          .eq('id', property.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ "${currentName}" → "${obfuscatedName}"`);
        successCount++;
      } catch (propError: any) {
        console.error(`❌ Error migrating property ${property.id}:`, propError.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${properties.length}`);

    if (successCount > 0) {
      console.log('\n✨ Migration completed successfully!');
      console.log('   - Real names are now stored in "real_name" column (admin only)');
      console.log('   - Obfuscated names are in "name" column (public facing)');
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migratePropertyNames();
