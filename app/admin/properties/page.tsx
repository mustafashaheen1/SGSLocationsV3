'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Edit, Trash2, Eye, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProperties();
    } catch (error: any) {
      alert('Error deleting property: ' + error.message);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Properties</h1>
        <Button
          onClick={() => router.push('/admin/properties/add')}
          className="bg-red-600 hover:bg-red-700"
        >
          + Add Property
        </Button>
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
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
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
    </div>
  );
}
