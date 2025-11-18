declare global {
  interface Window {
    google: any;
  }
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, Upload, X, Camera, Download, Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages } from '@/lib/s3-upload';
import { getAddressFromGoogleMapsLink, findGoogleMapsLinkInMetadata } from '@/lib/google-maps-utils';

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
  filter_id: string;
  filter_name: string;
}

export default function AddPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBulkImport = searchParams.get('bulk_import') === 'true';
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [smugmugUrl, setSmugmugUrl] = useState('');
  const [importingFromSmugmug, setImportingFromSmugmug] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [smugmugAuthorized, setSmugmugAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, status: '' });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [propertyTags, setPropertyTags] = useState<string[]>([]);
  const [importQueue, setImportQueue] = useState<any[]>([]);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
  const [loadingQueueImages, setLoadingQueueImages] = useState(false);
  const [extractingAddress, setExtractingAddress] = useState(false);
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

  useEffect(() => {
    fetchCategories();
    fetchSearchFilterTags();
    checkSmugMugAuth();

    if (isBulkImport) {
      loadBulkImportQueue();
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('smugmug_auth') === 'success') {
      console.log('✓ Authorization success detected');
      setSmugmugAuthorized(true);
      setAuthorizing(false);
      setCheckingAuth(false);
      alert('✓ SmugMug authorized successfully!');

      window.history.replaceState({}, '', '/admin/properties/add');

      setTimeout(() => {
        checkSmugMugAuth();
      }, 1000);
    }

    if (params.get('error')) {
      const error = params.get('error');
      alert('Authorization failed: ' + error);
      setAuthorizing(false);
      setCheckingAuth(false);
    }
  }, []);

  async function checkSmugMugAuth() {
    console.log('🔍 Checking SmugMug authorization status...');
    try {
      const response = await fetch('/api/smugmug/check-auth');
      const data = await response.json();

      console.log('Authorization status:', data);

      setSmugmugAuthorized(data.authorized);

      if (data.authorized) {
        console.log('✅ SmugMug is authorized');
      } else {
        console.log('❌ SmugMug not authorized');
      }
    } catch (error) {
      console.error('Error checking SmugMug auth:', error);
      setSmugmugAuthorized(false);
    } finally {
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    if (!googleMapsLoaded || !addressInputRef.current) {
      return;
    }

    // Wait for google.maps.places to be fully available
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

          // Parse address components
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

          // Build full address
          const fullAddress = `${streetNumber} ${route}`.trim();

          console.log('✅ Parsed address:', { fullAddress, city, state, zipCode });

          // Update form data
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

    // Start initialization
    initAutocomplete();
  }, [googleMapsLoaded]);

  async function handleSmugMugAuthorize() {
    setAuthorizing(true);
    console.log('🔑 Starting SmugMug authorization...');

    try {
      const response = await fetch('/api/smugmug/request-token');
      const data = await response.json();

      if (data.authUrl) {
        console.log('Redirecting to SmugMug authorization...');
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('Authorization error:', error);
      alert('Failed to start authorization: ' + error.message);
      setAuthorizing(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchSearchFilterTags() {
    try {
      const { data: filters } = await supabase
        .from('search_filters')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

      if (!filters) return;

      const allTags: FilterTag[] = [];

      for (const filter of filters) {
        const { data: tags } = await supabase
          .from('search_filter_tags')
          .select('id, name')
          .eq('filter_id', filter.id)
          .eq('is_active', true)
          .order('display_order');

        if (tags) {
          tags.forEach(tag => {
            allTags.push({
              ...tag,
              filter_id: filter.id,
              filter_name: filter.name
            });
          });
        }
      }

      setAvailableTags(allTags);
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
          tags: [],
          isSmugmug: false
        });
      }

      setAnalysisProgress({ current: 0, total: files.length, status: 'Starting AI analysis...' });

      for (let i = 0; i < newImages.length; i++) {
        const suggestedTags = await analyzeImageAndTag(newImages[i].url, i, files.length);
        newImages[i].tags = suggestedTags;
      }

      setImages(prev => [...prev, ...newImages]);

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

  function extractAlbumKey(url: string): string | null {
    const albumKeyMatch = url.match(/\/([A-Za-z0-9]+)$/);
    return albumKeyMatch ? albumKeyMatch[1] : url.trim() || null;
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
      console.log('Import response:', data);

      if (!response.ok) {
        if (data.needsReauth) {
          alert('⚠️ SmugMug authorization expired. Please reauthorize.');
          setSmugmugAuthorized(false);
        } else {
          alert(`Import failed: ${data.error || 'Unknown error'}\n\n${data.details || ''}`);
        }
        setImportProgress('');
        setImportingFromSmugmug(false);
        return;
      }

      const imported = data.imported || 0;
      const imageUrls = data.uploadedUrls || data.urls || [];

      console.log('Imported URLs:', imageUrls);

      if (imported > 0 && imageUrls.length > 0) {
        const fullUrls = imageUrls.map((url: string) =>
          url.startsWith('http') ? url : `https://${url}`
        );

        setImportProgress(`Successfully imported ${imported} images. Analyzing with AI...`);
        setAnalyzingImages(true);

        const importedImages: ImageWithTags[] = [];

        for (const url of fullUrls) {
          importedImages.push({ url, tags: [], isSmugmug: true });
        }

        for (let i = 0; i < importedImages.length; i++) {
          const suggestedTags = await analyzeImageAndTag(importedImages[i].url, i, importedImages.length);
          importedImages[i].tags = suggestedTags;
        }

        setImages(prev => [...prev, ...importedImages]);
        setImportProgress(`✓ Imported and analyzed ${imported} images`);
        setAnalyzingImages(false);

        try {
          const albumKey = extractAlbumKey(smugmugUrl);
          if (albumKey) {
            console.log('📋 Fetching album metadata...');
            setImportProgress(`Fetching album details...`);

            const metadataResponse = await fetch(`/api/smugmug-album-metadata?albumKey=${albumKey}`);
            const metadata = await metadataResponse.json();

            if (metadata.success) {
              console.log('✓ Album metadata received:', metadata);

              const albumData: any = {
                name: metadata.name || '',
                description: metadata.description || ''
              };

              if (metadata.location?.city) {
                albumData.city = metadata.location.city;
              }
              if (metadata.location?.state) {
                albumData.state = metadata.location.state;
              }

              console.log('📝 Pre-filling form with album data:', albumData);
              setFormData(prev => ({
                ...prev,
                ...albumData
              }));

              setImportProgress(`✓ Album details loaded`);

              const mapsLink = findGoogleMapsLinkInMetadata(metadata);

              if (mapsLink) {
                console.log('📍 Found Google Maps link:', mapsLink);
                setExtractingAddress(true);
                setImportProgress('Found Google Maps link, extracting address...');

                const address = await getAddressFromGoogleMapsLink(mapsLink);

                if (address) {
                  console.log('✓ Address extracted:', address);

                  setFormData(prev => ({
                    ...prev,
                    address: address.streetAddress,
                    city: address.city,
                    state: address.state,
                    zipcode: address.zipCode
                  }));

                  setImportProgress(`✓ Imported ${imported} images, loaded album details, and extracted address!`);
                } else {
                  console.log('⚠️ Address extraction failed');
                  setImportProgress(`✓ Imported ${imported} images and loaded album details (address extraction failed)`);
                }

                setExtractingAddress(false);
              } else {
                console.log('ℹ️ No Google Maps link found in album metadata');
                setImportProgress(`✓ Imported ${imported} images and loaded album details`);
              }

              if (metadata.keywords) {
                const keywords = metadata.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
                console.log('🏷️ Found keywords:', keywords);

                const matchedTags = keywords
                  .map((keyword: string) => {
                    const tag = availableTags.find(t =>
                      t.name.toLowerCase() === keyword.toLowerCase()
                    );
                    return tag?.name;
                  })
                  .filter(Boolean) as string[];

                if (matchedTags.length > 0) {
                  console.log('✓ Matched tags:', matchedTags);
                  setPropertyTags(matchedTags);
                }
              }

            } else {
              console.log('⚠️ Failed to fetch album metadata');
              setImportProgress(`✓ Imported ${imported} images (metadata fetch failed)`);
            }
          }
        } catch (error: any) {
          console.error('Error fetching album metadata:', error);
          setImportProgress(`✓ Imported ${imported} images (metadata fetch failed)`);
        }

        setSmugmugUrl('');
        setTimeout(() => setImportProgress(''), 3000);
      } else {
        setImportProgress('');
        alert(`❌ Import failed - no images were imported`);
      }

    } catch (error: any) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
      setImportProgress('');
    } finally {
      setImportingFromSmugmug(false);
    }
  }

  async function loadBulkImportQueue() {
    try {
      const queueData = localStorage.getItem('sgs_import_queue');
      const currentIndex = parseInt(localStorage.getItem('sgs_import_current_index') || '0');

      if (queueData) {
        const queue = JSON.parse(queueData);
        setImportQueue(queue);
        setCurrentImportIndex(currentIndex);

        if (currentIndex < queue.length) {
          await loadCurrentAlbumData(queue[currentIndex]);
        }
      }
    } catch (error) {
      console.error('Error loading import queue:', error);
    }
  }

  async function loadCurrentAlbumData(album: any) {
    setLoadingQueueImages(true);

    try {
      setFormData(prev => ({
        ...prev,
        name: album.name,
        description: album.description || '',
        city: album.location?.city || '',
        state: album.location?.state || 'Texas',
      }));

      if (album.googleMapsLink) {
        console.log('📍 Found Google Maps link in album metadata');
        setExtractingAddress(true);

        const address = await getAddressFromGoogleMapsLink(album.googleMapsLink);

        if (address) {
          console.log('✓ Address extracted:', address.fullAddress);

          setFormData(prev => ({
            ...prev,
            address: address.streetAddress,
            city: address.city,
            state: address.state,
            zipcode: address.zipCode
          }));
        }

        setExtractingAddress(false);
      }

      const response = await fetch('/api/import-smugmug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumKey: album.albumKey
        })
      });

      const data = await response.json();

      if (data.success && data.urls && data.urls.length > 0) {
        setAnalyzingImages(true);
        setAnalysisProgress({ current: 0, total: data.urls.length, status: 'Starting AI analysis...' });

        const importedImages: ImageWithTags[] = [];

        for (const url of data.urls) {
          importedImages.push({ url, tags: [], isSmugmug: true });
        }

        for (let i = 0; i < importedImages.length; i++) {
          const suggestedTags = await analyzeImageAndTag(importedImages[i].url, i, importedImages.length);
          importedImages[i].tags = suggestedTags;
        }

        setImages(importedImages);
        setAnalyzingImages(false);

        if (album.keywords) {
          const keywords = album.keywords.split(',').map((k: string) => k.trim());
          const matchedTags = keywords.filter((keyword: string) =>
            availableTags.some(tag =>
              tag.name.toLowerCase() === keyword.toLowerCase()
            )
          );
          if (matchedTags.length > 0) {
            setPropertyTags(matchedTags);
          }
        }
      }
    } catch (error) {
      console.error('Error loading album data:', error);
      alert('Error loading album: ' + error);
    } finally {
      setLoadingQueueImages(false);
    }
  }

  function handleSkipProperty() {
    if (confirm('Skip this property? It will not be saved.')) {
      moveToNextProperty();
    }
  }

  function moveToNextProperty() {
    const nextIndex = currentImportIndex + 1;

    if (nextIndex < importQueue.length) {
      localStorage.setItem('sgs_import_current_index', nextIndex.toString());
      window.location.reload();
    } else {
      localStorage.removeItem('sgs_import_queue');
      localStorage.removeItem('sgs_import_current_index');
      alert('All properties imported! Returning to properties list.');
      router.push('/admin/properties');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.city || !formData.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (images.length < 10) {
      alert(`Please upload at least 10 property images (currently have ${images.length})`);
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      if (!selectedCategory) {
        throw new Error('Invalid category selected');
      }

      // Upload manual files to S3
      const filesToUpload = images.filter(img => img.file).map(img => img.file!);
      let uploadedUrls: string[] = [];

      if (filesToUpload.length > 0) {
        console.log(`Uploading ${filesToUpload.length} manual images...`);
        uploadedUrls = await uploadMultipleImages(filesToUpload, 'properties');
        console.log('Manual images uploaded successfully');
      }

      // Combine SmugMug URLs and uploaded URLs
      const smugmugUrls = images.filter(img => img.isSmugmug).map(img => img.url);
      const allImageUrls = [...smugmugUrls, ...uploadedUrls];
      console.log(`Total images: ${allImageUrls.length}`);

      // Create property
      const { data: property, error: propertyError } = await supabase.from('properties').insert([{
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        city: formData.city,
        county: formData.state,
        zipcode: formData.zipcode || null,
        property_type: 'Residential',
        square_footage: null,
        lot_size: null,
        bedrooms: null,
        bathrooms: null,
        parking_spaces: null,
        year_built: null,
        features: [],
        categories: [selectedCategory.name],
        permits_available: false,
        permit_details: null,
        daily_rate: 0,
        images: allImageUrls,
        primary_image: allImageUrls[0],
        status: 'active',
        owner_id: null,
        is_featured: formData.is_featured,
        is_exclusive: formData.is_exclusive,
        property_tags: propertyTags,
      }]).select().single();

      if (propertyError) throw propertyError;

      // Save image metadata with tags to property_images table
      let uploadIndex = 0;
      const imageRecords = images.map((img, index) => {
        let finalUrl: string;
        if (img.isSmugmug) {
          finalUrl = img.url;
        } else {
          finalUrl = uploadedUrls[uploadIndex];
          uploadIndex++;
        }

        return {
          property_id: property.id,
          image_url: finalUrl,
          display_order: index,
          tags: img.tags
        };
      });

      const { error: imagesError } = await supabase
        .from('property_images')
        .insert(imageRecords);

      if (imagesError) {
        console.error('Error saving image metadata:', imagesError);
      }

      if (isBulkImport) {
        moveToNextProperty();
      } else {
        alert('Property added successfully!');
        router.push('/admin/properties');
      }
    } catch (error: any) {
      console.error('Error adding property:', error);
      alert('Error adding property: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const tagsByFilter = availableTags.reduce((acc, tag) => {
    if (!acc[tag.filter_name]) {
      acc[tag.filter_name] = [];
    }
    acc[tag.filter_name].push(tag);
    return acc;
  }, {} as Record<string, FilterTag[]>);

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
        <Button
          variant="outline"
          onClick={() => {
            if (isBulkImport) {
              if (confirm('Cancel bulk import? Remaining properties will not be imported.')) {
                localStorage.removeItem('sgs_import_queue');
                localStorage.removeItem('sgs_import_current_index');
                router.push('/admin/properties');
              }
            } else {
              router.push('/admin/properties');
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isBulkImport ? 'Cancel Bulk Import' : 'Back to Properties'}
        </Button>
        <h1 className="text-3xl font-bold">Add New Property</h1>
      </div>

      {isBulkImport && importQueue.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Bulk Import Progress
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Property {currentImportIndex + 1} of {importQueue.length}:
                <span className="font-medium ml-1">{importQueue[currentImportIndex]?.name}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Fill in the details below and click Save to move to the next property
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {currentImportIndex + 1}/{importQueue.length}
                </div>
                <div className="text-xs text-blue-600">
                  {importQueue.length - currentImportIndex - 1} remaining
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipProperty}
                className="border-gray-300"
              >
                Skip
              </Button>
            </div>
          </div>

          <div className="mt-3 bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentImportIndex + 1) / importQueue.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {loadingQueueImages && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
          <span className="text-yellow-800">Loading album images and metadata...</span>
        </div>
      )}

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
                    Assign tags that describe this property overall (separate from individual image tags)
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
            <div className="mb-8 p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Import from SmugMug
              </h3>

              {checkingAuth ? (
                <p className="text-sm text-gray-600">Checking authorization status...</p>
              ) : !smugmugAuthorized ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      🔐 Authorization Required
                    </p>
                    <p className="text-sm text-yellow-800 mb-3">
                      You need to authorize SGS Locations to access your SmugMug account. This is a one-time setup.
                    </p>
                    <Button
                      type="button"
                      onClick={handleSmugMugAuthorize}
                      disabled={authorizing}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {authorizing ? 'Authorizing...' : 'Authorize SmugMug Access'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
                    <p className="text-sm font-medium text-green-900">
                      ✓ SmugMug Authorized
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SmugMug Album URL or Album Key
                    </label>
                    <Input
                      placeholder="Full URL or just the album key (e.g., ABC123xyz)"
                      value={smugmugUrl}
                      onChange={(e) => setSmugmugUrl(e.target.value)}
                    />
                    <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                      <p className="text-xs text-gray-700 font-medium mb-1">💡 How to find your album key:</p>
                      <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                        <li>Open your SmugMug album in a browser</li>
                        <li>Right-click → "View Page Source"</li>
                        <li>Press Ctrl+F (Cmd+F on Mac) and search for: <code className="bg-gray-100 px-1 rounded">"AlbumKey"</code></li>
                        <li>Copy the key value (e.g., "AlbumKey":"ABC123xyz")</li>
                        <li>Paste just the key part (ABC123xyz) or the full URL here</li>
                      </ol>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSmugmugImport}
                    disabled={!smugmugUrl || importingFromSmugmug}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {importingFromSmugmug ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import Photos from SmugMug
                      </>
                    )}
                  </Button>

                  {extractingAddress && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-800">Extracting address from Google Maps link...</span>
                    </div>
                  )}

                  {importProgress && (
                    <div className={`p-3 rounded ${
                      importProgress.includes('✓') ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-sm ${
                        importProgress.includes('✓') ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {importProgress}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                {images.length} / 10 minimum images uploaded
              </p>
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded Images: {images.length}
                    {images.length < 10 && (
                      <span className="text-red-600 ml-2">
                        (Need {10 - images.length} more)
                      </span>
                    )}
                    {images.length >= 10 && (
                      <span className="text-green-600 ml-2">✓ Minimum met</span>
                    )}
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
            disabled={loading || images.length < 10}
            className="bg-[#e11921] hover:bg-red-700"
          >
            {loading ? 'Adding Property...' : 'Add Property'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {images.length < 10 && (
          <p className="text-sm text-red-600">
            * Please upload at least 10 images before submitting
          </p>
        )}
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
