'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string;
  display_order: number;
  is_active: boolean;
  property_count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    display_order: 1,
  });

  useEffect(() => {
    console.log('Categories page mounted');
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // For each category, count properties separately
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (cat) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .contains('categories', [cat.name]);

          return {
            ...cat,
            property_count: count || 0
          };
        })
      );

      console.log('Categories loaded:', categoriesWithCount);
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!formData.name || !formData.slug) {
      alert('Please fill in name and slug');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          image: formData.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
          display_order: formData.display_order,
          is_active: true,
        }]);

      if (error) throw error;

      setShowAddForm(false);
      setFormData({ name: '', slug: '', description: '', image: '', display_order: 1 });
      fetchCategories();
    } catch (error: any) {
      alert('Error adding category: ' + error.message);
    }
  }

  function handleEditClick(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image,
      display_order: category.display_order,
    });
    setShowEditForm(true);
  }

  async function handleUpdate() {
    if (!editingCategory || !formData.name || !formData.slug) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          image: formData.image,
          display_order: formData.display_order,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      setShowEditForm(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', image: '', display_order: 1 });
      fetchCategories();
    } catch (error: any) {
      alert('Error updating category: ' + error.message);
    }
  }

  async function handleDelete(id: string, currentOrder: number) {
    if (!confirm('Are you sure? This will remove this category from all properties.')) {
      return;
    }

    try {
      // Step 1: Delete the category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Step 2: Reorder remaining categories
      // Get all categories with display_order greater than the deleted one
      const categoriesToReorder = categories.filter(
        cat => cat.display_order > currentOrder
      );

      // Update each category's display_order to decrease by 1
      for (const cat of categoriesToReorder) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ display_order: cat.display_order - 1 })
          .eq('id', cat.id);

        if (updateError) throw updateError;
      }

      // Step 3: Refresh the list
      fetchCategories();
    } catch (error: any) {
      alert('Error deleting category: ' + error.message);
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
    } catch (error: any) {
      alert('Error updating category: ' + error.message);
    }
  }

  if (loading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* ADD FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Category</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Modern Architecture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., modern-architecture"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description..."
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
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd}>Save Category</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FORM MODAL */}
      {showEditForm && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Category</h2>
              <button onClick={() => setShowEditForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Modern Architecture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., modern-architecture"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description..."
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
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleUpdate}>Update Category</Button>
              <Button variant="outline" onClick={() => setShowEditForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Properties</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4">{category.display_order}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={category.image} alt={category.name} className="w-16 h-16 object-cover rounded" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {category.property_count} properties
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(category.id, category.is_active)}
                    className={`px-2 py-1 rounded-full text-xs ${
                      category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {category.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(category.id, category.display_order)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
