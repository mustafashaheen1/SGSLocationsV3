'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Edit, Trash2, Eye, Star, Upload, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteImageFromS3 } from '@/lib/s3-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Property {
  id: string;
  name: string;
  city: string;
  status: string;
  primary_image: string;
  images: string[];
  is_featured: boolean;
  owner_id: string | null;
  created_at: string;
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<string>('');
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchProperties();
  }, [statusFilter]);

  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/admin/login');
      return;
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (!admin) {
      console.log('User not found in admins table');
      router.push('/admin/login');
    }
  }

  async function fetchProperties() {
    setLoading(true);

    try {
      // Build query - don't join with users table since it may not exist
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        alert('Error loading properties: ' + error.message);
      } else {
        console.log('Fetched properties:', data);
        setProperties(data || []);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_featured: !currentValue })
        .eq('id', id);

      if (error) throw error;

      await fetchProperties();
    } catch (error: any) {
      alert('Error updating featured status: ' + error.message);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      await fetchProperties();
    } catch (error: any) {
      alert('Error updating status: ' + error.message);
    }
  }

  async function deleteProperty(id: string) {
    if (!confirm('Are you sure you want to delete this property? This will also delete all associated images from S3.'))
      return;

    setDeletingPropertyId(id);
    setDeleteProgress('Starting deletion...');

    try {
      // Fetch property to get image URLs
      setDeleteProgress('📥 Fetching property data...');
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('images, primary_image')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Collect all image URLs
      const allImages = [...(property.images || [])];
      if (property.primary_image && !allImages.includes(property.primary_image)) {
        allImages.push(property.primary_image);
      }

      // Delete images from S3 with progress
      if (allImages.length > 0) {
        setDeleteProgress(`🗑️ Deleting ${allImages.length} images from S3...`);

        for (let i = 0; i < allImages.length; i++) {
          try {
            await deleteImageFromS3(allImages[i]);
            setDeleteProgress(`🗑️ Deleting images... (${i + 1}/${allImages.length})`);
          } catch (error) {
            console.error(`Failed to delete image ${i + 1}:`, error);
          }
        }
      }

      // Delete from database
      setDeleteProgress('🗄️ Removing from database...');
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeleteProgress('✓ Property deleted successfully!');

      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      await fetchProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      alert('Error deleting property: ' + error.message);
    } finally {
      setDeletingPropertyId(null);
      setDeleteProgress('');
    }
  }

  async function handleBulkImportProperties() {
    setBulkImportLoading(true);

    try {
      const response = await fetch('/api/smugmug-all-albums');
      const data = await response.json();

      if (data.success && data.albums && data.albums.length > 0) {
        localStorage.setItem('sgs_import_queue', JSON.stringify(data.albums));
        localStorage.setItem('sgs_import_current_index', '0');

        router.push('/admin/properties/add?bulk_import=true');
      } else {
        alert('No albums found to import or error occurred: ' + (data.error || 'No albums'));
      }
    } catch (error: any) {
      alert('Error fetching albums: ' + error.message);
    } finally {
      setBulkImportLoading(false);
    }
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-gray-600 mt-1">{filteredProperties.length} total properties</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBulkImportProperties}
            disabled={bulkImportLoading}
            className="hidden border-[#e11921] text-[#e11921] hover:bg-red-50"
          >
            {bulkImportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#e11921] mr-2"></div>
                Loading Albums...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import Properties
              </>
            )}
          </Button>
          <Button
            onClick={() => router.push('/admin/properties/add')}
            className="bg-[#e11921] hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search properties or cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Loading properties...
                </td>
              </tr>
            ) : filteredProperties.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No properties found matching your criteria
                </td>
              </tr>
            ) : (
              filteredProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 relative rounded overflow-hidden bg-gray-200">
                      <img
                        src={property.primary_image || property.images?.[0] || '/placeholder.jpg'}
                        alt={property.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=No+Image';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{property.name}</div>
                    <div className="text-sm text-gray-500">{property.images?.length || 0} images</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {property.owner_id ? property.owner_id.substring(0, 8) + '...' : 'Admin'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {property.city}
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={property.status}
                      onValueChange={(value) => updateStatus(property.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFeatured(property.id, property.is_featured)}
                      className={`p-2 rounded ${
                        property.is_featured
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={property.is_featured ? 'fill-current' : ''} size={20} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/property/${property.id}`, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/properties/edit/${property.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteProperty(property.id)}
                        disabled={deletingPropertyId === property.id}
                        className={`p-2 rounded ${
                          deletingPropertyId === property.id
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>
      )}

      {/* Deletion Progress Modal */}
      {deletingPropertyId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Deleting Property</h3>
              <p className="text-sm text-gray-600 mb-4">
                This may take a moment as we delete all images from storage...
              </p>
              {deleteProgress && (
                <div className="bg-gray-50 rounded p-3 text-sm font-mono text-left">
                  {deleteProgress}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
