declare global {
  interface Window {
    google: any;
  }
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, Upload, X, Camera, Tag, ChevronDown, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages, deleteImageFromS3 } from '@/lib/s3-upload';
import { GridPreview } from '@/components/admin/GridPreview';

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

interface ImageWithTags {
  url: string;
  file?: File;
  tags: string[];
  isSmugmug: boolean;
}

interface FilterTag {
  id: string;
  name: string;
  slug?: string;
  filter_id: string;
  filter_name: string;
  filter_slug?: string;
}

interface Contact {
  name: string;
  cell_number: string;
  home_number: string;
  office_number: string;
  email: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [gridIndices, setGridIndices] = useState<number[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, status: '' });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [propertyTags, setPropertyTags] = useState<string[]>([]);
  const [propertyCategoryName, setPropertyCategoryName] = useState<string>(''); // Store category name to match later
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: 'Texas',
    zipcode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    category_id: '',
    is_featured: false,
    is_exclusive: false,
  });

  const [contacts, setContacts] = useState<Contact[]>([
    { name: '', cell_number: '', home_number: '', office_number: '', email: '' },
    { name: '', cell_number: '', home_number: '', office_number: '', email: '' }
  ]);

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [propertyStats, setPropertyStats] = useState({
    views: 0,
    downloads: 0
  });

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchCategories(),
        fetchSearchFilterTags(),
        fetchProperty()
      ]);
    };

    initializePage();
  }, [propertyId]);

  // Auto-refresh session every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      console.log('🔄 [Property Edit] Auto-refreshing session...');
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ Session refresh failed:', error);
        clearInterval(refreshInterval);
        alert('Your session has expired. Please save your work and login again.');
      } else {
        console.log('✅ Session refreshed');
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Auto-update gridIndices when images change
  useEffect(() => {
    if (gridIndices.length === 0 && images.length > 0) {
      const initialIndices = images.slice(0, 6).map((_, i) => i);
      setGridIndices(initialIndices);
    } else if (images.length < gridIndices.length) {
      setGridIndices(prev => prev.filter(i => i < images.length));
    }
  }, [images.length]);

  // Match category name to ID once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && propertyCategoryName && !formData.category_id) {
      const matchedCategory = categories.find(cat => cat.name === propertyCategoryName);
      if (matchedCategory) {
        setFormData(prev => ({
          ...prev,
          category_id: matchedCategory.id
        }));
      }
    }
  }, [categories, propertyCategoryName]);

  // Auto-save notes with debounce
  useEffect(() => {
    // Don't auto-save if loading or if notes haven't been loaded yet
    if (loading) return;

    const timeoutId = setTimeout(async () => {
      // Only save if property exists and notes have changed
      if (propertyId && notes !== undefined) {
        setNotesSaving(true);
        setNotesSaved(false);

        try {
          const { error } = await supabase
            .from('properties')
            .update({ notes: notes })
            .eq('id', propertyId);

          if (error) {
            console.error('Error auto-saving notes:', error);
          } else {
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
          }
        } catch (error) {
          console.error('Error auto-saving notes:', error);
        } finally {
          setNotesSaving(false);
        }
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [notes, propertyId, loading]);

  async function fetchProperty() {
    setLoading(true);
    try {
      // Fetch property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;

      // Set form data
      setFormData({
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        state: property.county || 'Texas', // county field is used for state
        zipcode: property.zipcode || '',
        latitude: property.latitude,
        longitude: property.longitude,
        category_id: '', // Will be set by useEffect after categories load
        is_featured: property.is_featured || false,
        is_exclusive: property.is_exclusive || false,
      });

      setPropertyTags(property.property_tags || []);

      // Store category name to match with category ID after categories load
      if (property.categories?.[0]) {
        setPropertyCategoryName(property.categories[0]);
      }

      // Load contacts or set default
      if (property.contacts && property.contacts.length >= 2) {
        setContacts(property.contacts);
      } else {
        // Ensure at least 2 contacts
        setContacts([
          { name: '', cell_number: '', home_number: '', office_number: '', email: '' },
          { name: '', cell_number: '', home_number: '', office_number: '', email: '' }
        ]);
      }

      // Load notes
      setNotes(property.notes || '');

      // Fetch property stats
      const viewCount = property.view_count || 0;

      // Count image downloads for this property
      const { count: downloadsCount } = await supabase
        .from('image_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      setPropertyStats({
        views: viewCount,
        downloads: downloadsCount || 0
      });

      // Fetch property images with tags
      const { data: propertyImages, error: imagesError } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order');

      if (imagesError) throw imagesError;

      // Convert to ImageWithTags format
      const loadedImages: ImageWithTags[] = (propertyImages || []).map(img => ({
        url: img.image_url,
        tags: img.tags || [],
        isSmugmug: false
      }));

      setImages(loadedImages);

      // Set grid indices (first 6 images)
      const initialGrid = loadedImages.slice(0, 6).map((_, i) => i);
      setGridIndices(initialGrid);

    } catch (error: any) {
      console.error('Error fetching property:', error);
      alert('Error loading property: ' + error.message);
      router.push('/admin/properties');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  }

  async function fetchSearchFilterTags() {
    try {
      console.log('🔍 Fetching search filter tags...');

      const { data, error } = await supabase
        .from('search_filter_tags')
        .select(`
          id,
          name,
          slug,
          filter_id,
          search_filters!inner (
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error fetching tags:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No active tags found in database');
        setAvailableTags([]);
        return [];
      }

      console.log(`✅ Fetched ${data.length} tags from database`);

      const formattedTags = data.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug || '',
        filter_id: tag.filter_id,
        filter_name: tag.search_filters?.name || 'Unknown',
        filter_slug: tag.search_filters?.slug || 'unknown'
      }));

      setAvailableTags(formattedTags);
      setExpandedFilters(new Set<string>());

      return formattedTags;

    } catch (error) {
      console.error('Error fetching tags:', error);
      alert('Failed to load tags. Please refresh the page.');
      setAvailableTags([]);
      return [];
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

  function syncPhotoTagsToProperty(images: ImageWithTags[]) {
    const allPhotoTags = new Set<string>();

    console.log(`🔄 Syncing tags from ${images.length} images`);
    images.forEach((image, idx) => {
      console.log(`  Image ${idx + 1}: ${image.tags.length} tags - ${image.tags.join(', ')}`);
      image.tags.forEach(tag => {
        allPhotoTags.add(tag);
      });
    });

    setPropertyTags(prev => {
      const combined = new Set([...prev, ...Array.from(allPhotoTags)]);
      const result = Array.from(combined);
      console.log(`✓ Synced ${allPhotoTags.size} unique tags from photos to property`);
      console.log(`✓ Total property tags now: ${result.length}`);
      console.log(`✓ Property tags: ${result.join(', ')}`);
      return result;
    });
  }

  function initializeGoogleAutocomplete() {
    const addressInput = addressInputRef.current || document.querySelector('input[name="address"]') as HTMLInputElement;

    if (!addressInput) {
      console.log('⚠️ Address input not found');
      return;
    }

    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places) {
      console.log('⚠️ Google Maps not loaded yet, will retry...');
      setTimeout(() => initializeGoogleAutocomplete(), 500);
      return;
    }

    if (autocompleteRef.current) {
      console.log('🧹 Cleaning up existing autocomplete instance');
      try {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      } catch (e) {
        console.log('Could not clear listeners:', e);
      }
      autocompleteRef.current = null;
      addressInput.removeAttribute('data-autocomplete-initialized');
    }

    console.log('🔧 Initializing Google Autocomplete');

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInput, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.address_components) {
          console.log('No address components found');
          return;
        }

        console.log('✓ Address selected from autocomplete');

        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipcode = '';

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
            zipcode = component.long_name;
          }
        });

        const fullAddress = streetNumber && route
          ? `${streetNumber} ${route}`
          : route;

        const latitude = place.geometry?.location?.lat() || null;
        const longitude = place.geometry?.location?.lng() || null;

        if (latitude && longitude) {
          console.log('📍 Coordinates captured:', { latitude, longitude });
        }

        setFormData(prev => ({
          ...prev,
          address: fullAddress,
          city: city || prev.city,
          state: state || prev.state,
          zipcode: zipcode || prev.zipcode,
          latitude,
          longitude
        }));
      });

      autocompleteRef.current = autocomplete;
      addressInput.setAttribute('data-autocomplete-initialized', 'true');
      console.log('✅ Google Autocomplete initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }
  }

  async function analyzeImageAndTag(imageUrl: string, imageIndex: number, totalImages: number, tagsToUse?: FilterTag[]): Promise<string[]> {
    try {
      const tags = tagsToUse || availableTags;

      console.log(`\n🤖 Starting analysis for image ${imageIndex + 1}/${totalImages}`);
      console.log('  Image URL:', imageUrl.substring(0, 80) + '...');

      if (tags.length === 0) {
        console.warn('⚠️ No tags available for analysis');
        return [];
      }

      console.log(`  📊 Using ${tags.length} available tags for analysis`);

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
          availableTags: tags
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Analysis failed:`, errorData);
        return [];
      }

      const data = await response.json();
      console.log(`✅ Image ${imageIndex + 1} analyzed successfully`);
      console.log(`  Found ${data.tags?.length || 0} tags:`, data.tags || []);

      return data.tags || [];
    } catch (error) {
      console.error(`❌ Error analyzing image ${imageIndex + 1}:`, error);
      return [];
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let tagsToUse = availableTags;
    if (tagsToUse.length === 0) {
      console.log('⏳ No tags available, loading...');
      tagsToUse = await fetchSearchFilterTags();
      if (tagsToUse.length === 0) {
        alert('Failed to load tags. Please refresh the page and try again.');
        e.target.value = '';
        return;
      }
    }

    setAnalyzingImages(true);
    setUploadProgress({ current: 0, total: files.length });
    setAnalysisProgress({ current: 0, total: files.length, status: 'Starting...' });

    const newImages: ImageWithTags[] = [];

    try {
      // Upload images first
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        setAnalysisProgress({ current: 0, total: files.length, status: `Uploading image ${i + 1} of ${files.length}...` });

        const imageUrl = await uploadMultipleImages([file], 'properties');

        newImages.push({
          url: imageUrl[0],
          file,
          tags: [],
          isSmugmug: false
        });
      }

      // Analyze with tags
      setAnalysisProgress({ current: 0, total: files.length, status: 'Starting AI analysis...' });

      for (let i = 0; i < newImages.length; i++) {
        const suggestedTags = await analyzeImageAndTag(newImages[i].url, i, files.length, tagsToUse);
        newImages[i].tags = suggestedTags;
      }

      setImages(prev => {
        const updated = [...prev, ...newImages];
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

      setTimeout(() => syncPhotoTagsToProperty(updated), 0);

      return updated;
    });
  }

  function togglePropertyTag(tagName: string) {
    setPropertyTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
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

  function updateContact(index: number, field: keyof Contact, value: string) {
    setContacts(prev => prev.map((contact, i) =>
      i === index ? { ...contact, [field]: value } : contact
    ));
  }

  function addContact() {
    setContacts(prev => [...prev, { name: '', cell_number: '', home_number: '', office_number: '', email: '' }]);
  }

  function removeContact(index: number) {
    if (contacts.length <= 2) {
      alert('At least 2 contacts are required');
      return;
    }
    setContacts(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }

    if (images.length < 6) {
      alert('Please upload at least 6 images for the property grid display');
      return;
    }

    // Validate contacts
    if (contacts.length < 2) {
      alert('At least 2 contacts are required');
      return;
    }

    // Check if all contact fields are filled
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (!contact.name || !contact.email) {
        alert(`Contact ${i + 1}: Name and Email are required fields`);
        return;
      }
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Your session has expired. Please login again.');
        router.push('/admin/login');
        return;
      }

      // Reorder images: grid images first, then the rest
      const gridImages = gridIndices.slice(0, 6).map(i => images[i]);
      const nonGridImages = images.filter((_, i) => !gridIndices.slice(0, 6).includes(i));
      const reorderedImages = [...gridImages, ...nonGridImages];

      // Get the selected category name
      const selectedCategory = categories.find(c => c.id === formData.category_id);

      // Prepare property data
      const propertyData: any = {
        name: formData.name,
        description: formData.description || '',
        address: formData.address,
        city: formData.city,
        county: formData.state, // Map state to county field
        zipcode: formData.zipcode || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        is_featured: formData.is_featured,
        is_exclusive: formData.is_exclusive,
        categories: selectedCategory ? [selectedCategory.name] : [],
        property_tags: propertyTags,
        primary_image: reorderedImages[0]?.url || null,
        images: reorderedImages.map(img => img.url),
        contacts: contacts,
        updated_at: new Date().toISOString()
      };

      console.log('Updating property data:', propertyData);

      // Update property
      const { error: propertyError } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', propertyId);

      if (propertyError) {
        console.error('Property update error:', propertyError);
        throw new Error(propertyError.message);
      }

      console.log('✓ Property updated:', propertyId);

      // Delete existing property_images
      const { error: deleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId);

      if (deleteError) {
        console.error('Error deleting old images:', deleteError);
      }

      // Insert new images with tags
      const imageRecords = reorderedImages.map((img, index) => ({
        property_id: propertyId,
        image_url: img.url,
        display_order: index,
        tags: img.tags || []
      }));

      const { error: imagesError } = await supabase
        .from('property_images')
        .insert(imageRecords);

      if (imagesError) {
        console.error('Images insert error:', imagesError);
        throw new Error(imagesError.message);
      }

      console.log(`✓ Updated ${imageRecords.length} images with tags`);

      alert('✓ Property updated successfully!');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
          setTimeout(() => initializeGoogleAutocomplete(), 500);
        }}
        onError={(e) => {
          console.error('❌ Error loading Google Maps script:', e);
        }}
      />

      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/properties')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>
        <h1 className="text-3xl font-bold">Edit Property</h1>
      </div>

      {/* Property Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Property Views</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{propertyStats.views.toLocaleString()}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Eye className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Image Downloads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{propertyStats.downloads.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg">
              <Download className="text-white" size={24} />
            </div>
          </div>
        </div>
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

          {/* CONTACTS SECTION */}
          <div className="col-span-2 border-t pt-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Property Contacts *</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    At least 2 contacts are required. Name and Email are mandatory fields.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addContact}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">Contact {index + 1}</h4>
                      {contacts.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <Input
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          placeholder="Contact name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cell Number</label>
                        <Input
                          type="tel"
                          value={contact.cell_number}
                          onChange={(e) => updateContact(index, 'cell_number', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Home Number</label>
                        <Input
                          type="tel"
                          value={contact.home_number}
                          onChange={(e) => updateContact(index, 'home_number', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Office Number</label>
                        <Input
                          type="tel"
                          value={contact.office_number}
                          onChange={(e) => updateContact(index, 'office_number', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOTES SECTION - AUTO-SAVES */}
          <div className="col-span-2 border-t pt-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Internal notes for admin use only (not visible on website) • Auto-saves as you type
                  </p>
                </div>
                {notesSaving && (
                  <span className="text-sm text-gray-500 italic">Saving...</span>
                )}
                {notesSaved && !notesSaving && (
                  <span className="text-sm text-green-600 italic">Saved ✓</span>
                )}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this property..."
                rows={6}
                className="w-full"
              />
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
              Property Images * (Minimum 6 images required for grid display)
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
              <div className="mb-6">
                <GridPreview
                  images={images}
                  gridIndices={gridIndices}
                  onGridIndicesChange={setGridIndices}
                />
              </div>
            )}

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
                  {/* LEFT: Image Grid */}
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
                          <div className="max-h-[500px] overflow-y-auto space-y-3">
                            {Object.entries(tagsByFilter).map(([filterName, tags]) => {
                              const isExpanded = expandedFilters.has(filterName);
                              return (
                                <div key={filterName} className="bg-white rounded-lg border">
                                  <button
                                    type="button"
                                    onClick={() => toggleFilterExpanded(filterName)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                                  >
                                    <h5 className="font-medium text-sm text-gray-900 flex items-center">
                                      <ChevronDown
                                        className={`w-4 h-4 mr-2 transition-transform ${
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
            {saving ? 'Saving Changes...' : 'Save Changes'}
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
