'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Edit, Trash2, Eye, Star, Upload, Plus, Sparkles } from 'lucide-react';
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
  real_name?: string;
  city: string;
  zipcode?: string;
  status: string;
  primary_image: string;
  images: string[];
  is_featured: boolean;
  owner_id: string | null;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
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
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkStats, setBulkStats] = useState({ success: 0, failed: 0, skipped: 0 });
  const [bulkErrors, setBulkErrors] = useState<Array<{ property: string, error: string }>>([]);

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

    // Use directFetch WITH authToken for RLS-protected admins table
    const { directFetch } = await import('@/lib/supabase');
    const { data: admin } = await directFetch('admins', {
      select: '*',
      eq: { email: session.user.email || '' },
      single: true,
      authToken: session.access_token
    });

    if (!admin) {
      console.log('User not found in admins table');
      router.push('/admin/login');
    }
  }

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

      // Fetch properties using directFetch with auth token
      const { directFetch } = await import('@/lib/supabase');

      let queryParams: any = {
        select: '*',
        order: 'created_at',
        ascending: false,
        authToken: session.access_token
      };

      // Apply status filter
      if (statusFilter !== 'all') {
        queryParams.eq = { status: statusFilter };
      }

      const { data, error } = await directFetch('properties', queryParams);

      if (error) {
        console.error('Error fetching properties:', error);
        alert('Error loading properties: ' + error.message);
        setLoading(false);
        return;
      }

      // Get unique owner IDs that are not null
      const ownerIds = Array.from(new Set(
        data?.filter((p: any) => p.owner_id).map((p: any) => p.owner_id) || []
      ));

      // Fetch owner information using directFetch with auth token
      let ownersMap: Record<string, any> = {};
      if (ownerIds.length > 0 && session) {
        const { directFetch } = await import('@/lib/supabase');
        const { data: owners } = await directFetch('users', {
          select: 'id,full_name,email',
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

      // Transform the data to add owner information
      const transformedData = data?.map((property: any) => ({
        ...property,
        owner_name: property.owner_id ? ownersMap[property.owner_id]?.full_name || null : null,
        owner_email: property.owner_id ? ownersMap[property.owner_id]?.email || null : null,
      })) || [];

      console.log('Fetched properties with owners:', transformedData);
      setProperties(transformedData);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_featured: !currentValue })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await fetchProperties();
    } catch (error: any) {
      alert('Error updating featured status: ' + error.message);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

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

    // Give React time to render the modal before starting async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Fetch property to get image URLs
      setDeleteProgress('📥 Fetching property data...');
      const { directFetch } = await import('@/lib/supabase');
      const { data: property, error: fetchError } = await directFetch('properties', {
        select: 'images, primary_image',
        eq: { id },
        single: true,
        authToken: session.access_token
      });

      if (fetchError) throw fetchError;

      // Collect all image URLs
      const allImages = [...((property as any).images || [])];
      if ((property as any).primary_image && !allImages.includes((property as any).primary_image)) {
        allImages.push((property as any).primary_image);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

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

  async function handleBulkAIUpdate() {
    // Step 1: Confirmation dialog
    const confirmed = confirm(
      'This will regenerate AI content (sub-heading and description) for ALL properties in the database.\n\n' +
      'This operation may take several minutes and will consume OpenAI API credits.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setBulkUpdating(true);
    setBulkStats({ success: 0, failed: 0, skipped: 0 });
    setBulkErrors([]);

    try {
      // Step 2: Fetch all properties with complete data
      console.log('🔄 Fetching all properties...');

      const { directFetch } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('Session expired. Please login again.');
        router.push('/admin/login');
        return;
      }

      const { data: properties, error: fetchError } = await directFetch('properties', {
        select: `
          id,
          name,
          real_name,
          city,
          address,
          category_id,
          sub_category_id,
          property_tags,
          images,
          sub_heading
        `,
        order: 'created_at',
        ascending: true,
        authToken: session.access_token,
      });

      if (fetchError || !properties) {
        alert('Failed to fetch properties: ' + (fetchError?.message || 'Unknown error'));
        return;
      }

      console.log(`📊 Found ${properties.length} properties to process`);
      setBulkProgress({ current: 0, total: properties.length });

      // Step 3: Fetch all categories for lookups
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, parent_id');

      const categoryMap = new Map((categories || []).map((c: any) => [c.id, c]));

      // Step 4: Process each property
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      const errors: Array<{ property: string, error: string }> = [];

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];

        setBulkProgress({ current: i + 1, total: properties.length });

        try {
          // Skip if no images
          if (!property.images || property.images.length < 1) {
            console.log(`⏭️  Skipping ${property.real_name || property.name} - no images`);
            skippedCount++;
            setBulkStats({ success: successCount, failed: failedCount, skipped: skippedCount });
            continue;
          }

          // Get category names
          const mainCategory = categoryMap.get(property.category_id);
          const subCategory = categoryMap.get(property.sub_category_id);

          // Prepare grid images (first 6)
          const gridImageUrls = property.images.slice(0, 6);

          console.log(`🤖 Generating AI content for: ${property.real_name || property.name}`);

          // Call AI generation API
          const response = await fetch('/api/generate-property-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyName: property.real_name || property.name,
              categoryName: mainCategory?.name || '',
              subCategoryName: subCategory?.name || '',
              city: property.city,
              address: property.address || '',
              propertyTags: property.property_tags || [],
              gridImageUrls: gridImageUrls,
            }),
          });

          if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'AI generation failed');
          }

          // Update property in database
          const updateResult = await supabase
            .from('properties')
            // @ts-expect-error - Supabase type inference issue with update
            .update({
              sub_heading: data.sub_heading,
              description: data.description,
              updated_at: new Date().toISOString(),
            })
            .eq('id', property.id);

          const updateError = updateResult.error;

          if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          console.log(`✅ Updated: ${property.real_name || property.name}`);
          successCount++;

          // Update stats
          setBulkStats({ success: successCount, failed: failedCount, skipped: skippedCount });

          // Rate limiting: wait 1 second between API calls to avoid rate limits
          if (i < properties.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error: any) {
          console.error(`❌ Failed to update ${property.real_name || property.name}:`, error);
          failedCount++;
          errors.push({
            property: property.real_name || property.name,
            error: error.message,
          });
          setBulkStats({ success: successCount, failed: failedCount, skipped: skippedCount });
          // Continue processing other properties
        }
      }

      // Step 5: Show completion summary
      setBulkErrors(errors);
      alert(
        `Bulk AI Update Complete!\n\n` +
        `✅ Successful: ${successCount}\n` +
        `❌ Failed: ${failedCount}\n` +
        `⏭️  Skipped: ${skippedCount}\n\n` +
        (errors.length > 0 ? 'Check console for error details.' : 'All properties processed successfully!')
      );

      // Refresh properties list
      await fetchProperties();

    } catch (error: any) {
      console.error('Bulk update error:', error);
      alert('Bulk update failed: ' + error.message);
    } finally {
      setBulkUpdating(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.real_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.zipcode || '').toLowerCase().includes(searchTerm.toLowerCase());

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
          {/* Bulk AI Update button - hidden for now */}
          {/* <Button
            variant="outline"
            onClick={handleBulkAIUpdate}
            disabled={bulkUpdating || loading}
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            {bulkUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Bulk AI Update
              </>
            )}
          </Button> */}
          <Button
            variant="outline"
            onClick={handleBulkImportProperties}
            disabled={bulkImportLoading}
            className="border-brand text-brand hover:bg-red-50"
          >
            {bulkImportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand mr-2"></div>
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
            className="bg-brand hover:bg-red-700"
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

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[800px]">
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
                    <div
                      className="w-16 h-16 relative rounded overflow-hidden bg-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                      title="View property details"
                    >
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
                    <div
                      className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                      title="View property details"
                    >
                      {property.name}
                    </div>
                    <div className="text-sm text-gray-500">{property.images?.length || 0} images</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {property.owner_name || 'Admin'}
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
                        onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
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

      {/* Bulk AI Update Progress Modal */}
      {bulkUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>

              <h3 className="text-lg font-semibold mb-2">Bulk AI Update in Progress</h3>

              {bulkProgress.total > 0 && (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Processing property {bulkProgress.current} of {bulkProgress.total}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="font-semibold text-green-600">{bulkStats.success}</div>
                        <div className="text-xs text-gray-600">Success</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">{bulkStats.failed}</div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-600">{bulkStats.skipped}</div>
                        <div className="text-xs text-gray-600">Skipped</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-gray-500 mt-4">
                Please do not close this page. This may take several minutes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
