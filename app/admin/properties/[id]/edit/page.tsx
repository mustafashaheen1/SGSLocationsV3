'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages, deleteImageFromS3 } from '@/lib/s3-upload';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: 'Texas',
    county: '',
    zipcode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    category_id: '',
    is_featured: false,
    is_exclusive: false,
    status: 'pending',
    primary_image: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchProperty();
  }, [propertyId]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchProperty() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || 'Texas',
        county: data.county || '',
        zipcode: data.zipcode || '',
        latitude: data.latitude,
        longitude: data.longitude,
        category_id: data.category_id || '',
        is_featured: data.is_featured || false,
        is_exclusive: data.is_exclusive || false,
        status: data.status || 'pending',
        primary_image: data.primary_image || '',
      });

      setExistingImages(data.images || []);
    } catch (error: any) {
      console.error('Error fetching property:', error);
      alert('Error loading property: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };

  const setPrimaryImage = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, primary_image: imageUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload new images if any
      let uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        setUploadingImages(true);
        uploadedImageUrls = await uploadMultipleImages(newImages);
        setUploadingImages(false);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImageUrls];

      // Set primary image if not set
      let primaryImage = formData.primary_image;
      if (!primaryImage && allImages.length > 0) {
        primaryImage = allImages[0];
      }

      // Update property in database
      const { error } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          county: formData.county,
          zipcode: formData.zipcode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          category_id: formData.category_id || null,
          is_featured: formData.is_featured,
          is_exclusive: formData.is_exclusive,
          status: formData.status,
          images: allImages,
          primary_image: primaryImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId);

      if (error) throw error;

      // Delete marked images from S3
      for (const imageUrl of imagesToDelete) {
        try {
          await deleteImageFromS3(imageUrl);
        } catch (error) {
          console.error('Error deleting image from S3:', error);
        }
      }

      alert('Property updated successfully!');
      router.push('/admin/properties');
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert('Error updating property: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/properties')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Edit Property</h1>
            <p className="text-gray-600 mt-1">Update property information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Property Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter property name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Enter property description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">County</label>
                <Input
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  placeholder="Enter county"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Zipcode</label>
                <Input
                  value={formData.zipcode}
                  onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                  placeholder="Enter zipcode"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Images</h2>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Current Images</h3>
              <div className="grid grid-cols-4 gap-4">
                {existingImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-32 object-cover rounded border-2"
                      style={{
                        borderColor: formData.primary_image === imageUrl ? '#e11921' : 'transparent'
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(imageUrl)}
                        className="p-1 bg-white rounded shadow hover:bg-gray-100"
                        title="Set as primary"
                      >
                        ⭐
                      </button>
                      <button
                        type="button"
                        onClick={() => markImageForDeletion(imageUrl)}
                        className="p-1 bg-red-600 text-white rounded shadow hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {formData.primary_image === imageUrl && (
                      <div className="absolute bottom-2 left-2 bg-[#e11921] text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          {newImages.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">New Images to Upload</h3>
              <div className="grid grid-cols-4 gap-4">
                {newImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New image ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded shadow hover:bg-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                Click to upload additional images
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP (Max 5MB each)
              </span>
            </label>
          </div>
        </div>

        {/* Status & Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Status & Features</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="text-sm font-medium">
                Featured Property
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_exclusive"
                checked={formData.is_exclusive}
                onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="is_exclusive" className="text-sm font-medium">
                Exclusive Property
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/properties')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#e11921] hover:bg-[#bf151c]"
            disabled={saving || uploadingImages}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {uploadingImages ? 'Uploading Images...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
