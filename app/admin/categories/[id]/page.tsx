'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  name: string;
  city: string;
  county: string;
  primary_image: string;
  images: string[];
  categories: string[];
  status: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryAndProperties();
  }, [params.id]);

  async function fetchCategoryAndProperties() {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .contains('categories', [categoryData.name]);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function removePropertyFromCategory(propertyId: string) {
    if (!category) return;

    if (!confirm(`Remove this property from ${category.name}?`)) {
      return;
    }

    try {
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('categories')
        .eq('id', propertyId)
        .single();

      if (fetchError) throw fetchError;

      const updatedCategories = (property.categories || []).filter(
        (cat: string) => cat !== category.name
      );

      const { error: updateError } = await supabase
        .from('properties')
        .update({ categories: updatedCategories })
        .eq('id', propertyId);

      if (updateError) throw updateError;

      fetchCategoryAndProperties();
    } catch (error: any) {
      alert('Error removing property: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Category not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/categories')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Button>
        <div className="flex items-center gap-3">
          <img
            src={category.image}
            alt={category.name}
            className="w-16 h-16 object-cover rounded"
          />
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            <p className="text-gray-600">{properties.length} properties in this category</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {properties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No properties in this category yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img
                    src={property.primary_image || property.images?.[0] || '/placeholder.jpg'}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePropertyFromCategory(property.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    title="Remove from category"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{property.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {property.city}, {property.county}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    property.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : property.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {property.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
