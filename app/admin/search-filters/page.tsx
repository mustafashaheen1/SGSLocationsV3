'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface SearchFilter {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  has_search: boolean;
  is_active: boolean;
  tag_count: number;
}

export default function SearchFiltersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    has_search: false,
    display_order: 1,
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  async function fetchFilters() {
    try {
      const { data, error } = await supabase
        .from('search_filters')
        .select('*')
        .order('display_order');

      if (error) throw error;

      const filtersWithCounts = await Promise.all(
        (data || []).map(async (filter) => {
          const { count } = await supabase
            .from('search_filter_tags')
            .select('*', { count: 'exact', head: true })
            .eq('filter_id', filter.id);

          return {
            ...filter,
            tag_count: count || 0,
          };
        })
      );

      setFilters(filtersWithCounts);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleAdd() {
    if (!formData.name) {
      alert('Please enter a filter name');
      return;
    }

    try {
      const slug = generateSlug(formData.name);

      const { error } = await supabase
        .from('search_filters')
        .insert([{
          name: formData.name,
          slug: slug,
          has_search: formData.has_search,
          display_order: formData.display_order,
          is_active: true,
        }]);

      if (error) throw error;

      setShowAddForm(false);
      setFormData({ name: '', slug: '', has_search: false, display_order: 1 });
      fetchFilters();
    } catch (error: any) {
      alert('Error adding filter: ' + error.message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" filter? This will also delete all its tags.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('search_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFilters();
    } catch (error: any) {
      alert('Error deleting filter: ' + error.message);
    }
  }

  if (loading) {
    return <div className="p-6">Loading filters...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Search Filters Management</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Filter
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Add New Filter</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Filter Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Outdoor Spaces"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_search}
                  onChange={(e) => setFormData({ ...formData, has_search: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Include search box for this filter</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd}>Save Filter</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filter Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Has Search</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filters.map((filter) => (
              <tr key={filter.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{filter.display_order}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => router.push(`/admin/search-filters/${filter.id}`)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {filter.name}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{filter.slug}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {filter.tag_count} tags
                  </span>
                </td>
                <td className="px-6 py-4">
                  {filter.has_search ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    filter.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {filter.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/search-filters/${filter.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(filter.id, filter.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filters.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No search filters yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
