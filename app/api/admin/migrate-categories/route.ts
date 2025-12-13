import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { createClient } from '@supabase/supabase-js';
import { jsonResponseNoCache } from '@/lib/api-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting category restructure migration...');

    // Step 1: Get current categories
    const { data: currentCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug, display_order')
      .order('display_order');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${currentCategories?.length || 0} existing categories`);

    // Step 2: Create main categories
    console.log('Creating main categories...');

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

    // Check if main categories already exist
    const { data: existingMainCats } = await supabase
      .from('categories')
      .select('slug')
      .in('slug', ['residential', 'commercial', 'industrial']);

    const existingSlugs = new Set(existingMainCats?.map(c => c.slug) || []);

    // Insert only non-existing main categories
    for (const category of mainCategories) {
      if (!existingSlugs.has(category.slug)) {
        const { error } = await supabase
          .from('categories')
          .insert(category);

        if (error) {
          console.error(`Error creating ${category.name}:`, error);
          throw error;
        }
        console.log(`✅ ${category.name} created`);
      } else {
        console.log(`ℹ️  ${category.name} already exists`);
      }
    }

    // Step 3: Get the main category IDs
    const { data: mainCats } = await supabase
      .from('categories')
      .select('id, slug')
      .in('slug', ['residential', 'commercial', 'industrial']);

    if (!mainCats || mainCats.length !== 3) {
      throw new Error('Failed to create/find main categories');
    }

    const mainCategoryIds = {
      residential: mainCats.find(c => c.slug === 'residential')!.id,
      commercial: mainCats.find(c => c.slug === 'commercial')!.id,
      industrial: mainCats.find(c => c.slug === 'industrial')!.id
    };

    // Step 4: Convert existing categories to sub-categories
    console.log('Converting existing categories to sub-categories...');

    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name, slug, display_order')
      .not('slug', 'in', `(residential,commercial,industrial)`)
      .is('parent_id', null) // Only get categories that aren't already sub-categories
      .order('display_order');

    if (existingCategories && existingCategories.length > 0) {
      const mainCatArray = [
        { id: mainCategoryIds.residential, name: 'Residential' },
        { id: mainCategoryIds.commercial, name: 'Commercial' },
        { id: mainCategoryIds.industrial, name: 'Industrial' }
      ];

      const results = {
        converted: [] as any[],
        errors: [] as any[]
      };

      for (let i = 0; i < existingCategories.length; i++) {
        const category = existingCategories[i];
        const mainCat = mainCatArray[i % 3]; // Round-robin assignment

        try {
          // Update category to be a sub-category
          const { error: updateCatError } = await supabase
            .from('categories')
            .update({
              parent_id: mainCat.id,
              is_top: false
            })
            .eq('id', category.id);

          if (updateCatError) {
            throw updateCatError;
          }

          // Update properties that use this category name in their categories array
          // Since category_id might not exist or be populated yet, we match by name in the categories array
          const { data: matchingProperties } = await supabase
            .from('properties')
            .select('id, categories')
            .contains('categories', [category.name]);

          if (matchingProperties && matchingProperties.length > 0) {
            console.log(`Found ${matchingProperties.length} properties with category "${category.name}"`);

            // Update each property individually
            for (const prop of matchingProperties) {
              const { error: updatePropError } = await supabase
                .from('properties')
                .update({
                  sub_category_id: category.id,
                  category_id: mainCat.id
                })
                .eq('id', prop.id);

              if (updatePropError) {
                console.error(`Warning: Error updating property ${prop.id}:`, updatePropError);
              }
            }
          }

          results.converted.push({
            name: category.name,
            mainCategory: mainCat.name,
            propertiesUpdated: matchingProperties?.length || 0
          });

          console.log(`✅ ${category.name} → ${mainCat.name} sub-category (${matchingProperties?.length || 0} properties updated)`);
        } catch (error) {
          results.errors.push({
            name: category.name,
            error: error instanceof Error ? error.message : String(error)
          });
          console.error(`Error converting ${category.name}:`, error);
        }
      }

      console.log(`✅ Migration completed: ${results.converted.length} categories converted`);

      // Get final statistics
      const stats = {
        mainCategories: 3,
        subCategories: results.converted.length,
        errors: results.errors.length
      };

      // Count properties by category
      const propertyDistribution = await Promise.all(
        mainCatArray.map(async (mainCat) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', mainCat.id);

          return {
            category: mainCat.name,
            count: count || 0
          };
        })
      );

      return jsonResponseNoCache({
        success: true,
        message: 'Migration completed successfully',
        stats,
        converted: results.converted,
        errors: results.errors,
        propertyDistribution
      });
    } else {
      return jsonResponseNoCache({
        success: true,
        message: 'No categories to convert - migration already complete or no existing categories',
        stats: {
          mainCategories: 3,
          subCategories: 0,
          errors: 0
        }
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return jsonResponseNoCache(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    );
  }
}
