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
import { supabase, albumKeyExists } from '@/lib/supabase';
import { uploadMultipleImages } from '@/lib/s3-upload';
import { getAddressFromGoogleMapsLink } from '@/lib/google-maps-utils';
import { normalizeUrl } from '@/lib/url-utils';
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

export default function AddPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBulkImport = searchParams.get('bulk_import') === 'true';
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [gridIndices, setGridIndices] = useState<number[]>([]);
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
  const autocompleteRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0, status: '' });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [propertyTags, setPropertyTags] = useState<string[]>([]);
  const [importQueue, setImportQueue] = useState<any[]>([]);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
  const [loadingQueueImages, setLoadingQueueImages] = useState(false);
  const [extractingAddress, setExtractingAddress] = useState(false);
  const [aiGenerateContent, setAiGenerateContent] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [formData, setFormData] = useState({
    real_name: '', // The actual property name (admin only)
    public_name: '', // Public-facing display name
    sub_heading: '', // Custom sub-heading for the property
    description: '',
    address: '',
    city: '',
    state: 'Texas',
    zipcode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    albumkey: null as string | null,
    category_id: '',
    is_featured: false,
    is_exclusive: false,
  });

  const [contacts, setContacts] = useState<Contact[]>([
    { name: '', cell_number: '', home_number: '', office_number: '', email: '' },
    { name: '', cell_number: '', home_number: '', office_number: '', email: '' }
  ]);

  const [notes, setNotes] = useState('');

  // Initialize everything on mount
  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchCategories(),
        fetchSearchFilterTags()
      ]);

      checkSmugMugAuth();

      // Handle bulk import - wait for tags to load
      if (isBulkImport) {
        setTimeout(() => {
          loadBulkImportQueue();
        }, 1000);
      }
    };

    initializePage();

    // Handle SmugMug auth callbacks
    const params = new URLSearchParams(window.location.search);
    if (params.get('smugmug_auth') === 'success') {
      console.log('✓ Authorization success detected');
      setSmugmugAuthorized(true);
      setAuthorizing(false);
      setCheckingAuth(false);
      alert('✓ SmugMug authorized successfully!');

      const newParams = new URLSearchParams(params);
      newParams.delete('smugmug_auth');
      window.history.replaceState({}, '', '/admin/properties/add');
    }

    if (params.get('error')) {
      const error = params.get('error');
      alert('Authorization failed: ' + error);
      setAuthorizing(false);
      setCheckingAuth(false);
    }
  }, [isBulkImport]);

  // Auto-refresh session every 5 minutes while on this page
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      console.log('🔄 [Property Add] Auto-refreshing session...');
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ Session refresh failed:', error);
        clearInterval(refreshInterval);
        alert('Your session has expired. Please save your work and login again.');
      } else {
        console.log('✅ Session refreshed');
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Auto-update gridIndices when images change
  useEffect(() => {
    if (gridIndices.length === 0 && images.length > 0) {
      // Initialize with first 6 images
      const initialIndices = images.slice(0, 6).map((_, i) => i);
      setGridIndices(initialIndices);
    } else if (images.length < gridIndices.length) {
      // Remove indices that are out of bounds
      setGridIndices(prev => prev.filter(i => i < images.length));
    }
  }, [images.length]);

  async function loadBulkImportQueue() {
    console.log('📋 Loading bulk import queue...');

    try {
      const queueData = localStorage.getItem('sgs_import_queue');
      const currentIdx = localStorage.getItem('sgs_import_current_index');

      if (queueData) {
        const queue = JSON.parse(queueData);
        const index = parseInt(currentIdx || '0');

        console.log(`Found ${queue.length} albums to import, currently at index ${index}`);

        setImportQueue(queue);
        setCurrentImportIndex(index);

        if (index < queue.length) {
          // CRITICAL: Ensure tags are loaded before importing
          console.log('⏳ Ensuring tags are loaded before import...');

          let tagsToUse = availableTags;
          if (tagsToUse.length === 0) {
            console.log('📊 Tags not loaded yet, fetching now...');
            tagsToUse = await fetchSearchFilterTags();

            // Wait a moment for state to update
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          console.log(`✓ Tags ready: ${tagsToUse.length} tags available`);

          // Load the current album data
          const album = queue[index];
          console.log('🎬 Loading album:', album.name || album.Name);

          // Set form data from album
          setFormData(prev => ({
            ...prev,
            name: album.name || album.Name || '',
            description: album.description || album.Description || '',
            city: album.location?.city || '',
            state: album.location?.state || 'Texas',
            albumkey: album.albumKey || album.AlbumKey || null,
          }));

          // If album has Google Maps link, extract address
          if (album.googleMapsLink) {
            console.log('📍 Found Google Maps link in album metadata');
            setExtractingAddress(true);

            const address = await getAddressFromGoogleMapsLink(album.googleMapsLink);

            if (address) {
              console.log('✓ Address extracted:', address.fullAddress);
              setFormData(prev => ({
                ...prev,
                address: address.streetAddress || '',
                city: address.city || prev.city,
                state: address.state || prev.state,
                zipcode: address.zipCode || ''
              }));
            }
            setExtractingAddress(false);
          }

          // Re-initialize Google Autocomplete after address is populated
          setTimeout(() => {
            initializeGoogleAutocomplete();
          }, 1000);

          // IMPORTANT: Process the album with tags available
          if (album.albumKey) {
            console.log('📸 Auto-importing album with key:', album.albumKey);
            setSmugmugUrl(album.albumKey);

            // Call the import with tags ready
            setTimeout(async () => {
              await handleSmugmugImportForBulk(album.albumKey, tagsToUse);
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error loading import queue:', error);
    }
  }

  async function handleSmugmugImportForBulk(albumKey: string, tagsForAnalysis?: FilterTag[]) {
    console.log('🚀 Starting bulk import for album:', albumKey);

    setImportingFromSmugmug(true);
    setImportProgress(`📡 Importing from album: ${albumKey}...`);

    try {
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
        } else if (data.skipped && response.status === 409) {
          alert('⚠️ This SmugMug album has already been imported. Each album can only be imported once.');
        } else {
          console.error(`Import failed: ${data.error || 'Unknown error'}`);
        }
        setImportProgress('');
        setImportingFromSmugmug(false);
        return;
      }

      const imported = data.imported || 0;
      const imageUrls = data.uploadedUrls || data.urls || [];

      console.log('Imported URLs:', imageUrls);

      if (imported > 0 && imageUrls.length > 0) {
        const fullUrls = imageUrls.map((url: string) => normalizeUrl(url));

        console.log('✓ Normalized URLs:', fullUrls.length);

        setImportProgress(`Successfully imported ${imported} images. Analyzing with AI...`);
        setAnalyzingImages(true);

        const importedImages: ImageWithTags[] = [];

        for (const url of fullUrls) {
          importedImages.push({ url, tags: [], isSmugmug: true });
        }

        // Use the tags that were passed in or the current state
        const tagsToUse = tagsForAnalysis || availableTags;

        console.log(`🔍 Starting analysis with ${tagsToUse.length} tags`);

        if (tagsToUse.length > 0) {
          for (let i = 0; i < importedImages.length; i++) {
            console.log(`\n📸 Analyzing image ${i + 1}/${importedImages.length}`);

            const suggestedTags = await analyzeImageAndTag(
              importedImages[i].url,
              i,
              importedImages.length,
              tagsToUse // Pass tags explicitly to the function
            );

            importedImages[i].tags = suggestedTags;
            console.log(`✓ Image ${i + 1} tagged with ${suggestedTags.length} tags`);
          }
        } else {
          console.warn('⚠️ No tags available, skipping analysis');
        }

        setImages(prev => {
          const updated = [...prev, ...importedImages];
          // Auto-sync photo tags to property tags
          setTimeout(() => syncPhotoTagsToProperty(updated), 0);
          return updated;
        });
        setImportProgress(`✓ Imported and analyzed ${imported} images`);
        setAnalyzingImages(false);

        // Auto-set first image as primary
        if (importedImages.length > 0) {
          setSelectedImageIndex(0);
        }

        setTimeout(() => {
          setImportProgress('');
          setSmugmugUrl('');
        }, 2000);
      } else {
        setImportProgress('No images found in album');
        setTimeout(() => {
          setImportProgress('');
        }, 2000);
      }
    } catch (error: any) {
      console.error('SmugMug import error:', error);
      setImportProgress('');
    } finally {
      setImportingFromSmugmug(false);
      setAnalyzingImages(false);
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

  async function checkSmugMugAuth() {
    console.log('🔍 Checking SmugMug authorization status...');
    try {
      const response = await fetch('/api/smugmug/check-auth');
      const data = await response.json();

      console.log('Authorization status:', data);
      setSmugmugAuthorized(data.authorized);
    } catch (error) {
      console.error('Error checking SmugMug auth:', error);
      setSmugmugAuthorized(false);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleAuthorizeSmugMug() {
    setAuthorizing(true);
    try {
      const response = await fetch('/api/smugmug/request-token');
      const data = await response.json();

      if (data.authorizeUrl) {
        window.location.href = data.authorizeUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      alert('Failed to start authorization process');
      setAuthorizing(false);
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

  // Sync photo tags to property tags
  function syncPhotoTagsToProperty(images: ImageWithTags[]) {
    // Collect all unique tags from all images
    const allPhotoTags = new Set<string>();

    console.log(`🔄 Syncing tags from ${images.length} images`);
    images.forEach((image, idx) => {
      console.log(`  Image ${idx + 1}: ${image.tags.length} tags - ${image.tags.join(', ')}`);
      image.tags.forEach(tag => {
        allPhotoTags.add(tag);
      });
    });

    // Add these tags to property tags (avoiding duplicates)
    setPropertyTags(prev => {
      const combined = new Set([...prev, ...Array.from(allPhotoTags)]);
      const result = Array.from(combined);
      console.log(`✓ Synced ${allPhotoTags.size} unique tags from photos to property`);
      console.log(`✓ Total property tags now: ${result.length}`);
      console.log(`✓ Property tags: ${result.join(', ')}`);
      return result;
    });
  }

  // Initialize Google Autocomplete
  function initializeGoogleAutocomplete() {
    const addressInput = addressInputRef.current || document.querySelector('input[name="address"]') as HTMLInputElement;

    if (!addressInput) {
      console.log('⚠️ Address input not found');
      return;
    }

    // Check if Google Maps is loaded
    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places) {
      console.log('⚠️ Google Maps not loaded yet, will retry...');
      // Retry after a short delay
      setTimeout(() => initializeGoogleAutocomplete(), 500);
      return;
    }

    // Clean up existing autocomplete instance if it exists
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

        // Extract coordinates from geometry
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

      // Store the instance in ref
      autocompleteRef.current = autocomplete;
      addressInput.setAttribute('data-autocomplete-initialized', 'true');
      console.log('✅ Google Autocomplete initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }
  }

  // SIMPLIFIED analyze function - no waiting logic
  async function analyzeImageAndTag(imageUrl: string, imageIndex: number, totalImages: number, tagsToUse?: FilterTag[]): Promise<string[]> {
    try {
      const tags = tagsToUse || availableTags;

      console.log(`\n🤖 Starting analysis for image ${imageIndex + 1}/${totalImages}`);
      console.log('  Image URL:', imageUrl.substring(0, 80) + '...');

      // Just check if tags are available, don't wait
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

    // Get fresh tags if needed
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

      // Analyze with the tags we have
      setAnalysisProgress({ current: 0, total: files.length, status: 'Starting AI analysis...' });

      for (let i = 0; i < newImages.length; i++) {
        const suggestedTags = await analyzeImageAndTag(newImages[i].url, i, files.length, tagsToUse);
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

  function extractAlbumKey(url: string): string | null {
    const albumKeyMatch = url.match(/\/([A-Za-z0-9]+)$/);
    return albumKeyMatch ? albumKeyMatch[1] : url.trim() || null;
  }

  async function handleSmugmugImport() {
    if (!smugmugUrl.trim()) {
      alert('Please enter a SmugMug album URL or key');
      return;
    }

    // Get fresh tags if needed
    let tagsToUse = availableTags;
    if (tagsToUse.length === 0) {
      console.log('⏳ No tags available, loading...');
      tagsToUse = await fetchSearchFilterTags();
      if (tagsToUse.length === 0) {
        alert('Failed to load tags. Please refresh the page and try again.');
        return;
      }
    }

    setImportingFromSmugmug(true);
    setImportProgress('🔍 Extracting album key...');

    try {
      let albumKey = extractAlbumKey(smugmugUrl);

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
        } else if (data.skipped && response.status === 409) {
          alert('⚠️ This SmugMug album has already been imported. Each album can only be imported once.');
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
        const fullUrls = imageUrls.map((url: string) => normalizeUrl(url));

        console.log('✓ Normalized URLs:', fullUrls.length);

        setImportProgress(`Successfully imported ${imported} images. Analyzing with AI...`);
        setAnalyzingImages(true);

        const importedImages: ImageWithTags[] = [];

        for (const url of fullUrls) {
          importedImages.push({ url, tags: [], isSmugmug: true });
        }

        // Analyze images with the tags we have
        for (let i = 0; i < importedImages.length; i++) {
          const suggestedTags = await analyzeImageAndTag(importedImages[i].url, i, importedImages.length, tagsToUse);
          importedImages[i].tags = suggestedTags;
        }

        setImages(prev => {
          const updated = [...prev, ...importedImages];
          // Auto-sync photo tags to property tags
          setTimeout(() => syncPhotoTagsToProperty(updated), 0);
          return updated;
        });
        setImportProgress(`✓ Imported and analyzed ${imported} images`);
        setAnalyzingImages(false);

        // Try to get album metadata
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

              // Handle Google Maps link if present
              if (metadata.location?.googleMapsLink) {
                console.log('📍 Found Google Maps link:', metadata.location.googleMapsLink);
                setExtractingAddress(true);
                setImportProgress('Found Google Maps link, extracting address...');

                const address = await getAddressFromGoogleMapsLink(metadata.location.googleMapsLink);

                if (address) {
                  console.log('✓ Address extracted:', address);

                  setFormData(prev => ({
                    ...prev,
                    address: address.streetAddress || prev.address,
                    city: address.city || prev.city,
                    state: address.state || prev.state,
                    zipcode: address.zipCode || prev.zipcode
                  }));

                  setImportProgress('✓ Address extracted successfully');
                } else {
                  console.log('❌ Could not extract address from Google Maps link');
                  setImportProgress('⚠️ Could not extract address');
                }
                setExtractingAddress(false);
              }
            }
          }
        } catch (metadataError) {
          console.log('Could not fetch metadata:', metadataError);
        }

        setTimeout(() => {
          setImportProgress('');
          setSmugmugUrl('');
        }, 3000);
      } else {
        setImportProgress('No images found in album');
        setTimeout(() => {
          setImportProgress('');
        }, 3000);
      }
    } catch (error: any) {
      console.error('SmugMug import error:', error);
      alert(`Import error: ${error.message}`);
      setImportProgress('');
    } finally {
      setImportingFromSmugmug(false);
      setAnalyzingImages(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields
    if (!formData.real_name || !formData.address || !formData.city) {
      alert('Please fill in all required fields (Real Property Name, Address, City)');
      return;
    }

    // Validate public_name and sub-heading (only if NOT using AI generation)
    if (!aiGenerateContent) {
      if (!formData.public_name || !formData.public_name.trim()) {
        alert('Please provide a public name for this property');
        return;
      }
      if (!formData.sub_heading || !formData.sub_heading.trim()) {
        alert('Please provide a sub-heading for this property');
        return;
      }
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

    // Contacts are optional - no validation needed

    setLoading(true);

    try {
      // Get current session (already being refreshed automatically)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Your session has expired. Please login again.');
        router.push('/admin/login');
        return;
      }

      // Check for duplicate albumkey if present
      if (formData.albumkey) {
        console.log('🔍 Checking for duplicate albumkey:', formData.albumkey);
        const isDuplicate = await albumKeyExists(formData.albumkey);

        if (isDuplicate) {
          alert(`❌ This SmugMug album has already been imported!\n\nAlbumKey: ${formData.albumkey}\n\nSkipping to next property...`);

          // If in bulk import mode, move to next property
          if (isBulkImport && currentImportIndex < importQueue.length - 1) {
            moveToNextProperty();
          } else {
            setLoading(false);
          }
          return;
        }
        console.log('✓ No duplicate found, proceeding with import');
      }

      // Reorder images: grid images first, then the rest
      const gridImages = gridIndices.slice(0, 6).map(i => images[i]);
      const nonGridImages = images.filter((_, i) => !gridIndices.slice(0, 6).includes(i));
      const reorderedImages = [...gridImages, ...nonGridImages];

      // Get the selected category name
      const selectedCategory = categories.find(c => c.id === formData.category_id);

      // Generate property name using category-based sequential numbering
      const { data: nameResult, error: nameError } = await (supabase as any)
        .rpc('get_next_property_name', { cat_id: formData.category_id });

      if (nameError || !nameResult) {
        console.error('Error generating property name:', nameError);
        alert('Failed to generate property name. Please try again.');
        return;
      }

      const propertyName = nameResult;
      console.log(`🔒 Generated property name: "${formData.real_name}" → "${propertyName}"`);

      // Generate AI content if enabled
      let finalPublicName = formData.public_name;
      let finalSubHeading = formData.sub_heading;
      let finalDescription = formData.description;

      if (aiGenerateContent) {
        console.log('🤖 Generating AI content...');
        setGeneratingContent(true);

        try {
          // Get selected category name
          const selectedCategory = categories.find(c => c.id === formData.category_id);

          // Prepare grid image URLs (first 6 images)
          const gridImages = gridIndices.slice(0, 6).map(i => images[i]);
          const gridImageUrls = gridImages.map(img => img.url).filter(Boolean);

          const response = await fetch('/api/generate-property-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyName: formData.real_name,
              categoryName: selectedCategory?.name || '',
              subCategoryName: '', // Sub-category not used in add form yet
              city: formData.city,
              address: formData.address,
              propertyTags: propertyTags,
              gridImageUrls: gridImageUrls,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate AI content');
          }

          const data = await response.json();

          if (data.success) {
            finalPublicName = data.public_name;
            finalSubHeading = data.sub_heading;
            finalDescription = data.description;
            console.log('✓ AI content generated');
            console.log('Public name:', finalPublicName);
            console.log('Tokens used:', data.tokensUsed);
          } else {
            throw new Error(data.error || 'AI generation failed');
          }

        } catch (error: any) {
          console.error('AI content generation error:', error);
          alert(`Failed to generate AI content: ${error.message}\n\nPlease disable AI generation and enter content manually.`);
          setGeneratingContent(false);
          setLoading(false);
          return;
        } finally {
          setGeneratingContent(false);
        }
      }

      // Prepare property data with CORRECT schema
      const propertyData: any = {
        name: propertyName, // Category-based sequential name (e.g., COM-0001)
        real_name: formData.real_name, // Actual property name (admin-facing)
        public_name: finalPublicName, // Public display name (AI-generated or manual)
        sub_heading: finalSubHeading, // Use AI-generated or manual
        description: finalDescription || '', // Use AI-generated or manual
        address: formData.address,
        city: formData.city,
        county: formData.state, // Map state to county field
        zipcode: formData.zipcode || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        albumkey: formData.albumkey,
        is_featured: formData.is_featured,
        is_exclusive: formData.is_exclusive,
        status: 'active',
        property_type: 'Residential',
        category_id: formData.category_id, // Main category ID for naming
        // Use categories ARRAY for backward compatibility
        categories: selectedCategory ? [selectedCategory.name] : [],
        // Add property-level tags
        property_tags: propertyTags,
        // Set primary_image to first grid image
        primary_image: reorderedImages[0]?.url || null,
        // Set images array with reordered images
        images: reorderedImages.map(img => img.url),
        features: [],
        permits_available: false,
        daily_rate: '0',
        // Add contacts
        contacts: contacts,
        // Add notes
        notes: notes
      };

      console.log('Submitting property data:', propertyData);

      // Insert property
      const { data: property, error: propertyError } = await (supabase
        .from('properties') as any)
        .insert([propertyData])
        .select()
        .single();

      if (propertyError) {
        console.error('Property insert error:', propertyError);
        throw new Error(propertyError.message);
      }

      console.log('✓ Property created:', property.id);

      // Insert images with tags - grid images get display_order 0-5
      const imageRecords = reorderedImages.map((img, index) => ({
        property_id: property.id,
        image_url: img.url,
        display_order: index,
        tags: img.tags || []
      }));

      const { error: imagesError } = await (supabase
        .from('property_images') as any)
        .insert(imageRecords);

      if (imagesError) {
        console.error('Images insert error:', imagesError);
        throw new Error(imagesError.message);
      }

      console.log(`✓ Inserted ${imageRecords.length} images with tags`);

      alert('✓ Property created successfully!');

      // Check if there are more properties in the bulk import queue
      if (isBulkImport && currentImportIndex < importQueue.length - 1) {
        moveToNextProperty();
      } else if (isBulkImport) {
        // Queue is complete
        localStorage.removeItem('sgs_import_queue');
        localStorage.removeItem('sgs_import_current_index');
        alert('✓ All properties imported successfully!');
        router.push('/admin/properties');
      } else {
        // Single property add
        router.push('/admin/properties');
      }

    } catch (error: any) {
      console.error('Error creating property:', error);
      alert('Error creating property: ' + error.message);
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
          // Initialize autocomplete after script loads
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
            <label className="block text-sm font-medium mb-2">
              Real Property Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="real_name"
              value={formData.real_name}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Admin-facing property name (e.g., "Quicktrip Alliance")
            </p>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Public Name <span className="text-red-500">*</span>
              {aiGenerateContent && (
                <span className="ml-2 text-sm text-blue-600 font-normal">
                  (AI will generate)
                </span>
              )}
            </label>
            <Input
              name="public_name"
              value={formData.public_name}
              onChange={handleInputChange}
              maxLength={30}
              required={!aiGenerateContent}
              disabled={aiGenerateContent}
              className={aiGenerateContent ? "bg-gray-100 cursor-not-allowed" : ""}
            />
            <p className="text-xs text-gray-500 mt-1">
              {aiGenerateContent
                ? "AI will generate a catchy public name (max 30 chars)"
                : "Public-facing display name shown on the website (max 30 characters)"}
            </p>
          </div>

          <div className="col-span-2 mb-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h3 className="font-medium text-blue-900">AI Content Generation</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Let AI generate sub-heading and description based on property details and images
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiGenerateContent}
                  onChange={(e) => setAiGenerateContent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Sub-heading <span className="text-red-500">*</span>
              {aiGenerateContent && (
                <span className="ml-2 text-sm text-blue-600 font-normal">
                  (AI will generate)
                </span>
              )}
            </label>
            <Input
              name="sub_heading"
              value={formData.sub_heading}
              onChange={handleInputChange}
              maxLength={200}
              required={!aiGenerateContent}
              disabled={aiGenerateContent}
              className={aiGenerateContent ? "bg-gray-100 cursor-not-allowed" : ""}
            />
            <p className="text-xs text-gray-500 mt-1">
              {aiGenerateContent
                ? "AI will analyze property details and images to create an engaging sub-heading"
                : "Custom sub-heading displayed on the property detail page"}
            </p>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Description
              {aiGenerateContent && (
                <span className="ml-2 text-sm text-blue-600 font-normal">
                  (AI will generate)
                </span>
              )}
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              disabled={aiGenerateContent}
              className={aiGenerateContent ? "bg-gray-100 cursor-not-allowed" : ""}
            />
            {aiGenerateContent && (
              <p className="text-xs text-blue-600 mt-1">
                AI will create a detailed, engaging description based on all property information
              </p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address *</label>
            <input
              ref={addressInputRef}
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand"
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">State *</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand"
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
                  className="w-5 h-5 text-brand border-gray-300 rounded focus:ring-brand"
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
                  className="w-5 h-5 text-brand border-gray-300 rounded focus:ring-brand"
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
                          className="text-brand hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <Input
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cell Number</label>
                        <Input
                          type="tel"
                          value={contact.cell_number}
                          onChange={(e) => updateContact(index, 'cell_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Home Number</label>
                        <Input
                          type="tel"
                          value={contact.home_number}
                          onChange={(e) => updateContact(index, 'home_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Office Number</label>
                        <Input
                          type="tel"
                          value={contact.office_number}
                          onChange={(e) => updateContact(index, 'office_number', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOTES SECTION */}
          <div className="col-span-2 border-t pt-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Internal notes for admin use only (not visible on website)
                </p>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                  <span className="px-3 py-1 bg-brand text-white text-sm font-medium rounded-full">
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
                      className="text-xs text-brand hover:text-brand-hover font-medium"
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
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm rounded-full"
                        >
                          {tag?.filter_name && (
                            <span className="opacity-75 text-xs">{tag.filter_name}:</span>
                          )}
                          <span className="font-medium">{tagName}</span>
                          <button
                            type="button"
                            onClick={() => setPropertyTags(prev => prev.filter(t => t !== tagName))}
                            className="hover:bg-brand-hover rounded-full p-0.5 transition-colors"
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
                            <span className="px-2 py-0.5 bg-brand text-white text-xs font-medium rounded-full">
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
                                      ? 'bg-brand text-white border-brand shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-brand hover:text-brand'
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
                      onClick={handleAuthorizeSmugMug}
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
              Property Images * (Minimum 6 images required for grid display)
            </label>

            <div className="mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-brand-hover hover:file:bg-red-100"
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
                    className="text-sm text-brand hover:text-brand-hover"
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
                                            className="rounded text-brand focus:ring-red-500"
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
            disabled={loading}
            className="bg-brand hover:bg-brand-hover"
          >
            {loading ? 'Adding Property...' : 'Add Property'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* AI Content Generation Modal */}
      {generatingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
              <div>
                <h3 className="text-lg font-semibold">Generating AI Content...</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Analyzing property details and images to create compelling content
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Progress Modal */}
      {analyzingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
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
                      className="bg-brand h-2 rounded-full transition-all duration-300"
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
