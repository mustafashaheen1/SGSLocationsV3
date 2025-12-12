declare global {
  interface Window {
    google: any;
  }
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Upload, ChevronDown, X, Tag as TagIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoginModal from '@/components/LoginModal';
import { saveGuestListing, getGuestListing, clearGuestListing } from '@/lib/guest-listing';

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
  file: File;
  preview: string;
  tags: string[];
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

export default function ListYourPropertyPage() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingPendingSubmission, setIsProcessingPendingSubmission] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
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
    listedElsewhere: '',
    propertyRole: '',
    propertyRoleOther: '',
    listedForSale: '',
    requestedUse: [] as string[],
    listedWith: [] as string[],
    howDidYouHear: [] as string[],
    additionalNotes: '',
    agreeToTerms: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<ImageWithTags[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [termsContent, setTermsContent] = useState('');
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
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Handle pending submission from guest listing flow
  const handlePendingSubmission = async (userId: string) => {
    const pendingListing = await getGuestListing();

    if (pendingListing && !isProcessingPendingSubmission) {
      setIsProcessingPendingSubmission(true);
      console.log('Found pending listing, processing...');

      try {
        // Restore form data
        setFormData(pendingListing.formData);
        setSelectedCategoryId(pendingListing.selectedCategoryId);
        setSelectedSubCategoryId(pendingListing.selectedSubCategoryId || '');
        setPropertyTags(pendingListing.propertyTags);

        // Restore image files
        const imagesWithTags: ImageWithTags[] = pendingListing.imageFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          tags: [],
        }));
        setUploadedFiles(imagesWithTags);

        // Submit the property
        setIsSubmitting(true);
        await submitPropertyToDatabase(userId);
      } catch (error) {
        console.error('Error processing pending submission:', error);
        alert('There was an error submitting your property. Please try again.');
        clearGuestListing();
        setIsProcessingPendingSubmission(false);
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    async function fetchTerms() {
      const { data } = await supabase
        .from('terms_and_conditions')
        .select('content')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setTermsContent((data as any).content);
      }
    }

    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Fetch user profile from users table
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, email, phone, user_type')
            .eq('id', user.id)
            .maybeSingle();

          // Check if user is a producer - they cannot list properties
          if (profile && (profile as any).user_type === 'production') {
            console.log('Producer user trying to access list-your-property - redirecting to dashboard');
            setCheckingAccess(false);
            router.push('/dashboard');
            return;
          }

          setIsUserLoggedIn(true);

          if (profile) {
            // Split full name into first and last name
            const nameParts = (profile as any).full_name?.split(' ') || [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Auto-fill form fields
            setFormData(prev => ({
              ...prev,
              firstName,
              lastName,
              email: (profile as any).email || user.email || '',
              phoneNumber: (profile as any).phone || '',
            }));
          } else {
            // If no profile in users table, use auth metadata
            const nameParts = user.user_metadata?.full_name?.split(' ') || [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData(prev => ({
              ...prev,
              firstName,
              lastName,
              email: user.email || '',
            }));
          }

          // Check for pending property submission
          await handlePendingSubmission(user.id);
        }
        setCheckingAccess(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setCheckingAccess(false);
      }
    }

    fetchTerms();
    fetchCategories();
    fetchTags();
    fetchUserProfile();

    // Listen for auth state changes to handle post-registration flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_IN' && session?.user) {
        // User just signed in/registered, check for pending submission
        await handlePendingSubmission(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

    // Check if Google Maps is loaded
    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places) {
      console.log('⚠️ Google Maps not loaded yet, will retry...');
      setTimeout(() => initializeGoogleAutocomplete(), 500);
      return;
    }

    // Clean up existing autocomplete instance if it exists
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

    // Prevent changes to locked fields when user is logged in
    if (isUserLoggedIn && (name === 'firstName' || name === 'lastName' || name === 'email')) {
      return;
    }

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

  const handleCheckboxChange = (category: 'requestedUse' | 'listedWith' | 'howDidYouHear', value: string) => {
    setFormData(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    if (errors[category]) {
      setErrors(prev => ({ ...prev, [category]: '' }));
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
    if (!formData.listedElsewhere) newErrors.listedElsewhere = 'This field is required';
    if (!formData.propertyRole) newErrors.propertyRole = 'This field is required';
    if (!formData.listedForSale) newErrors.listedForSale = 'This field is required';
    if (formData.requestedUse.length === 0) newErrors.requestedUse = 'Select at least one option';
    if (formData.listedWith.length === 0) newErrors.listedWith = 'Select at least one option';
    if (formData.howDidYouHear.length === 0) newErrors.howDidYouHear = 'Select at least one option';
    if (!selectedCategoryId) newErrors.category = 'Please select a category';
    if (subCategories.length > 0 && !selectedSubCategoryId) newErrors.subCategory = 'Please select a sub-category';
    if (uploadedFiles.length < 10) newErrors.files = 'Minimum 10 images required';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';

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
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // User not logged in - save to IndexedDB and show login modal
        console.log('User not logged in, saving listing data...');

        // Save File objects directly to IndexedDB
        const imageFiles = uploadedFiles.map(img => img.file);

        // Save to IndexedDB
        await saveGuestListing({
          formData,
          selectedCategoryId,
          selectedSubCategoryId,
          propertyTags,
          imageFiles,
        });

        setIsSubmitting(false);
        setShowLoginModal(true);
        return;
      }

      // User is logged in - proceed with submission
      await submitPropertyToDatabase(session.user.id);

    } catch (error: any) {
      console.error('Error submitting property:', error);
      alert('Error submitting property: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const submitPropertyToDatabase = async (userId: string) => {
    try {
      const { uploadMultipleImages } = await import('@/lib/s3-upload');
      const imageFiles = uploadedFiles.map(img => img.file);
      const uploadedImageUrls = await uploadMultipleImages(imageFiles, 'properties');

      const { data: property, error: propertyError } = await (supabase
        .from('properties') as any)
        .insert([{
          name: `Property in ${formData.city}, ${formData.state}`,
          real_name: `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
          description: `Submitted by ${formData.firstName} ${formData.lastName} (${formData.email})`,
          address: formData.streetAddress,
          city: formData.city,
          county: formData.state,
          zipcode: formData.zipCode,
          owner_id: userId,
          property_type: 'Residential',
          daily_rate: '0',
          category_id: selectedCategoryId,
          sub_category_id: selectedSubCategoryId || null,
          property_tags: propertyTags,
          images: uploadedImageUrls,
          primary_image: uploadedImageUrls[0],
          status: 'pending',
        }])
        .select()
        .single();

      if (propertyError) throw propertyError;

      const propertyImagesData = uploadedFiles.map((img, index) => ({
        property_id: property.id,
        image_url: uploadedImageUrls[index],
        tags: img.tags,
        display_order: index,
      }));

      const { error: imagesError} = await (supabase
        .from('property_images') as any)
        .insert(propertyImagesData);

      if (imagesError) throw imagesError;

      // Clear guest listing data
      clearGuestListing();

      alert('Property submitted successfully! We will review it and get back to you soon.');
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Error submitting property:', error);
      alert('Error submitting property: ' + error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
          <h1 className="text-4xl font-bold text-red-600 mb-2 mt-0">List Your Property</h1>
          <p className="text-lg text-gray-600">
            Be a part of the largest location database in the Dallas-Fort Worth area
          </p>
        </div>

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
                      First Name <span className="text-red-600">*</span>
                      {isUserLoggedIn && <span className="text-xs text-gray-500 ml-2">(from your account)</span>}
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      readOnly={isUserLoggedIn}
                      disabled={isUserLoggedIn}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      } ${isUserLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block font-medium text-gray-700 text-sm mb-1">
                      Last Name <span className="text-red-600">*</span>
                      {isUserLoggedIn && <span className="text-xs text-gray-500 ml-2">(from your account)</span>}
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      readOnly={isUserLoggedIn}
                      disabled={isUserLoggedIn}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      } ${isUserLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block font-medium text-gray-700 text-sm mb-1">
                    Email <span className="text-red-600">*</span>
                    {isUserLoggedIn && <span className="text-xs text-gray-500 ml-2">(from your account)</span>}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    readOnly={isUserLoggedIn}
                    disabled={isUserLoggedIn}
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } ${isUserLoggedIn ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {isUserLoggedIn && (
                    <p className="text-xs text-gray-600 mt-1">
                      These fields are auto-filled from your account and cannot be changed here.
                    </p>
                  )}
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="phoneNumber" className="block font-medium text-gray-700 text-sm mb-1">
                    Phone Number <span className="text-red-600">*</span>
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
                  {errors.phoneNumber && <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}
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
                    Street Address <span className="text-red-600">*</span>
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
                  {errors.streetAddress && <p className="text-red-600 text-sm mt-1">{errors.streetAddress}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="city" className="block font-medium text-gray-700 text-sm mb-1">
                      City <span className="text-red-600">*</span>
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
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block font-medium text-gray-700 text-sm mb-1">
                      ZIP Code <span className="text-red-600">*</span>
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
                    {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="state" className="block font-medium text-gray-700 text-sm mb-1">
                    State <span className="text-red-600">*</span>
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
                  {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                </div>
              </section>

              {/* Radio Questions */}
              <section className="mb-6">
                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    Is this location listed on any other location platforms such as Airbnb or Peerspace? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedElsewhere"
                        value="yes"
                        checked={formData.listedElsewhere === 'yes'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedElsewhere"
                        value="no"
                        checked={formData.listedElsewhere === 'no'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                  {errors.listedElsewhere && <p className="text-red-600 text-sm mt-1">{errors.listedElsewhere}</p>}
                </div>

                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    Are you currently: <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="propertyRole"
                        value="owner"
                        checked={formData.propertyRole === 'owner'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Property Owner</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="propertyRole"
                        value="manager"
                        checked={formData.propertyRole === 'manager'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Property Manager</span>
                    </label>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="propertyRole"
                      value="other"
                      checked={formData.propertyRole === 'other'}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2">Other</span>
                  </label>
                  {formData.propertyRole === 'other' && (
                    <input
                      type="text"
                      name="propertyRoleOther"
                      value={formData.propertyRoleOther}
                      onChange={handleInputChange}
                      placeholder="Specify Other"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                    />
                  )}
                  {errors.propertyRole && <p className="text-red-600 text-sm mt-1">{errors.propertyRole}</p>}
                </div>

                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    Is this location currently listed for sale? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedForSale"
                        value="yes"
                        checked={formData.listedForSale === 'yes'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedForSale"
                        value="no"
                        checked={formData.listedForSale === 'no'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                  {errors.listedForSale && <p className="text-red-600 text-sm mt-1">{errors.listedForSale}</p>}
                </div>
              </section>

              {/* Checkbox Sections */}
              <section className="mb-6">
                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    I request that my property be considered for location and event use as follows: (check all that apply) <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Still & Print Photography', 'TV & Motion Pictures', 'Corporate Events', 'Long or Short Term Lease'].map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requestedUse.includes(option)}
                          onChange={() => handleCheckboxChange('requestedUse', option)}
                          className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.requestedUse && <p className="text-red-600 text-sm mt-1">{errors.requestedUse}</p>}
                </div>

                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    I request that my property be listed with: (check all that apply) <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['SGS Locations', 'Wedding Estates (Wedding Photography)', 'FilmHere.com (Student Films)'].map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.listedWith.includes(option)}
                          onChange={() => handleCheckboxChange('listedWith', option)}
                          className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.listedWith && <p className="text-red-600 text-sm mt-1">{errors.listedWith}</p>}
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    How did you hear about us? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Online Search', 'Currently Listed Property Owner', 'Production Referral', 'Other'].map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.howDidYouHear.includes(option)}
                          onChange={() => handleCheckboxChange('howDidYouHear', option)}
                          className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.howDidYouHear && <p className="text-red-600 text-sm mt-1">{errors.howDidYouHear}</p>}
                </div>
              </section>

              {/* CATEGORY SELECTION */}
              <section className="mb-6">
                <label htmlFor="category" className="block font-medium text-gray-700 text-sm mb-1">
                  Property Category <span className="text-red-600">*</span>
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
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </section>

              {/* SUB-CATEGORY SELECTION */}
              {selectedCategoryId && subCategories.length > 0 && (
                <section className="mb-6">
                  <label htmlFor="subCategory" className="block font-medium text-gray-700 text-sm mb-1">
                    Property Sub-Category <span className="text-red-600">*</span>
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
                  {errors.subCategory && <p className="text-red-600 text-sm mt-1">{errors.subCategory}</p>}
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
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {propertyTags.map(tagName => (
                        <span
                          key={tagName}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full"
                        >
                          {tagName}
                          <button
                            type="button"
                            onClick={() => setPropertyTags(prev => prev.filter(t => t !== tagName))}
                            className="hover:bg-red-700 rounded-full"
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
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-600'
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
                {errors.files && <p className="text-red-600 text-sm mt-1">{errors.files}</p>}

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
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {img.tags.length > 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-red-600 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
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

              {/* Terms and Conditions */}
              <section className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Terms and Conditions</label>
                <div className="max-h-[300px] overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50 text-sm leading-relaxed whitespace-pre-line">
                  {termsContent || 'Loading terms and conditions...'}
                </div>
              </section>

              {/* Agreement Checkbox */}
              <section className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }));
                      if (errors.agreeToTerms) {
                        setErrors(prev => ({ ...prev, agreeToTerms: '' }));
                      }
                    }}
                    className={`w-4 h-4 accent-red-600 focus:ring-red-500 rounded mt-1 ${
                      errors.agreeToTerms ? 'border-red-500' : ''
                    }`}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the foregoing terms <span className="text-red-600">*</span>
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-red-600 text-sm mt-1">{errors.agreeToTerms}</p>}
              </section>

              {/* Please Note */}
              <section className="text-sm text-gray-600 mt-4">
                <p className="font-bold text-gray-900 mb-1">PLEASE NOTE</p>
                <p className="mb-1"><span className="text-red-600">*</span> Indicates required fields</p>
                <p>All submissions are subject to review & approval by SGS Locations</p>
              </section>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center md:justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
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
                  Submitting...
                </>
              ) : (
                'Submit'
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
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded-full"
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
                                className="hover:bg-red-700 rounded-full"
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
                                          ? 'bg-red-600 text-white'
                                          : 'bg-white border border-gray-300 text-gray-700 hover:border-red-600'
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

      {/* Login Modal for Guest Listing */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        preFilledEmail={formData.email}
        isEmailLocked={true}
        redirectAfterLogin="/list-your-property"
      />
    </>
  );
}
