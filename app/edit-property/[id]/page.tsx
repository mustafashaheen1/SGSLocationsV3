declare global {
  interface Window {
    google: any;
  }
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter, useParams } from 'next/navigation';
import { Upload, ChevronDown, X, Tag as TagIcon, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

interface FilterTag {
  id: string;
  filter_id: string;
  filter_name: string;
  name: string;
  slug: string;
}

interface ImageWithTags {
  file?: File;
  preview: string;
  tags: string[];
  url?: string; // For existing images
  id?: string; // For existing property_images records
}

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

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    internationalPhone: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    additionalNotes: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<ImageWithTags[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [propertyTags, setPropertyTags] = useState<string[]>([]);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showImageTagModal, setShowImageTagModal] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchProperty();
  }, [propertyId]);

  async function fetchProperty() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Check user type - only property owners can edit properties
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if ((userData as any)?.user_type !== 'property_owner') {
        alert('Only property owners can manage properties');
        router.push('/dashboard');
        return;
      }

      // Fetch property data
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('owner_id', user.id)
        .single();

      if (propertyError) {
        console.error('Error fetching property:', propertyError);
        setMessage({ type: 'error', text: 'Property not found or you do not have permission to edit it.' });
        setLoading(false);
        return;
      }

      setProperty(propertyData);

      // Fetch property images with tags
      const { data: imagesData } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order');

      // Pre-fill form with existing data
      // Parse description to extract contact info if available
      const description = (propertyData as any).description || '';
      const emailMatch = description.match(/\(([^)]+@[^)]+)\)/);
      const nameMatch = description.match(/Submitted by ([^(]+)/);

      let firstName = '';
      let lastName = '';
      if (nameMatch) {
        const fullName = nameMatch[1].trim();
        const nameParts = fullName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Get user profile for phone number
      const { data: profile } = await supabase
        .from('users')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      setFormData({
        firstName,
        lastName,
        email: emailMatch ? emailMatch[1] : user.email || '',
        phoneNumber: (profile as any)?.phone || '',
        internationalPhone: '',
        streetAddress: (propertyData as any).address || '',
        city: (propertyData as any).city || '',
        state: (propertyData as any).county || '',
        zipCode: (propertyData as any).zipcode || '',
        additionalNotes: (propertyData as any).description || '',
      });

      // Set category and sub-category
      if ((propertyData as any).category_id) {
        setSelectedCategoryId((propertyData as any).category_id);

        // Fetch sub-categories for this category
        const { data: subCatsData } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .eq('parent_id', (propertyData as any).category_id)
          .order('display_order');

        if (subCatsData) {
          setSubCategories(subCatsData);
        }
      }

      if ((propertyData as any).sub_category_id) {
        setSelectedSubCategoryId((propertyData as any).sub_category_id);
      }

      // Set property tags
      if ((propertyData as any).property_tags) {
        setPropertyTags((propertyData as any).property_tags);
      }

      // Set images
      if (imagesData && imagesData.length > 0) {
        const existingImages: ImageWithTags[] = (imagesData as any[]).map((img: any) => ({
          preview: img.image_url,
          url: img.image_url,
          tags: img.tags || [],
          id: img.id,
        }));
        setUploadedFiles(existingImages);
      }

    } catch (error) {
      console.error('Error loading property:', error);
      setMessage({ type: 'error', text: 'Failed to load property.' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchSubCategories(categoryId: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('parent_id', categoryId)
        .order('display_order');

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      setSubCategories([]);
    }
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
        (filters as any[]).forEach((filter: any) => {
          const tags = filter.search_filter_tags as any[];
          tags?.forEach((tag: any) => {
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

  const tagsByFilter = availableTags.reduce((acc, tag) => {
    if (!acc[tag.filter_name]) {
      acc[tag.filter_name] = [];
    }
    acc[tag.filter_name].push(tag);
    return acc;
  }, {} as Record<string, FilterTag[]>);

  function initializeGoogleAutocomplete() {
    const addressInput = addressInputRef.current;

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
      try {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      } catch (e) {
        console.log('Could not clear listeners:', e);
      }
      autocompleteRef.current = null;
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

        setFormData(prev => ({
          ...prev,
          streetAddress: fullAddress,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipcode || prev.zipCode
        }));
      });

      autocompleteRef.current = autocomplete;
      console.log('✅ Google Autocomplete initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length >= 6) {
      formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/png';
      return isValid;
    });

    const newImages: ImageWithTags[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      tags: []
    }));

    setUploadedFiles(prev => [...prev, ...newImages]);
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!selectedCategoryId) newErrors.category = 'Please select a category';
    if (subCategories.length > 0 && !selectedSubCategoryId) newErrors.subCategory = 'Please select a sub-category';
    if (uploadedFiles.length < 10) newErrors.files = 'Minimum 10 images required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'You must be logged in to edit properties.' });
        return;
      }

      // Upload new images if any
      const newImages = uploadedFiles.filter(img => img.file);
      const existingImages = uploadedFiles.filter(img => img.url);

      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        const { uploadMultipleImages } = await import('@/lib/s3-upload');
        const imageFiles = newImages.map(img => img.file!);
        newImageUrls = await uploadMultipleImages(imageFiles, 'properties');
      }

      // Combine existing and new image URLs
      const allImageUrls = [
        ...existingImages.map(img => img.url!),
        ...newImageUrls
      ];

      // Check if property was previously approved (active)
      const wasActive = property?.status === 'active';

      // Update property
      const { error: propertyError } = await (supabase
        .from('properties') as any)
        .update({
          name: `${formData.streetAddress}, ${formData.city}`,
          description: `Submitted by ${formData.firstName} ${formData.lastName} (${formData.email})`,
          address: formData.streetAddress,
          city: formData.city,
          county: formData.state,
          zipcode: formData.zipCode,
          category_id: selectedCategoryId,
          sub_category_id: selectedSubCategoryId || null,
          property_tags: propertyTags,
          images: allImageUrls,
          primary_image: allImageUrls[0],
          status: wasActive ? 'pending' : property?.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
        .eq('owner_id', user.id);

      if (propertyError) throw propertyError;

      // Delete existing property_images records
      await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId);

      // Insert all property images (existing + new)
      const propertyImagesData = uploadedFiles.map((img, index) => {
        const imageUrl = img.url || newImageUrls[newImages.indexOf(img)];
        return {
          property_id: propertyId,
          image_url: imageUrl,
          tags: img.tags,
          display_order: index,
        };
      });

      const { error: imagesError } = await (supabase
        .from('property_images') as any)
        .insert(propertyImagesData);

      if (imagesError) throw imagesError;

      const successMessage = wasActive
        ? 'Property updated successfully! Your changes will be reviewed by an admin before going live again.'
        : 'Property updated successfully!';

      setMessage({ type: 'success', text: successMessage });
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error updating property:', error);
      setMessage({ type: 'error', text: 'Error updating property: ' + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading property...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-brand mb-4">{message.text || 'Property not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-brand text-white px-6 py-2 rounded hover:bg-brand-hover"
          >
            Back to Dashboard
          </button>
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

      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-3 pb-8">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-brand mb-2 mt-0">Edit Your Property</h1>
            <p className="text-lg text-gray-600">
              Update your property information
            </p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <fieldset disabled={isSubmitting} className="disabled:opacity-60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div>
                {/* Contact Information */}
                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="firstName" className="block font-medium text-gray-700 text-sm mb-1">
                        First Name <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && <p className="text-brand text-sm mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block font-medium text-gray-700 text-sm mb-1">
                        Last Name <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && <p className="text-brand text-sm mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="block font-medium text-gray-700 text-sm mb-1">
                      Email <span className="text-brand">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="text-brand text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="phoneNumber" className="block font-medium text-gray-700 text-sm mb-1">
                      Phone Number <span className="text-brand">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(555) 555-5555"
                      maxLength={14}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phoneNumber && <p className="text-brand text-sm mt-1">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label htmlFor="internationalPhone" className="block font-medium text-gray-700 text-sm mb-1">
                      International Phone
                    </label>
                    <input
                      type="tel"
                      id="internationalPhone"
                      name="internationalPhone"
                      value={formData.internationalPhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </section>

                {/* Property Address */}
                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Property Address</h2>

                  <div className="mb-4">
                    <label htmlFor="streetAddress" className="block font-medium text-gray-700 text-sm mb-1">
                      Street Address <span className="text-brand">*</span>
                    </label>
                    <input
                      ref={addressInputRef}
                      type="text"
                      id="streetAddress"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.streetAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Start typing to search..."
                    />
                    {errors.streetAddress && <p className="text-brand text-sm mt-1">{errors.streetAddress}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="city" className="block font-medium text-gray-700 text-sm mb-1">
                        City <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.city && <p className="text-brand text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block font-medium text-gray-700 text-sm mb-1">
                        ZIP Code <span className="text-brand">*</span>
                      </label>
                      <input
                        type="number"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        maxLength={10}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                          errors.zipCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.zipCode && <p className="text-brand text-sm mt-1">{errors.zipCode}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className="block font-medium text-gray-700 text-sm mb-1">
                      State <span className="text-brand">*</span>
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select State</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-brand text-sm mt-1">{errors.state}</p>}
                  </div>
                </section>

                {/* CATEGORY SELECTION */}
                <section className="mb-6">
                  <label htmlFor="category" className="block font-medium text-gray-700 text-sm mb-1">
                    Property Category <span className="text-brand">*</span>
                  </label>
                  <select
                    id="category"
                    value={selectedCategoryId}
                    onChange={(e) => {
                      const newCategoryId = e.target.value;
                      setSelectedCategoryId(newCategoryId);
                      setSelectedSubCategoryId(''); // Reset sub-category when category changes
                      setSubCategories([]); // Clear sub-categories
                      if (newCategoryId) {
                        fetchSubCategories(newCategoryId);
                      }
                      if (errors.category) {
                        setErrors(prev => ({ ...prev, category: '' }));
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select a category --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-brand text-sm mt-1">{errors.category}</p>}
                </section>

                {/* SUB-CATEGORY SELECTION */}
                {selectedCategoryId && subCategories.length > 0 && (
                  <section className="mb-6">
                    <label htmlFor="subCategory" className="block font-medium text-gray-700 text-sm mb-1">
                      Property Sub-Category <span className="text-brand">*</span>
                    </label>
                    <select
                      id="subCategory"
                      value={selectedSubCategoryId}
                      onChange={(e) => {
                        setSelectedSubCategoryId(e.target.value);
                        if (errors.subCategory) {
                          setErrors(prev => ({ ...prev, subCategory: '' }));
                        }
                      }}
                      className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.subCategory ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select a sub-category --</option>
                      {subCategories.map(subCategory => (
                        <option key={subCategory.id} value={subCategory.id}>
                          {subCategory.name}
                        </option>
                      ))}
                    </select>
                    {errors.subCategory && <p className="text-brand text-sm mt-1">{errors.subCategory}</p>}
                  </section>
                )}

                {/* PROPERTY TAGS SECTION */}
                <section className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-1">
                    Property Features & Tags
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Select tags that describe your property to help production companies find your location.
                  </p>

                  {propertyTags.length > 0 && (
                    <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-700">Selected: {propertyTags.length}</p>
                        <button
                          type="button"
                          onClick={() => setPropertyTags([])}
                          className="text-xs text-brand hover:text-brand-hover"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {propertyTags.map(tagName => (
                          <span
                            key={tagName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand text-white text-xs rounded-full"
                          >
                            {tagName}
                            <button
                              type="button"
                              onClick={() => setPropertyTags(prev => prev.filter(t => t !== tagName))}
                              className="hover:bg-brand-hover rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-64 overflow-y-auto border rounded">
                    {Object.entries(tagsByFilter).map(([filterName, tags]) => (
                      <div key={filterName} className="border-b last:border-b-0">
                        <button
                          type="button"
                          onClick={() => toggleFilterExpanded(filterName)}
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{filterName}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {tags.filter(t => propertyTags.includes(t.name)).length}/{tags.length}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-3 h-3 text-gray-500 transition-transform ${
                              expandedFilters.has(filterName) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expandedFilters.has(filterName) && (
                          <div className="px-3 py-2 bg-gray-50">
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map(tag => (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => {
                                    setPropertyTags(prev =>
                                      prev.includes(tag.name)
                                        ? prev.filter(t => t !== tag.name)
                                        : [...prev, tag.name]
                                    );
                                  }}
                                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                    propertyTags.includes(tag.name)
                                      ? 'bg-brand text-white border-brand'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-brand'
                                  }`}
                                >
                                  {tag.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* Image Upload */}
                <section className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-1">
                    Please Include At Least 10 Images
                  </label>
                  <p className="text-sm text-gray-600 mb-2">Minimum 10 images required. No maximum limit.</p>
                  <p className="text-sm text-gray-500 mb-2">(Only JPGs and PNGs accepted.)</p>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput')?.click()}
                    className={`border-2 border-dashed rounded bg-gray-50 min-h-[350px] flex flex-col items-center justify-center p-8 cursor-pointer transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-50' : errors.files ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">Drop files here to upload</p>
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    {uploadedFiles.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">{uploadedFiles.length} image(s) uploaded</p>
                    )}
                  </div>
                  {errors.files && <p className="text-brand text-sm mt-1">{errors.files}</p>}

                  {/* Image Preview Grid */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {uploadedFiles.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-gray-300"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setShowImageTagModal(true);
                            }}
                            className="absolute bottom-1.5 left-1.5 bg-white px-1.5 py-0.5 rounded text-xs font-medium border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
                          >
                            <TagIcon className="w-3 h-3" />
                            {img.tags.length > 0 ? `${img.tags.length}` : '+'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1.5 right-1.5 bg-brand text-white p-0.5 rounded-full hover:bg-brand-hover opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {img.tags.length > 0 && (
                            <div className="absolute top-1.5 left-1.5 bg-brand text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                              {img.tags.length}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Additional Notes */}
                <section className="mb-6">
                  <label htmlFor="additionalNotes" className="block font-medium text-gray-700 text-sm mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                  />
                </section>

                {/* Please Note */}
                <section className="text-sm text-gray-600 mt-4">
                  <p className="font-bold text-gray-900 mb-1">PLEASE NOTE</p>
                  <p className="mb-1"><span className="text-brand">*</span> Indicates required fields</p>
                  <p>All changes are subject to review & approval by SGS Locations</p>
                </section>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-center md:justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded text-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-brand hover:bg-brand-hover'
                } text-white font-semibold py-3 px-12 rounded text-lg transition-colors flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
            </fieldset>
          </form>

          {/* Image Tag Modal */}
          {showImageTagModal && selectedImageIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                  <h3 className="text-xl font-bold text-gray-900">
                    Tag Image {selectedImageIndex + 1}
                  </h3>
                  <button
                    onClick={() => {
                      setShowImageTagModal(false);
                      setSelectedImageIndex(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={uploadedFiles[selectedImageIndex].preview}
                        alt={`Image ${selectedImageIndex + 1}`}
                        className="w-full h-auto rounded-lg border border-gray-300"
                      />

                      {uploadedFiles[selectedImageIndex].tags.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Tags:</p>
                          <div className="flex flex-wrap gap-2">
                            {uploadedFiles[selectedImageIndex].tags.map(tagName => (
                              <span
                                key={tagName}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-brand text-white text-xs rounded-full"
                              >
                                {tagName}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedFiles(prev => prev.map((img, i) =>
                                      i === selectedImageIndex
                                        ? { ...img, tags: img.tags.filter(t => t !== tagName) }
                                        : img
                                    ));
                                  }}
                                  className="hover:bg-brand-hover rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Select tags that describe what's visible in this specific photo.
                      </p>

                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {Object.entries(tagsByFilter).map(([filterName, tags]) => (
                          <div key={filterName} className="border rounded-lg">
                            <button
                              type="button"
                              onClick={() => toggleFilterExpanded(filterName)}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{filterName}</span>
                                <span className="text-xs text-gray-500">
                                  ({tags.filter(t => uploadedFiles[selectedImageIndex].tags.includes(t.name)).length}/{tags.length})
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  expandedFilters.has(filterName) ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {expandedFilters.has(filterName) && (
                              <div className="px-4 py-3 border-t bg-gray-50">
                                <div className="flex flex-wrap gap-2">
                                  {tags.map(tag => {
                                    const isSelected = uploadedFiles[selectedImageIndex].tags.includes(tag.name);
                                    return (
                                      <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => {
                                          setUploadedFiles(prev => prev.map((img, i) => {
                                            if (i === selectedImageIndex) {
                                              const newTags = isSelected
                                                ? img.tags.filter(t => t !== tag.name)
                                                : [...img.tags, tag.name];
                                              return { ...img, tags: newTags };
                                            }
                                            return img;
                                          }));
                                        }}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                          isSelected
                                            ? 'bg-brand text-white'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:border-brand'
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
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageTagModal(false);
                      setSelectedImageIndex(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
