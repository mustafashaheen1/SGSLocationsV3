import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { data: images, error: imagesError } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', params.id)
      .order('display_order');

    const imageData = images || [];

    return NextResponse.json({
      property: {
        name: property.name,
        city: property.city,
        description: property.description,
        address: property.address
      },
      images: imageData.map(img => ({
        url: img.image_url,
        tags: img.tags || [],
        order: img.display_order
      }))
    });

  } catch (error) {
    console.error('Error fetching property data:', error);
    return NextResponse.json({ error: 'Failed to fetch property data' }, { status: 500 });
  }
}
