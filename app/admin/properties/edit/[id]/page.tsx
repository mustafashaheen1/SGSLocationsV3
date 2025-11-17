'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, Tag, ChevronDown, Camera, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadMultipleImages } from '@/lib/s3-upload';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FilterTag {
  id: string;
  filter_id: string;
  filter_name: string;
  name: string;
  slug: string;
}

interface ImageWithTags {
  url: string;
  file?: File;
  tags: string[];
  isSmugmug: boolean;
  existingId?: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());

  // SmugMug Import
  const [smugmugUrl, setSmugmugUrl] = useState('');
  const [importingFromSmugmug, setImportingFromSmugmug] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchProperty();
  }, [params.id]);

  async function fetchProperty() {
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setFormData({
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        county: property.county || '',
        zipcode: property.zipcode || '',
        property_type: property.property_type || 'Residential',
        square_footage: property.square_footage?.toString() || '',
        lot_size: property.lot_size?.toString() || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        parking_spaces: property.parking_spaces?.toString() || '',
        year_built: property.year_built?.toString() || '',
        daily_rate: property.daily_rate?.toString() || '',
        permits_available: property.permits_available || false,
        permit_details: property.permit_details || '',
        is_featured: property.is_featured || false,
        is_exclusive: property.is_exclusive || false,
        status: property.status || 'active',
      });

      // Set selected category
      if (property.categories && property.categories.length > 0) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('name', property.categories[0])
          .single();

        if (categoryData) {
          setSelectedCategory(categoryData);
        }
      }

      // Load existing images with tags from property_images table
      const { data: propertyImages, error: imagesError } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', params.id)
        .order('display_order');

      if (!imagesError && propertyImages && propertyImages.length > 0) {
        const loadedImages: ImageWithTags[] = propertyImages.map(img => ({
          url: img.image_url,
          tags: img.tags || [],
          isSmugmug: false,
          existingId: img.id,
        }));
        setImages(loadedImages);
      } else if (property.images && property.images.length > 0) {
        // Fallback: if no property_images records, use images array
        const fallbackImages: ImageWithTags[] = property.images.map((url: string) => ({
          url,
          tags: [],
          isSmugmug: false,
        }));
        setImages(fallbackImages);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching property:', error);
      alert('Error loading property: ' + error.message);
      router.push('/admin/properties');
    }
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (data) setCategories(data);
  }

  async function fetchTags() {
    try {
      const { data: filters } = await supabase
        .from('search_filters')
        .select(`
          id,
          name,
          search_filter_tags (
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('display_order');

      if (filters) {
        const allTags: FilterTag[] = [];
        filters.forEach(filter => {
          const tags = filter.search_filter_tags as any[];
          tags?.forEach(tag => {
            allTags.push({
              id: tag.id,
              filter_id: filter.id,
              filter_name: filter.name,
              name: tag.name,
              slug: tag.slug,
            });
          });
        });
        setAvailableTags(allTags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages: ImageWithTags[] = files.map(file => ({
        url: URL.createObjectURL(file),
        file,
        tags: [],
        isSmugmug: false,
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImageIndex === index) {
      setSelectedImageIndex(null);
    } else if (selectedImageIndex !== null && selectedImageIndex > index) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }

  function toggleImageTag(imageIndex: number, tagName: string) {
    setImages(prev => prev.map((img, i) => {
      if (i === imageIndex) {
        const tags = img.tags.includes(tagName)
          ? img.tags.filter(t => t !== tagName)
          : [...img.tags, tagName];
        return { ...img, tags };
      }
      return img;
    }));
  }

  function toggleFilterExpanded(filterName: string) {
    setExpandedFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterName)) {
        newSet.delete(filterName);
      } else {
        newSet.add(filterName);
      }
      return newSet;
    });
  }

  async function handleSmugmugImport() {
    if (!smugmugUrl.trim()) {
      alert('Please enter a SmugMug album URL or key');
      return;
    }

    setImportingFromSmugmug(true);
    setImportProgress('🔍 Extracting album key...');

    try {
      const albumKeyMatch = smugmugUrl.match(/\/([A-Za-z0-9]+)$/);
      let albumKey = albumKeyMatch ? albumKeyMatch[1] : smugmugUrl.trim();

      if (!albumKey) {
        throw new Error('Could not extract album key from URL');
      }

      setImportProgress(`📡 Importing from album: ${albumKey}...`);

      const response = await fetch('/api/import-smugmug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsReauth) {
          alert('⚠️ SmugMug authorization expired. Please reauthorize.');
          window.open('/api/smugmug/request-token', '_blank');
          return;
        }
        throw new Error(data.error || 'Import failed');
      }

      if (!data.images || data.images.length === 0) {
        throw new Error('No images found in album');
      }

      const smugmugImages: ImageWithTags[] = data.images.map((url: string) => ({
        url,
        tags: [],
        isSmugmug: true,
      }));

      setImages(prev => [...prev, ...smugmugImages]);
      setImportProgress(`✓ Successfully imported ${data.images.length} images!`);
      setSmugmugUrl('');

      setTimeout(() => {
        setImportingFromSmugmug(false);
        setImportProgress('');
      }, 2000);
    } catch (error: any) {
      console.error('SmugMug import error:', error);
      setImportProgress(`❌ Error: ${error.message}`);
      setTimeout(() => {
        setImportingFromSmugmug(false);
        setImportProgress('');
      }, 3000);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (images.length < 10) {
      alert('Please ensure you have at least 10 images');
      return;
    }

    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setSaving(true);

    try {
      // Upload new images to S3
      const filesToUpload = images
        .filter(img => img.file && !img.isSmugmug)
        .map(img => img.file!);

      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        console.log(`Uploading ${filesToUpload.length} new images...`);
        uploadedUrls = await uploadMultipleImages(filesToUpload, 'properties');
        console.log('New images uploaded successfully');
      }

      // Build final image URL list
      let uploadIndex = 0;
      const allImageUrls = images.map(img => {
        if (img.isSmugmug || !img.file) {
          return img.url;
        } else {
          return uploadedUrls[uploadIndex++];
        }
      });

      // Update property in database
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          description: formData.description || null,
          address: formData.address,
          city: formData.city,
          county: formData.county,
          zipcode: formData.zipcode || null,
          property_type: formData.property_type,
          square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
          lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
          year_built: formData.year_built ? parseInt(formData.year_built) : null,
          daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : 0,
          permits_available: formData.permits_available,
          permit_details: formData.permit_details || null,
          categories: [selectedCategory.name],
          images: allImageUrls,
          primary_image: allImageUrls[0],
          is_featured: formData.is_featured,
          is_exclusive: formData.is_exclusive,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (propertyError) throw propertyError;

      // Delete all existing property_images records for this property
      const { error: deleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('property_id', params.id);

      if (deleteError) console.error('Error deleting old image records:', deleteError);

      // Insert new property_images records with tags
      uploadIndex = 0;
      const imageRecords = images.map((img, index) => {
        let finalUrl: string;
        if (img.isSmugmug || !img.file) {
          finalUrl = img.url;
        } else {
          finalUrl = uploadedUrls[uploadIndex++];
        }

        return {
          property_id: params.id,
          image_url: finalUrl,
          display_order: index,
          tags: img.tags,
        };
      });

      const { error: imagesError } = await supabase
        .from('property_images')
        .insert(imageRecords);

      if (imagesError) {
        console.error('Error saving image metadata:', imagesError);
      }

      alert('Property updated successfully!');
      router.push('/admin/properties');
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert('Error updating property: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const tagsByFilter = availableTags.reduce((acc, tag) => {
    if (!acc[tag.filter_name]) {
      acc[tag.filter_name] = [];
    }
    acc[tag.filter_name].push(tag);
    return acc;
  }, {} as Record<string, FilterTag[]>);

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
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Property Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address *</label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City *</label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">County *</label>
            <Input
              name="county"
              value={formData.county}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Zip Code</label>
            <Input
              name="zipcode"
              value={formData.zipcode}
              onChange={handleInputChange}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Category *</label>
            <div className="grid grid-cols-4 gap-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory?.id === category.id
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-2">Square Footage</label>
            <Input
              name="square_footage"
              value={formData.square_footage}
              onChange={handleInputChange}
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lot Size (acres)</label>
            <Input
              name="lot_size"
              value={formData.lot_size}
              onChange={handleInputChange}
              type="number"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Year Built</label>
            <Input
              name="year_built"
              value={formData.year_built}
              onChange={handleInputChange}
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bedrooms</label>
            <Input
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleInputChange}
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bathrooms</label>
            <Input
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleInputChange}
              type="number"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Parking Spaces</label>
            <Input
              name="parking_spaces"
              value={formData.parking_spaces}
              onChange={handleInputChange}
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Daily Rate ($)</label>
            <Input
              name="daily_rate"
              value={formData.daily_rate}
              onChange={handleInputChange}
              type="number"
              step="0.01"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="permits_available"
                checked={formData.permits_available}
                onChange={handleInputChange}
                className="rounded"
              />
              <span className="text-sm font-medium">Film Permits Available</span>
            </label>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Permit Details</label>
            <Textarea
              name="permit_details"
              value={formData.permit_details}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="col-span-2 flex gap-4">
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
              <span className="text-sm font-medium">Exclusive Property</span>
            </label>
          </div>

          {/* SMUGMUG IMPORT SECTION */}
          <div className="col-span-2">
            <div className="mb-8 p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Import from SmugMug
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Paste SmugMug album URL or album key (e.g., 2nwmNf)"
                    value={smugmugUrl}
                    onChange={(e) => setSmugmugUrl(e.target.value)}
                    disabled={importingFromSmugmug}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSmugmugImport}
                    disabled={importingFromSmugmug || !smugmugUrl.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {importingFromSmugmug ? 'Importing...' : 'Import'}
                  </Button>
                </div>
                {importProgress && (
                  <p className={`text-sm ${
                    importProgress.includes('❌') ? 'text-red-600' :
                    importProgress.includes('✓') ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {importProgress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* IMAGES & TAGGING SECTION */}
          <div className="col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <label className="block text-sm font-medium">Property Images * (Min 10 images)</label>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('imageUpload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
              <input
                id="imageUpload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {images.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-5 gap-4">
                  {/* LEFT: Image Grid */}
                  <div className="col-span-3">
                    <div className="grid grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative group cursor-pointer rounded border-2 overflow-hidden transition-all ${
                            selectedImageIndex === index
                              ? 'border-red-500 ring-2 ring-red-200'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="aspect-square bg-gray-100">
                            <img
                              src={img.url}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                            <div className="flex items-center gap-1 text-white text-xs">
                              <Tag className="w-3 h-3" />
                              <span className="font-medium">{img.tags.length} tags</span>
                            </div>
                          </div>
                          {selectedImageIndex === index && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 pointer-events-none" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: Tag Assignment Panel */}
                  <div className="col-span-2 bg-gray-50 rounded-lg p-4 border">
                    {selectedImageIndex === null ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Tag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Click an image to assign tags</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="font-semibold">
                            Assign Tags to Image {selectedImageIndex + 1}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {images[selectedImageIndex].tags.length} tags selected
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedImageIndex(null)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Image Preview */}
                          <div>
                            <img
                              src={images[selectedImageIndex].url}
                              alt="Selected"
                              className="w-full rounded-lg"
                            />
                            {images[selectedImageIndex].tags.length > 0 && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <p className="text-xs font-medium text-gray-700 mb-1">Selected Tags:</p>
                                <div className="flex flex-wrap gap-1">
                                  {images[selectedImageIndex].tags.map(tag => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs"
                                    >
                                      {tag}
                                      <button
                                        type="button"
                                        onClick={() => toggleImageTag(selectedImageIndex, tag)}
                                        className="hover:text-red-900"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Tag Selection */}
                          <div className="max-h-[400px] overflow-y-auto">
                            {Object.entries(tagsByFilter).map(([filterName, tags]) => {
                              const isExpanded = expandedFilters.has(filterName);
                              return (
                                <div key={filterName} className="mb-2 border rounded">
                                  <button
                                    type="button"
                                    onClick={() => toggleFilterExpanded(filterName)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
                                  >
                                    <h5 className="text-sm font-semibold flex items-center gap-2">
                                      <ChevronDown
                                        className={`w-4 h-4 transition-transform ${
                                          isExpanded ? 'rotate-0' : '-rotate-90'
                                        }`}
                                      />
                                      {filterName}
                                    </h5>
                                    <span className="text-xs text-gray-500">
                                      {images[selectedImageIndex].tags.filter(tag =>
                                        tags.some(t => t.name === tag)
                                      ).length} / {tags.length}
                                    </span>
                                  </button>

                                  {isExpanded && (
                                    <div className="space-y-1 px-3 pb-3 pl-8">
                                      {tags.map(tag => (
                                        <label
                                          key={tag.id}
                                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={images[selectedImageIndex].tags.includes(tag.name)}
                                            onChange={() => toggleImageTag(selectedImageIndex, tag.name)}
                                            className="rounded text-red-600 focus:ring-red-500"
                                          />
                                          <span className="text-sm">{tag.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={saving || images.length < 10}
            className="bg-[#e11921] hover:bg-red-700"
          >
            {saving ? 'Saving...' : 'Update Property'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {images.length < 10 && (
          <p className="text-sm text-red-600">
            * Please ensure you have at least 10 images before updating
          </p>
        )}
      </form>
    </div>
  );
}
