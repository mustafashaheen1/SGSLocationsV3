'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, ChevronRight, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadImageToS3 } from '@/lib/s3-upload';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string;
  display_order: number;
  is_active: boolean;
  is_top: boolean;
  parent_id: string | null;
  property_count: number;
  prefix: string | null;
}

interface Property {
  id: string;
  name: string;
  city: string;
  status: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [subCategoryProperties, setSubCategoryProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddMainCategoryForm, setShowAddMainCategoryForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    display_order: 1,
    is_top: false,
    parent_id: null as string | null,
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<string>('');
  const [generatedPrefix, setGeneratedPrefix] = useState<string>('');
  const [prefixLoading, setPrefixLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.name) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formData.name]);

  // Generate prefix when adding main category
  useEffect(() => {
    if (formData.name && showAddMainCategoryForm) {
      const timer = setTimeout(async () => {
        await generatePrefix(formData.name);
      }, 500); // Debounce for 500ms
      return () => clearTimeout(timer);
    } else if (!showAddMainCategoryForm) {
      setGeneratedPrefix('');
      setPrefixLoading(false);
    }
  }, [formData.name, showAddMainCategoryForm]);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function generatePrefix(categoryName: string) {
    if (!categoryName || categoryName.trim().length === 0) {
      setGeneratedPrefix('');
      return;
    }

    setPrefixLoading(true);
    try {
      const response = await fetch('/api/categories/generate-prefix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to generate prefix');
      }

      const data = await response.json();
      setGeneratedPrefix(data.prefix || '');
    } catch (error: any) {
      console.error('Error generating prefix:', error);
      setGeneratedPrefix('ERR');
    } finally {
      setPrefixLoading(false);
    }
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)');
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function removeImage() {
    setUploadedImage(null);
    setImagePreview('');
  }

  async function fetchCategories() {
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      // Use directFetch with auth token
      const { directFetch } = await import('@/lib/supabase');
      const { data, error } = await directFetch('categories', {
        select: '*',
        order: 'display_order',
        authToken: session.access_token
      });

      if (error) throw error;

      // Fetch property counts using directFetch with auth token
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (cat: any) => {
          let count = 0;

          // If it's a main category, count properties in all sub-categories
          if (!cat.parent_id) {
            const { data: properties, error: propsError } = await directFetch('properties', {
              select: 'id',
              eq: { category_id: cat.id },
              authToken: session.access_token
            });

            if (propsError) {
              console.error(`Error fetching properties for category ${cat.id}:`, propsError);
            }
            count = properties ? (properties as any[]).length : 0;
          } else {
            // If it's a sub-category, count directly
            const { data: properties, error: propsError } = await directFetch('properties', {
              select: 'id',
              eq: { sub_category_id: cat.id },
              authToken: session.access_token
            });

            if (propsError) {
              console.error(`Error fetching properties for sub-category ${cat.id}:`, propsError);
            }
            count = properties ? (properties as any[]).length : 0;
          }

          return {
            ...cat,
            property_count: count
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubCategoryProperties(subCategoryId: string) {
    setLoadingProperties(true);
    try {
      const { data, error } = await (supabase
        .from('properties') as any)
        .select('id, name, city, status')
        .eq('sub_category_id', subCategoryId)
        .order('name');

      if (error) throw error;
      setSubCategoryProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  }

  function toggleCategory(categoryId: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }

  function handleSubCategoryClick(subCategoryId: string) {
    if (selectedSubCategory === subCategoryId) {
      setSelectedSubCategory(null);
      setSubCategoryProperties([]);
    } else {
      setSelectedSubCategory(subCategoryId);
      fetchSubCategoryProperties(subCategoryId);
    }
  }

  async function handleAdd() {
    const isMainCategory = showAddMainCategoryForm;

    if (!formData.name) {
      alert('Please fill in category name');
      return;
    }

    if (!uploadedImage) {
      alert('Please upload a category image');
      return;
    }

    // For main categories, ensure prefix was generated
    if (isMainCategory && !generatedPrefix) {
      alert('Please wait for the prefix to be generated');
      return;
    }

    try {
      setUploading(true);

      const imageUrl = await uploadImageToS3(uploadedImage, 'categories');

      if (!imageUrl.startsWith('http')) {
        throw new Error('Invalid image URL returned from S3 upload: ' + imageUrl);
      }

      // Get admin session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('No active session. Please log in again.');
        setUploading(false);
        return;
      }

      // Prepare data based on category type
      const categoryData: any = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image: imageUrl,
        display_order: formData.display_order,
        is_active: true,
        is_top: isMainCategory,
        parent_id: isMainCategory ? null : formData.parent_id,
      };

      // Add prefix for main categories
      if (isMainCategory) {
        categoryData.prefix = generatedPrefix;
      }

      // Use REST API directly with admin auth token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/categories`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Close the appropriate form
      if (isMainCategory) {
        setShowAddMainCategoryForm(false);
      } else {
        setShowAddForm(false);
      }

      // Reset form data
      setFormData({ name: '', slug: '', description: '', image: '', display_order: 1, is_top: false, parent_id: null });
      setUploadedImage(null);
      setImagePreview('');
      setGeneratedPrefix('');
      fetchCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert('Error adding category: ' + error.message);
    } finally {
      setUploading(false);
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
      is_top: category.is_top,
      parent_id: category.parent_id,
    });
    setImagePreview(category.image);
    setUploadedImage(null);
    setShowEditForm(true);
  }

  async function handleUpdate() {
    if (!editingCategory || !formData.name) {
      alert('Please fill in category name');
      return;
    }

    try {
      setUploading(true);

      let imageUrl = formData.image;

      if (uploadedImage) {
        imageUrl = await uploadImageToS3(uploadedImage, 'categories');
      }

      // Get admin session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('No active session. Please log in again.');
        setUploading(false);
        return;
      }

      // Use REST API directly for update with admin auth token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const updateData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image: imageUrl,
        display_order: formData.display_order,
        is_top: formData.is_top,
        parent_id: formData.parent_id,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/categories?id=eq.${editingCategory.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // If parent_id changed for a sub-category, update all properties with this sub_category_id
      if (editingCategory.parent_id && formData.parent_id && editingCategory.parent_id !== formData.parent_id) {
        const propertiesResponse = await fetch(
          `${supabaseUrl}/rest/v1/properties?sub_category_id=eq.${editingCategory.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category_id: formData.parent_id,
            }),
          }
        );

        if (!propertiesResponse.ok) {
          const errorText = await propertiesResponse.text();
          console.error('Error updating properties:', errorText);
          alert('Category updated but failed to update associated properties. Some properties may need manual reassignment.');
        }
      }

      setShowEditForm(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', image: '', display_order: 1, is_top: false, parent_id: null });
      setUploadedImage(null);
      setImagePreview('');
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert('Error updating category: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, propertyCount: number, categoryName: string) {
    if (propertyCount > 0) {
      alert(
        `Cannot delete "${categoryName}"!\n\n` +
        `This category has ${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'} associated with it.\n\n` +
        `Please reassign these properties first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    setDeletingCategoryId(id);
    setDeleteProgress('Deleting category...');

    try {
      // Get admin session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('No active session. Please log in again.');
        setDeletingCategoryId(null);
        setDeleteProgress('');
        return;
      }

      // Use REST API directly with admin auth token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/categories?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      setDeleteProgress('✓ Category deleted successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert('Error deleting category: ' + error.message);
    } finally {
      setDeletingCategoryId(null);
      setDeleteProgress('');
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await (supabase
        .from('categories') as any)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
    } catch (error: any) {
      alert('Error updating category: ' + error.message);
    }
  }

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const getSubCategories = (parentId: string) => categories.filter(cat => cat.parent_id === parentId);

  if (loading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => {
            const nextOrder = categories.length > 0
              ? Math.max(...categories.map(c => c.display_order)) + 1
              : 1;

            setFormData({
              name: '',
              slug: '',
              description: '',
              image: '',
              display_order: nextOrder,
              is_top: true,
              parent_id: null,
            });
            setEditingCategory(null);
            setUploadedImage(null);
            setImagePreview('');
            setGeneratedPrefix('');
            setShowAddMainCategoryForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Main Category
          </Button>
          <Button onClick={() => {
            const nextOrder = categories.length > 0
              ? Math.max(...categories.map(c => c.display_order)) + 1
              : 1;

            setFormData({
              name: '',
              slug: '',
              description: '',
              image: '',
              display_order: nextOrder,
              is_top: false,
              parent_id: null,
            });
            setEditingCategory(null);
            setUploadedImage(null);
            setImagePreview('');
            setShowAddForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Category
          </Button>
        </div>
      </div>

      {/* ADD FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Sub-Category</h2>
              <button onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', slug: '', description: '', image: '', display_order: 1, is_top: false, parent_id: null });
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Parent Category *</label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a main category</option>
                  {mainCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sub-Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Modern Homes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug (Auto-generated)</label>
                <Input
                  value={formData.slug}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category Image *</label>
                {!imagePreview ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleImageDrop}
                    onClick={() => document.getElementById('imageUpload')?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or WebP (recommended: 400x300px)</p>
                    </div>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description..."
                  rows={3}
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
              <Button onClick={handleAdd} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save Sub-Category'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', slug: '', description: '', image: '', display_order: 1, is_top: false, parent_id: null });
                setUploadedImage(null);
                setImagePreview('');
              }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MAIN CATEGORY FORM MODAL */}
      {showAddMainCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Main Category</h2>
              <button onClick={() => {
                setShowAddMainCategoryForm(false);
                setFormData({
                  name: '',
                  slug: '',
                  parent_id: null,
                  description: '',
                  image: '',
                  display_order: 0,
                  is_top: false,
                });
                setImagePreview('');
                setGeneratedPrefix('');
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Agriculture, Healthcare, Education"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug (Auto-generated)</label>
                <Input
                  value={formData.slug}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prefix (Auto-generated)</label>
                <div className="relative">
                  <Input
                    value={generatedPrefix || ''}
                    readOnly
                    className="bg-gray-100 pr-10"
                    placeholder="Will auto-generate..."
                  />
                  {prefixLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This 3-letter prefix will be used for property naming (e.g., {generatedPrefix || 'XXX'}-0001)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0 && files[0].type.startsWith('image/')) {
                      setUploading(true);
                      const url = await uploadImageToS3(files[0]);
                      setImagePreview(url);
                      setUploading(false);
                    }
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : imagePreview ? (
                    <div className="flex flex-col items-center">
                      <img src={imagePreview} alt="Preview" className="max-h-32 mb-2 rounded" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag & drop an image here, or{' '}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploading(true);
                                const url = await uploadImageToS3(file);
                                setImagePreview(url);
                                setUploading(false);
                              }
                            }}
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleAdd} className="flex-1">
                Add Main Category
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddMainCategoryForm(false);
                setFormData({
                  name: '',
                  slug: '',
                  parent_id: null,
                  description: '',
                  image: '',
                  display_order: 0,
                  is_top: false,
                });
                setImagePreview('');
                setGeneratedPrefix('');
              }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FORM MODAL - Similar structure, omitted for brevity */}
      {showEditForm && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit {editingCategory.parent_id ? 'Sub-Category' : 'Main Category'}</h2>
              <button onClick={() => {
                setShowEditForm(false);
                setEditingCategory(null);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Locked Prefix Warning */}
            {!editingCategory.parent_id && editingCategory.prefix && ['RES', 'COM', 'IND'].includes(editingCategory.prefix) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Protected Category</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This is a system category with a locked prefix ({editingCategory.prefix}).
                      The name cannot be changed to preserve property naming integrity.
                      You can still update the image, description, and display order.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {editingCategory.parent_id && (
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Category</label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {mainCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!!(!editingCategory.parent_id && editingCategory.prefix && ['RES', 'COM', 'IND'].includes(editingCategory.prefix))}
                  className={!editingCategory.parent_id && editingCategory.prefix && ['RES', 'COM', 'IND'].includes(editingCategory.prefix) ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
                {!editingCategory.parent_id && editingCategory.prefix && ['RES', 'COM', 'IND'].includes(editingCategory.prefix) && (
                  <p className="text-xs text-gray-500 mt-1">Name is locked for system categories</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug (Auto-generated)</label>
                <Input
                  value={formData.slug}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <div className="space-y-2">
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div
                    onClick={() => document.getElementById('imageUploadEdit')?.click()}
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
                  >
                    <p className="text-sm text-gray-600">Click to upload new image</p>
                    <input
                      id="imageUploadEdit"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleUpdate} disabled={uploading}>
                {uploading ? 'Updating...' : 'Update'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowEditForm(false);
                setEditingCategory(null);
              }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchical Category View */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Categories ({mainCategories.length} main categories)</h2>
          <div className="space-y-2">
            {mainCategories.map((mainCat) => {
              const subCats = getSubCategories(mainCat.id);
              const isExpanded = expandedCategories.has(mainCat.id);

              return (
                <div key={mainCat.id} className="border rounded-lg">
                  {/* Main Category */}
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleCategory(mainCat.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <img
                        src={mainCat.image}
                        alt={mainCat.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{mainCat.name}</h3>
                        <p className="text-sm text-gray-500">
                          {subCats.length} sub-categories • {mainCat.property_count} total properties
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(mainCat.id, mainCat.is_active)}
                        className={`px-3 py-1 rounded-full text-xs ${
                          mainCat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {mainCat.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(mainCat)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Sub-Categories */}
                  {isExpanded && (
                    <div className="border-t">
                      {subCats.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 italic">
                          No sub-categories yet
                        </div>
                      ) : (
                        <div className="divide-y">
                          {subCats.map((subCat) => (
                            <div key={subCat.id}>
                              <div className="flex items-center justify-between p-4 pl-16 hover:bg-gray-50">
                                <div className="flex items-center gap-3 flex-1">
                                  <img
                                    src={subCat.image}
                                    alt={subCat.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <button
                                      onClick={() => handleSubCategoryClick(subCat.id)}
                                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {subCat.name}
                                    </button>
                                    <p className="text-sm text-gray-500">
                                      {subCat.property_count} properties
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleActive(subCat.id, subCat.is_active)}
                                    className={`px-3 py-1 rounded-full text-xs ${
                                      subCat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {subCat.is_active ? 'Active' : 'Inactive'}
                                  </button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditClick(subCat)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(subCat.id, subCat.property_count, subCat.name)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Properties for selected sub-category */}
                              {selectedSubCategory === subCat.id && (
                                <div className="bg-blue-50 p-4 pl-16 ml-16">
                                  <h4 className="font-medium mb-2">Properties in {subCat.name}:</h4>
                                  {loadingProperties ? (
                                    <p className="text-sm text-gray-500">Loading...</p>
                                  ) : subCategoryProperties.length === 0 ? (
                                    <p className="text-sm text-gray-500">No properties in this sub-category</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {subCategoryProperties.map((prop) => (
                                        <div key={prop.id} className="flex items-center justify-between bg-white p-2 rounded">
                                          <div>
                                            <button
                                              onClick={() => router.push(`/admin/properties/${prop.id}/edit`)}
                                              className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                              {prop.name}
                                            </button>
                                            <span className="text-xs text-gray-500 ml-2">• {prop.city}</span>
                                          </div>
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            prop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {prop.status}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deletion Progress Modal */}
      {deletingCategoryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Deleting Category</h3>
              <p className="text-sm text-gray-600">{deleteProgress}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
