import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { jsonResponseNoCache } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const { data: property, error: propertyError } = await (supabase
      .from('properties') as any)
      .select('*')
      .eq('id', params.id)
      .single();

    if (propertyError || !property) {
      return jsonResponseNoCache({ error: 'Property not found' }, { status: 404 });
    }

    const { data: images, error: imagesError } = await (supabase
      .from('property_images') as any)
      .select('*')
      .eq('property_id', params.id)
      .order('display_order');

    const imageData = images || [];

    // Fetch category information
    let mainCategoryName = '';
    let subCategoryName = '';

    if (property.category_id) {
      const { data: mainCat } = await (supabase
        .from('categories') as any)
        .select('name')
        .eq('id', property.category_id)
        .single();

      if (mainCat) {
        mainCategoryName = mainCat.name;
      }
    }

    if (property.sub_category_id) {
      const { data: subCat } = await (supabase
        .from('categories') as any)
        .select('name')
        .eq('id', property.sub_category_id)
        .single();

      if (subCat) {
        subCategoryName = subCat.name;
      }
    }

    return jsonResponseNoCache({
      property: {
        public_name: property.public_name || property.name, // Fallback to internal code if no public name
        sub_heading: property.sub_heading || '',
        city: property.city,
        description: property.description || '',
        main_category: mainCategoryName,
        sub_category: subCategoryName,
      },
      images: imageData.map((img: any) => ({
        url: img.image_url,
        tags: img.tags || [],
        order: img.display_order
      }))
    });

  } catch (error) {
    console.error('Error fetching property data:', error);
    return jsonResponseNoCache({ error: 'Failed to fetch property data' }, { status: 500 });
  }
}
