'use client';

import { useState, useEffect } from 'react';
import { Search, X, Eye, Trash2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteImageFromS3 } from '@/lib/s3-upload';
import Link from 'next/link';

export default function ApprovedPropertiesPage() {
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
      const { data, error } = await supabase
        .from('properties')
        .select('*, users(full_name, email)')
        .eq('status', 'active')
        .not('owner_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
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
      const { error } = await supabase
        .from('properties')
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
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('images, primary_image')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete all images from S3
      const allImages = [...(property.images || [])];
      if (property.primary_image && !allImages.includes(property.primary_image)) {
        allImages.push(property.primary_image);
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
      const { error } = await supabase
        .from('properties')
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
    return (
      property.name?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.users?.full_name?.toLowerCase().includes(searchLower) ||
      property.users?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approved Properties</h1>
        <div className="text-sm text-gray-600">
          {filteredProperties.length} user-submitted properties
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
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
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        <div className="text-sm text-gray-500">{property.property_type}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">{property.users?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{property.users?.email}</div>
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
                          <Link
                            href={`/property/${property.id}`}
                            target="_blank"
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeactivate(property.id)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                            title="Deactivate"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
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
