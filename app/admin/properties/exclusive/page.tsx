'use client';

import { useState, useEffect } from 'react';
import { Search, X, Eye, Trash2, Award, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteImageFromS3 } from '@/lib/s3-upload';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ExclusivePropertiesPage() {
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
      // Fetch only exclusive properties
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_exclusive', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching exclusive properties:', error);
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

  async function removeExclusive(id: string) {
    try {
      const { error } = await (supabase
        .from('properties') as any)
        .update({ is_exclusive: false })
        .eq('id', id);

      if (error) throw error;
      showSuccess('Property removed from exclusive');
      fetchProperties();
    } catch (error: any) {
      alert('Error updating exclusive status: ' + error.message);
    }
  }

  const filteredProperties = properties.filter(property => {
    const searchLower = searchTerm.toLowerCase();
    return (
      property.name?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.address?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exclusive Properties</h1>
        <div className="text-sm text-gray-600">
          {filteredProperties.length} exclusive {filteredProperties.length === 1 ? 'property' : 'properties'}
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
              placeholder="Search exclusive properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">Loading exclusive properties...</p>
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
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
                        <div className="text-sm text-gray-500">{property.images?.length || 0} images</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">{property.categories?.[0] || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{property.address}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {property.city}, {property.county}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          property.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/property/${property.id}`}
                            target="_blank"
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            title="View Property"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => removeExclusive(property.id)}
                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                            title="Remove from Exclusive"
                          >
                            <X size={16} />
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
                <Award className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg font-medium">No exclusive properties found</p>
                <p className="text-sm mt-2">Exclusive properties will appear here</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
