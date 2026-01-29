'use client';

import { useState, useEffect } from 'react';
import { Search, X, Eye, Trash2, Star, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteImageFromS3 } from '@/lib/s3-upload';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ApprovedPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      // Use directFetch with auth token to bypass RLS issues
      const { directFetch } = await import('@/lib/supabase');
      const { data, error } = await directFetch('properties', {
        select: '*',
        eq: { status: 'active' },
        order: 'created_at',
        authToken: session.access_token
      });

      if (error) {
        console.error('Error fetching approved properties:', error);
        throw error;
      }

      // Filter for user-submitted properties (owner_id is not null)
      const userProperties = (data as any[])?.filter(p => p.owner_id !== null) || [];

      // Get unique category IDs
      const categoryIds = Array.from(new Set(
        userProperties?.filter((p: any) => p.category_id).map((p: any) => p.category_id) || []
      ));
      const subCategoryIds = Array.from(new Set(
        userProperties?.filter((p: any) => p.sub_category_id).map((p: any) => p.sub_category_id) || []
      ));

      // Fetch category information using directFetch with auth token
      let categoriesMap: Record<string, any> = {};
      if (categoryIds.length > 0) {
        const { data: categories } = await directFetch('categories', {
          select: 'id,name',
          in: { id: categoryIds },
          authToken: session.access_token
        });

        if (categories) {
          (categories as any[]).forEach((cat: any) => {
            categoriesMap[cat.id] = cat;
          });
        }
      }

      // Fetch sub-category information
      let subCategoriesMap: Record<string, any> = {};
      if (subCategoryIds.length > 0) {
        const { data: subCategories } = await directFetch('categories', {
          select: 'id,name',
          in: { id: subCategoryIds },
          authToken: session.access_token
        });

        if (subCategories) {
          (subCategories as any[]).forEach((cat: any) => {
            subCategoriesMap[cat.id] = cat;
          });
        }
      }

      // Get unique owner IDs that are not null
      const ownerIds = Array.from(new Set(
        userProperties?.filter((p: any) => p.owner_id).map((p: any) => p.owner_id) || []
      ));

      // Fetch owner information using directFetch with auth token
      let ownersMap: Record<string, any> = {};
      if (ownerIds.length > 0) {
        const { data: owners } = await directFetch('users', {
          select: 'id,full_name,email,phone',
          in: { id: ownerIds },
          authToken: session.access_token
        });

        // Create a map of owner_id to owner data
        if (owners) {
          (owners as any[]).forEach((owner: any) => {
            ownersMap[owner.id] = owner;
          });
        }
      }

      // Transform the data to add category and owner information and sort by created_at descending
      const transformedData = userProperties.map((property: any) => ({
        ...property,
        main_category: property.category_id ? categoriesMap[property.category_id] : null,
        sub_category: property.sub_category_id ? subCategoriesMap[property.sub_category_id] : null,
        owner_name: property.owner_id ? ownersMap[property.owner_id]?.full_name || null : null,
        owner_email: property.owner_id ? ownersMap[property.owner_id]?.email || null : null,
        owner_phone: property.owner_id ? ownersMap[property.owner_id]?.phone || null : null,
      }));

      const sortedData = transformedData.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('Approved properties fetched:', sortedData?.length, sortedData);
      setProperties(sortedData || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  async function handleDeactivate(id: string) {
    try {
      const { error } = await (supabase
        .from('properties') as any)
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      showSuccess('Property deactivated');
      fetchProperties();
    } catch (error: any) {
      alert('Error deactivating property: ' + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this property? This will also delete all associated images from S3.')) {
      return;
    }

    try {
      // First, fetch the property to get all image URLs
      const { data: property, error: fetchError } = await (supabase
        .from('properties') as any)
        .select('images, primary_image')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete all images from S3
      const allImages = [...((property as any).images || [])];
      if ((property as any).primary_image && !allImages.includes((property as any).primary_image)) {
        allImages.push((property as any).primary_image);
      }

      console.log(`Deleting ${allImages.length} images from S3...`);

      for (const imageUrl of allImages) {
        try {
          await deleteImageFromS3(imageUrl);
          console.log(`✓ Deleted: ${imageUrl}`);
        } catch (error) {
          console.error(`✗ Failed to delete: ${imageUrl}`, error);
        }
      }

      // Then delete the property from database
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Property and ${allImages.length} images deleted successfully`);
      fetchProperties();
    } catch (error: any) {
      alert('Error deleting property: ' + error.message);
    }
  }

  async function toggleFeatured(id: string, currentStatus: boolean) {
    try {
      const { error } = await (supabase
        .from('properties') as any)
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Property ${!currentStatus ? 'featured' : 'unfeatured'}`);
      fetchProperties();
    } catch (error: any) {
      alert('Error updating featured status: ' + error.message);
    }
  }

  const filteredProperties = properties.filter(property => {
    const searchLower = searchTerm.toLowerCase();

    // Check existing fields
    if (
      property.name?.toLowerCase().includes(searchLower) ||
      (property.real_name || '')?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      (property.zipcode || '')?.toLowerCase().includes(searchLower) ||
      (property.description || '')?.toLowerCase().includes(searchLower) ||
      (property.address || '')?.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Check property tags
    if (property.property_tags?.some(tag =>
      tag.toLowerCase().includes(searchLower)
    )) {
      return true;
    }

    // Check property contacts (JSONB array)
    if (property.contacts && Array.isArray(property.contacts)) {
      const contactMatch = property.contacts.some((contact: any) =>
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.cell_number?.toLowerCase().includes(searchLower) ||
        contact.home_number?.toLowerCase().includes(searchLower) ||
        contact.office_number?.toLowerCase().includes(searchLower)
      );
      if (contactMatch) return true;
    }

    // Check owner information
    if (
      (property.owner_name || '')?.toLowerCase().includes(searchLower) ||
      (property.owner_email || '')?.toLowerCase().includes(searchLower) ||
      (property.owner_phone || '')?.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approved Properties</h1>
        <div className="text-sm text-gray-600">
          {filteredProperties.length} user-submitted approved properties
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search approved properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <p className="mt-2 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Featured</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <img
                          src={property.primary_image || property.images?.[0] || '/placeholder.jpg'}
                          alt={property.name}
                          className="h-12 w-16 object-cover rounded"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                          title="View property details"
                        >
                          {property.name}
                        </div>
                        <div className="text-sm text-gray-500">{property.images?.length || 0} images</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">{property.main_category?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{property.sub_category?.name || ''}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {property.city}, {property.county}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleFeatured(property.id, property.is_featured)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                            property.is_featured
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Star className={property.is_featured ? 'fill-current' : ''} size={12} />
                          {property.is_featured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(property.id)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                            title="Deactivate"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="p-2 bg-brand hover:bg-brand-hover text-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No approved properties found
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
