'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadMultipleImages, deleteImageFromS3 } from '@/lib/s3-upload';

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    county: '',
    zipcode: '',
    property_type: 'Residential',
    square_footage: '',
    lot_size: '',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    year_built: '',
    daily_rate: '',
    permits_available: false,
    permit_details: '',
    is_featured: false,
    is_exclusive: false,
    status: 'active',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchProperty();
  }, [params.id]);

  async function fetchCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchProperty() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        county: data.county || '',
        zipcode: data.zipcode || '',
        property_type: data.property_type || 'Residential',
        square_footage: data.square_footage?.toString() || '',
        lot_size: data.lot_size?.toString() || '',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        parking_spaces: data.parking_spaces?.toString() || '',
        year_built: data.year_built?.toString() || '',
        daily_rate: data.daily_rate?.toString() || '',
        permits_available: data.permits_available || false,
        permit_details: data.permit_details || '',
        is_featured: data.is_featured || false,
        is_exclusive: data.is_exclusive || false,
        status: data.status || 'active',
      });

      setSelectedCategories(data.categories || []);
      setExistingImages(data.images || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching property:', error);
      alert('Error loading property: ' + error.message);
      router.push('/admin/properties');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleCategoryToggle(categoryName: string) {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  }

  function handleNewImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function removeExistingImage(imageUrl: string) {
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  }

  function removeNewImage(index: number) {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const totalImages = existingImages.length + newImages.length;
    if (totalImages < 10) {
      alert(`You need at least 10 images. Currently you have ${totalImages} images.`);
      return;
    }

    setSaving(true);

    try {
      // Delete removed images from S3
      for (const imageUrl of imagesToDelete) {
        try {
          await deleteImageFromS3(imageUrl);
          console.log(`✓ Deleted from S3: ${imageUrl}`);
        } catch (error) {
          console.error(`✗ Failed to delete: ${imageUrl}`, error);
        }
      }

      // Upload new images to S3
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = await uploadMultipleImages(newImages, 'properties');
        console.log(`✓ Uploaded ${uploadedUrls.length} new images`);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedUrls];

      // Update property in database
      const { error } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          county: formData.county,
          zipcode: formData.zipcode,
          property_type: formData.property_type,
          square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
          lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
          year_built: formData.year_built ? parseInt(formData.year_built) : null,
          daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : 0,
          permits_available: formData.permits_available,
          permit_details: formData.permit_details,
          categories: selectedCategories,
          images: allImages,
          primary_image: allImages[0],
          is_featured: formData.is_featured,
          is_exclusive: formData.is_exclusive,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      alert('Property updated successfully!');
      router.push('/admin/properties');
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert('Error updating property: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Property Name *</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
          />
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address *</label>
            <Input name="address" value={formData.address} onChange={handleInputChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">City *</label>
            <Input name="city" value={formData.city} onChange={handleInputChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">County</label>
            <Input name="county" value={formData.county} onChange={handleInputChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Zip Code</label>
            <Input name="zipcode" value={formData.zipcode} onChange={handleInputChange} />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Property Type *</label>
          <select
            name="property_type"
            value={formData.property_type}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Land">Land</option>
          </select>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Square Footage</label>
            <Input name="square_footage" value={formData.square_footage} onChange={handleInputChange} type="number" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Lot Size (acres)</label>
            <Input name="lot_size" value={formData.lot_size} onChange={handleInputChange} type="number" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Year Built</label>
            <Input name="year_built" value={formData.year_built} onChange={handleInputChange} type="number" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bedrooms</label>
            <Input name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} type="number" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bathrooms</label>
            <Input name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} type="number" step="0.5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Parking Spaces</label>
            <Input name="parking_spaces" value={formData.parking_spaces} onChange={handleInputChange} type="number" />
          </div>
        </div>

        {/* Daily Rate */}
        <div>
          <label className="block text-sm font-medium mb-2">Daily Rate ($) *</label>
          <Input name="daily_rate" value={formData.daily_rate} onChange={handleInputChange} type="number" step="0.01" required />
        </div>

        {/* Permits */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="permits_available"
              checked={formData.permits_available}
              onChange={handleInputChange}
              className="rounded"
            />
            <span className="text-sm font-medium">Permits Available</span>
          </label>
        </div>

        {formData.permits_available && (
          <div>
            <label className="block text-sm font-medium mb-2">Permit Details</label>
            <Textarea name="permit_details" value={formData.permit_details} onChange={handleInputChange} rows={3} />
          </div>
        )}

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium mb-2">Categories</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.name)}
                  onChange={() => handleCategoryToggle(cat.name)}
                  className="rounded"
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status & Featured */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="rounded"
              />
              <span className="text-sm font-medium">Featured Property</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_exclusive"
                checked={formData.is_exclusive}
                onChange={handleInputChange}
                className="rounded"
              />
              <span className="text-sm font-medium">Exclusive</span>
            </label>
          </div>
        </div>

        {/* Existing Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Current Images ({existingImages.length})
          </label>
          <div className="grid grid-cols-5 gap-4">
            {existingImages.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Add New Images ({newImages.length} selected)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleNewImageSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
          />
          {newImagePreviews.length > 0 && (
            <div className="grid grid-cols-5 gap-4 mt-4">
              {newImagePreviews.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img src={url} alt={`New ${index + 1}`} className="w-full h-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Images Count */}
        <div className="text-sm text-gray-600">
          Total Images: {existingImages.length + newImages.length}
          {(existingImages.length + newImages.length) < 10 && (
            <span className="text-red-600 ml-2">
              (Need {10 - (existingImages.length + newImages.length)} more)
            </span>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={saving || (existingImages.length + newImages.length) < 10}
            className="bg-[#e11921] hover:bg-red-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
