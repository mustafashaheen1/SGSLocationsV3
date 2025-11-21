'use client';

declare global {
  interface Window {
    google: any;
  }
}

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, Tag, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadMultipleImages } from '@/lib/s3-upload';

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
  existingId?: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: 'Texas',
    zipcode: '',
    category_id: '',
    is_featured: false,
    is_exclusive: false,
  });

  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, status: '' });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [propertyTags, setPropertyTags] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchSearchFilterTags();
    fetchProperty();
  }, [params.id]);

  useEffect(() => {
    if (!googleMapsLoaded || !addressInputRef.current) {
      return;
    }

    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('⏳ Waiting for Google Places library...');
        setTimeout(initAutocomplete, 100);
        return;
      }

      console.log('🔧 Initializing Google Places Autocomplete...');

      try {
        const autocomplete = new window.google.maps.places.Autocomplete(
          addressInputRef.current!,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: ['address_components', 'formatted_address', 'geometry']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          console.log('📍 Place selected:', place);

          if (!place.geometry || !place.address_components) {
            console.log('⚠️ No details available for input');
            return;
          }

          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let zipCode = '';

          place.address_components.forEach((component: any) => {
            const types = component.types;

            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              route = component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (types.includes('postal_code')) {
              zipCode = component.long_name;
            }
          });

          const fullAddress = `${streetNumber} ${route}`.trim();

          console.log('✅ Parsed address:', { fullAddress, city, state, zipCode });

          setFormData(prev => ({
            ...prev,
            address: fullAddress,
            city: city,
            state: state || 'Texas',
            zipcode: zipCode
          }));
        });

        console.log('✅ Autocomplete initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing autocomplete:', error);
      }
    };

    initAutocomplete();
  }, [googleMapsLoaded]);

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
        state: property.county || 'Texas',
        zipcode: property.zipcode || '',
        category_id: '',
        is_featured: property.is_featured || false,
        is_exclusive: property.is_exclusive || false,
      });

      // Get category ID from category name
      if (property.categories && property.categories.length > 0) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('name', property.categories[0])
          .single();

        if (categoryData) {
          setFormData(prev => ({ ...prev, category_id: categoryData.id }));
        }
      }

      // Load property-level tags
      setPropertyTags(property.property_tags || []);

      // Load existing images with tags
      const { data: propertyImages, error: imagesError } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', params.id)
        .order('display_order');

      if (!imagesError && propertyImages && propertyImages.length > 0) {
        const loadedImages: ImageWithTags[] = propertyImages.map(img => ({
          url: img.image_url,
          tags: img.tags || [],
          existingId: img.id,
        }));
        setImages(loadedImages);
      } else if (property.images && property.images.length > 0) {
        const fallbackImages: ImageWithTags[] = property.images.map((url: string) => ({
          url,
          tags: [],
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

  async function fetchSearchFilterTags() {
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

  // Sync photo tags to property tags
  function syncPhotoTagsToProperty(images: ImageWithTags[]) {
    // Collect all unique tags from all images
    const allPhotoTags = new Set<string>();

    images.forEach(image => {
      image.tags.forEach(tag => {
        allPhotoTags.add(tag);
      });
    });

    // Add these tags to property tags (avoiding duplicates)
    setPropertyTags(prev => {
      const combined = new Set([...prev, ...Array.from(allPhotoTags)]);
      return Array.from(combined);
    });

    console.log(`🔄 Synced ${allPhotoTags.size} unique tags from photos to property`);
  }

  async function analyzeImageAndTag(imageUrl: string, imageIndex: number, totalImages: number) {
    try {
      setAnalysisProgress({
        current: imageIndex + 1,
        total: totalImages,
        status: `Analyzing image ${imageIndex + 1} of ${totalImages}...`
      });

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          availableTags: availableTags
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      console.log(`✅ Image ${imageIndex + 1} analyzed:`, data.tags);

      return data.tags || [];
    } catch (error) {
      console.error(`❌ Error analyzing image ${imageIndex + 1}:`, error);
      return [];
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAnalyzingImages(true);
    setUploadProgress({ current: 0, total: files.length });
    setAnalysisProgress({ current: 0, total: files.length, status: 'Starting...' });

    const newImages: ImageWithTags[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        setAnalysisProgress({ current: 0, total: files.length, status: `Uploading image ${i + 1} of ${files.length}...` });

        const imageUrl = await uploadMultipleImages([file], 'properties');

        newImages.push({
          url: imageUrl[0],
          file,
          tags: []
        });
      }

      setAnalysisProgress({ current: 0, total: files.length, status: 'Starting AI analysis...' });

      for (let i = 0; i < newImages.length; i++) {
        const suggestedTags = await analyzeImageAndTag(newImages[i].url, i, files.length);
        newImages[i].tags = suggestedTags;
      }

      setImages(prev => {
        const updated = [...prev, ...newImages];
        // Auto-sync photo tags to property tags
        setTimeout(() => syncPhotoTagsToProperty(updated), 0);
        return updated;
      });

      setAnalysisProgress({ current: files.length, total: files.length, status: 'Complete!' });

      setTimeout(() => {
        setAnalyzingImages(false);
        setUploadProgress({ current: 0, total: 0 });
        setAnalysisProgress({ current: 0, total: 0, status: '' });
      }, 2000);

    } catch (error: any) {
      console.error('Error processing images:', error);
      alert('Error processing images: ' + error.message);
      setAnalyzingImages(false);
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
    setImages(prev => {
      const updated = prev.map((img, i) => {
        if (i === imageIndex) {
          const isRemoving = img.tags.includes(tagName);
          const tags = isRemoving
            ? img.tags.filter(t => t !== tagName)
            : [...img.tags, tagName];
          return { ...img, tags };
        }
        return img;
      });

      // Auto-sync photo tags to property tags after update
      setTimeout(() => syncPhotoTagsToProperty(updated), 0);

      return updated;
    });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Temporarily disabled: 10 photo minimum for admin
    // if (images.length < 10) {
    //   alert('Please ensure you have at least 10 images');
    //   return;
    // }

    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }

    setSaving(true);

    try {
      const filesToUpload = images.filter(img => img.file).map(img => img.file!);

      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        console.log(`Uploading ${filesToUpload.length} new images...`);
        uploadedUrls = await uploadMultipleImages(filesToUpload, 'properties');
        console.log('New images uploaded successfully');
      }

      let uploadIndex = 0;
      const allImageUrls = images.map(img => {
        if (img.file) {
          return uploadedUrls[uploadIndex++];
        } else {
          return img.url;
        }
      });

      // Get category name from ID
      const selectedCategory = categories.find(c => c.id === formData.category_id);

      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          description: formData.description || null,
          address: formData.address,
          city: formData.city,
          county: formData.state,
          zipcode: formData.zipcode || null,
          categories: selectedCategory ? [selectedCategory.name] : [],
          images: allImageUrls,
          primary_image: allImageUrls[0],
          is_featured: formData.is_featured,
          is_exclusive: formData.is_exclusive,
          property_tags: propertyTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (propertyError) throw propertyError;

      const { error: deleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('property_id', params.id);

      if (deleteError) console.error('Error deleting old image records:', deleteError);

      uploadIndex = 0;
      const imageRecords = images.map((img, index) => {
        let finalUrl: string;
        if (img.file) {
          finalUrl = uploadedUrls[uploadIndex++];
        } else {
          finalUrl = img.url;
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
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ Google Maps script loaded');
          setGoogleMapsLoaded(true);
        }}
        onError={(e) => {
          console.error('❌ Error loading Google Maps script:', e);
        }}
      />

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
              placeholder="e.g., Modern Downtown Loft"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed property description..."
              rows={4}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address *</label>
            <input
              ref={addressInputRef}
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Start typing address..."
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#e11921] focus:border-[#e11921]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Start typing and select from the dropdown suggestions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City *</label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Dallas"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">State *</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#e11921] focus:border-[#e11921]"
              required
            >
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ZIP Code</label>
            <Input
              name="zipcode"
              value={formData.zipcode}
              onChange={handleInputChange}
              placeholder="75201"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#e11921] focus:border-[#e11921]"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#e11921] border-gray-300 rounded focus:ring-[#e11921]"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Featured Property</span>
                  <span className="text-xs text-gray-600">Display prominently on homepage</span>
                </div>
              </label>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_exclusive"
                  checked={formData.is_exclusive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#e11921] border-gray-300 rounded focus:ring-[#e11921]"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Exclusive Property</span>
                  <span className="text-xs text-gray-600">Mark as exclusive listing</span>
                </div>
              </label>
            </div>
          </div>

          {/* PROPERTY-LEVEL TAGS SECTION */}
          <div className="col-span-2 border-t pt-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Property Search Filter Tags
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tags from individual photos are automatically added here. You can also manually add/remove property-level tags.
                  </p>
                  {propertyTags.length > 0 && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-3">
                        ✨ Auto-synced from photo tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {propertyTags.map(tagName => {
                          const tag = availableTags.find(t => t.name === tagName);
                          return (
                            <span
                              key={tagName}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full"
                            >
                              {tag?.filter_name && (
                                <span className="opacity-75 text-xs">{tag.filter_name}:</span>
                              )}
                              <span className="font-medium">{tagName}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {propertyTags.length > 0 && (
                  <span className="px-3 py-1 bg-[#e11921] text-white text-sm font-medium rounded-full">
                    {propertyTags.length} selected
                  </span>
                )}
              </div>

              {propertyTags.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Selected Property Tags:</p>
                    <button
                      type="button"
                      onClick={() => setPropertyTags([])}
                      className="text-xs text-[#e11921] hover:text-red-700 font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {propertyTags.map(tagName => {
                      const tag = availableTags.find(t => t.name === tagName);
                      return (
                        <span
                          key={tagName}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e11921] text-white text-sm rounded-full"
                        >
                          {tag?.filter_name && (
                            <span className="opacity-75 text-xs">{tag.filter_name}:</span>
                          )}
                          <span className="font-medium">{tagName}</span>
                          <button
                            type="button"
                            onClick={() => setPropertyTags(prev => prev.filter(t => t !== tagName))}
                            className="hover:bg-red-700 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(tagsByFilter).map(([filterName, tags]) => {
                  const selectedInFilter = tags.filter(t => propertyTags.includes(t.name)).length;
                  return (
                    <div key={filterName} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleFilterExpanded(filterName)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedFilters.has(filterName) ? 'rotate-180' : ''
                            }`}
                          />
                          <span className="font-medium text-sm text-gray-900">{filterName}</span>
                          {selectedInFilter > 0 && (
                            <span className="px-2 py-0.5 bg-[#e11921] text-white text-xs font-medium rounded-full">
                              {selectedInFilter}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {tags.length} tags
                        </span>
                      </button>

                      {expandedFilters.has(filterName) && (
                        <div className="px-4 py-3 bg-gray-50 border-t">
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => {
                              const isSelected = propertyTags.includes(tag.name);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => {
                                    setPropertyTags(prev =>
                                      isSelected
                                        ? prev.filter(t => t !== tag.name)
                                        : [...prev, tag.name]
                                    );
                                  }}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                                    isSelected
                                      ? 'bg-[#e11921] text-white border-[#e11921] shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#e11921] hover:text-[#e11921]'
                                  }`}
                                >
                                  {tag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Property Images * (Minimum 10 images required)
            </label>

            <div className="mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {images.length} images uploaded
              </p>
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded Images: {images.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      setSelectedImageIndex(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-4">
                    <h4 className="font-semibold text-sm">
                      Click image to assign tags
                    </h4>
                    <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto p-2">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
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
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (img.url.includes('cloudfront.net') && !target.dataset.retried) {
                                  target.dataset.retried = 'true';
                                  const s3Url = img.url.replace(
                                    /https:\/\/.*\.cloudfront\.net/,
                                    'https://sgs-locations-images.s3.us-west-1.amazonaws.com'
                                  );
                                  target.src = s3Url;
                                } else {
                                  target.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+' + (index + 1);
                                }
                              }}
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
            disabled={saving}
            className="bg-[#e11921] hover:bg-red-700"
          >
            {saving ? 'Saving...' : 'Update Property'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* AI Analysis Progress Modal */}
      {analyzingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11921]"></div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Processing Images</h3>

              {uploadProgress.total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Uploading to S3</span>
                    <span>{uploadProgress.current}/{uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {analysisProgress.total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>AI Analysis</span>
                    <span>{analysisProgress.current}/{analysisProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#e11921] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 mt-4">
                {analysisProgress.status}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Using GPT-4o to automatically tag images...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
