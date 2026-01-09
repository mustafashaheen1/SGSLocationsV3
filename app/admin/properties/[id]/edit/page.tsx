declare global {
  interface Window {
    google: any;
  }
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, Upload, X, Camera, Tag, ChevronDown, ChevronLeft, Eye, Download, Calendar as CalendarIcon, User, Image as ImageIcon, FileText, Trash2, Folder, FolderOpen, Plus, Edit2, MessageSquare, Send, AlertCircle, CheckCircle, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages, deleteImageFromS3, uploadDocumentToS3, deleteDocumentFromS3 } from '@/lib/s3-upload';
import { GridPreview } from '@/components/admin/GridPreview';
import { generateObfuscatedName } from '@/lib/name-obfuscator';
import PropertyCalendar from '@/components/PropertyCalendar';
import PropertyInquiriesTab from '@/components/admin/PropertyInquiriesTab';

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

  // Get tab from URL query parameter
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const tabParam = searchParams.get('tab') as 'details' | 'images' | 'calendar' | 'contacts' | 'documents' | 'inquiries' | 'terms' | null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
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
  const [generatingContent, setGeneratingContent] = useState(false);
  const [formData, setFormData] = useState({
    name: '', // Obfuscated public name (readonly in edit mode)
    real_name: '', // Actual property name (editable)
    sub_heading: '', // Custom sub-heading for the property
    description: '',
    address: '',
    city: '',
    state: 'Texas',
    zipcode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    category_id: '',
    sub_category_id: '',
    is_featured: false,
    is_exclusive: false,
    albumkey: '',
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

  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'calendar' | 'contacts' | 'documents' | 'inquiries' | 'terms'>(
    tabParam && ['details', 'images', 'calendar', 'contacts', 'documents', 'inquiries', 'terms'].includes(tabParam) ? tabParam : 'details'
  );

  const [isAdminProperty, setIsAdminProperty] = useState<boolean>(true); // Track if property is admin-owned (no owner_id)

  // Projects and Documents state
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>>([]);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Terms and Conditions state
  const [existingTerms, setExistingTerms] = useState<{
    type: 'text' | 'pdf' | null;
    content: string | null;
    pdfUrl: string | null;
    sentAt: string | null;
    sentBy: string | null;
  }>({
    type: null,
    content: null,
    pdfUrl: null,
    sentAt: null,
    sentBy: null
  });
  const [termsType, setTermsType] = useState<'text' | 'pdf'>('text');
  const [termsContent, setTermsContent] = useState('');
  const [termsPdfFile, setTermsPdfFile] = useState<File | null>(null);
  const [sendingTerms, setSendingTerms] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchCategories(),
        fetchSearchFilterTags(),
        fetchProperty(),
        fetchProjects()
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
          const { error } = await (supabase
            .from('properties') as any)
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
      const prop = property as any;

      // Check if this is an admin property (no owner_id) or user property
      const isAdminOwned = !prop.owner_id;
      setIsAdminProperty(isAdminOwned);

      setFormData({
        name: prop.name || '',
        real_name: prop.real_name || prop.name || '', // Fallback to name if real_name doesn't exist yet
        sub_heading: prop.sub_heading || '',
        description: prop.description || '',
        address: prop.address || '',
        city: prop.city || '',
        state: prop.county || 'Texas', // county field is used for state
        zipcode: prop.zipcode || '',
        latitude: prop.latitude,
        longitude: prop.longitude,
        category_id: prop.category_id || '', // Direct from DB, or will be set by useEffect
        sub_category_id: prop.sub_category_id || '', // Direct from DB, or will be set by useEffect
        is_featured: prop.is_featured || false,
        is_exclusive: prop.is_exclusive || false,
        albumkey: prop.albumkey || '',
      });

      setPropertyTags(prop.property_tags || []);

      // Store category name to match with category ID after categories load
      if (prop.categories?.[0]) {
        setPropertyCategoryName(prop.categories[0]);
      }

      // Load contacts or set default
      if (prop.contacts && prop.contacts.length >= 2) {
        setContacts(prop.contacts);
      } else {
        // Ensure at least 2 contacts
        setContacts([
          { name: '', cell_number: '', home_number: '', office_number: '', email: '' },
          { name: '', cell_number: '', home_number: '', office_number: '', email: '' }
        ]);
      }

      // Load notes
      setNotes(prop.notes || '');

      // Fetch property stats
      const viewCount = prop.view_count || 0;

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
      const loadedImages: ImageWithTags[] = (propertyImages || []).map((img: any) => ({
        url: img.image_url,
        tags: img.tags || [],
        isSmugmug: false
      }));

      setImages(loadedImages);

      // Set grid indices (first 6 images)
      const initialGrid = loadedImages.slice(0, 6).map((_, i) => i);
      setGridIndices(initialGrid);

      // Load terms and conditions data
      setExistingTerms({
        type: prop.terms_type || null,
        content: prop.terms_content || null,
        pdfUrl: prop.terms_pdf_url || null,
        sentAt: prop.terms_sent_at || null,
        sentBy: prop.terms_sent_by || null
      });

      // Fetch owner information if property has an owner
      if (prop.owner_id) {
        // Get session for auth token
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Use directFetch with auth token to bypass RLS issues
          const { directFetch } = await import('@/lib/supabase');
          const { data: owner, error: ownerError } = await directFetch('users', {
            select: 'email,full_name',
            eq: { id: prop.owner_id },
            single: true,
            authToken: session.access_token
          });

          if (!ownerError && owner) {
            setOwnerInfo({
              email: (owner as any).email,
              name: (owner as any).full_name || 'Property Owner'
            });
          }
        }
      }

    } catch (error: any) {
      console.error('Error fetching property:', error);
      alert('Error loading property: ' + error.message);
      router.push('/admin/properties');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    const { data, error} = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (!error && data) {
      setCategories(data);

      // Separate main categories (parent_id is null) and sub-categories (parent_id is not null)
      const mainCats = data.filter((cat: any) => !cat.parent_id);
      const subCats = data.filter((cat: any) => cat.parent_id);

      setMainCategories(mainCats);
      setSubCategories(subCats);
    }
  }

  async function fetchProjects() {
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        return;
      }

      // Use directFetch with auth token to bypass RLS issues
      const { directFetch } = await import('@/lib/supabase');
      const { data, error } = await directFetch('property_projects', {
        select: '*',
        eq: { property_id: propertyId },
        order: 'created_at',
        authToken: session.access_token
      });

      if (error) throw error;

      // Sort by created_at descending
      const sortedData = (data as any[])?.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setProjects(sortedData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function fetchDocuments(projectId: string) {
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        return;
      }

      // Use directFetch with auth token to bypass RLS issues
      const { directFetch } = await import('@/lib/supabase');
      const { data, error } = await directFetch('documents', {
        select: '*',
        eq: { project_id: projectId },
        order: 'created_at',
        authToken: session.access_token
      });

      if (error) throw error;

      // Sort by created_at descending
      const sortedData = (data as any[])?.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setDocuments(sortedData || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();

      if (!session) {
        alert('No active session. Please log in again.');
        return;
      }

      // Use REST API directly with admin auth token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/property_projects`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            property_id: propertyId,
            name: newProjectName.trim(),
            created_by: user?.id
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      setNewProjectName('');
      setShowNewProjectModal(false);
      await fetchProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + error.message);
    }
  }

  async function handleDeleteProject(project: any) {
    if (!confirm(`Are you sure you want to delete project "${project.name}"? This will also delete all documents in this project.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('property_projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setDocuments([]);
      }

      await fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    }
  }

  function handleSelectProject(project: any) {
    setSelectedProject(project);
    fetchDocuments(project.id);
  }

  async function handleDocumentUpload(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;

    if (!selectedProject) {
      alert('Please select a project folder first');
      return;
    }

    const fileArray = Array.from(files);
    setUploadingDocuments(true);

    // Initialize progress tracking for all files
    const initialProgress = fileArray.map(file => ({
      name: file.name,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploadingFiles(initialProgress);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Upload files sequentially to track progress accurately
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      try {
        // Update progress: Starting upload
        setUploadingFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 10, status: 'uploading' as const } : f
        ));

        // Upload to S3
        const fileUrl = await uploadDocumentToS3(file, propertyId);

        // Update progress: Upload complete, saving to database
        setUploadingFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 70, status: 'uploading' as const } : f
        ));

        // Save to database
        const { error } = await (supabase
          .from('documents') as any)
          .insert([{
            project_id: selectedProject.id,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            file_url: fileUrl,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            document_type: file.type.split('/')[1] || 'other',
            uploaded_by: user?.id
          }]);

        if (error) throw error;

        // Update progress: Complete
        setUploadingFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 100, status: 'completed' as const } : f
        ));
      } catch (error: any) {
        console.error('Error uploading document:', error);
        setUploadingFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 0, status: 'error' as const, error: error.message } : f
        ));
      }
    }

    // Refresh documents list
    await fetchDocuments(selectedProject.id);

    // Clear progress after a delay
    setTimeout(() => {
      setUploadingFiles([]);
      setUploadingDocuments(false);
    }, 2000);
  }

  function handleDocumentInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleDocumentUpload(e.target.files);
    e.target.value = ''; // Clear input
  }

  function handleDocumentDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingDoc(false);

    const files = e.dataTransfer.files;
    handleDocumentUpload(files);
  }

  function handleDocumentDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingDoc(true);
  }

  function handleDocumentDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingDoc(false);
  }

  async function handleDeleteDocument(doc: any) {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      // Delete from S3
      await deleteDocumentFromS3(doc.file_url);

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      if (selectedProject) {
        await fetchDocuments(selectedProject.id);
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + error.message);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      // Check if AI photo analysis is enabled in settings
      const { data: aiSetting } = await (supabase
        .from('site_settings') as any)
        .select('value')
        .eq('key', 'ai_photo_analysis_enabled')
        .maybeSingle();

      let isAiEnabled = false;
      if (aiSetting && aiSetting.value !== null && aiSetting.value !== undefined) {
        const value = typeof aiSetting.value === 'string' ? JSON.parse(aiSetting.value) : aiSetting.value;
        isAiEnabled = value === true || value === 'true';
      }

      if (!isAiEnabled) {
        console.log(`⚙️ AI Photo Analysis is disabled - skipping analysis for image ${imageIndex + 1}/${totalImages}`);
        setAnalysisProgress({
          current: imageIndex + 1,
          total: totalImages,
          status: `Skipped AI analysis for image ${imageIndex + 1} (AI disabled)`
        });
        return [];
      }

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

  async function handleSendTerms() {
    if (!ownerInfo) {
      alert('No property owner found. This property does not have an owner assigned.');
      return;
    }

    if (termsType === 'text' && !termsContent.trim()) {
      alert('Please enter terms and conditions content');
      return;
    }

    if (termsType === 'pdf' && !termsPdfFile) {
      alert('Please select a PDF file');
      return;
    }

    if (!confirm(`Send terms and conditions to ${ownerInfo.email}?`)) {
      return;
    }

    setSendingTerms(true);

    try {
      let pdfUrl = null;

      // Upload PDF if selected
      if (termsType === 'pdf' && termsPdfFile) {
        // Import uploadDocumentToS3 function
        const { uploadDocumentToS3 } = await import('@/lib/s3-upload');
        pdfUrl = await uploadDocumentToS3(termsPdfFile, propertyId);
      }

      // Send terms via API
      const response = await fetch('/api/send-property-terms-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          termsType,
          termsContent: termsType === 'text' ? termsContent : undefined,
          termsPdfUrl: termsType === 'pdf' ? pdfUrl : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send terms and conditions');
      }

      alert('Terms and conditions sent successfully!');

      // Refresh property data to show updated terms
      await fetchProperty();

      // Clear form
      setTermsContent('');
      setTermsPdfFile(null);

    } catch (error: any) {
      console.error('Error sending terms:', error);
      alert('Error sending terms and conditions: ' + error.message);
    } finally {
      setSendingTerms(false);
    }
  }

  async function handleGenerateAIContent() {
    if (!formData.real_name || !formData.city) {
      alert('Please fill in property name and city before generating AI content');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one image before generating AI content');
      return;
    }

    setGeneratingContent(true);

    try {
      console.log('🤖 Generating AI content...');

      // Get the selected category and sub-category names
      const selectedMainCategory = categories.find(c => c.id === formData.category_id);
      const selectedSubCategory = categories.find(c => c.id === formData.sub_category_id);

      // Prepare grid image URLs (first 6 images)
      const gridImages = gridIndices.slice(0, 6).map(i => images[i]);
      const gridImageUrls = gridImages.map(img => img.url).filter(Boolean);

      const response = await fetch('/api/generate-property-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: formData.real_name,
          categoryName: selectedMainCategory?.name || '',
          subCategoryName: selectedSubCategory?.name || '',
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
        // Update form data with AI-generated content
        setFormData(prev => ({
          ...prev,
          sub_heading: data.sub_heading,
          description: data.description
        }));

        console.log('✓ AI content generated');
        console.log('Tokens used:', data.tokensUsed);
        alert('AI content generated successfully! Review the sub-heading and description before saving.');
      } else {
        throw new Error(data.error || 'AI generation failed');
      }

    } catch (error: any) {
      console.error('AI content generation error:', error);
      alert(`Failed to generate AI content: ${error.message}`);
    } finally {
      setGeneratingContent(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.real_name || !formData.address || !formData.city) {
      alert('Please fill in all required fields (Real Property Name, Address, City)');
      return;
    }

    if (images.length < 6) {
      alert('Please upload at least 6 images for the property grid display');
      return;
    }

    // Validate sub-heading
    if (!formData.sub_heading || !formData.sub_heading.trim()) {
      alert('Please provide a sub-heading for this property');
      return;
    }

    // Validate contacts
    if (contacts.length < 2) {
      alert('At least 2 contacts are required');
      return;
    }

    // Contacts are optional - no validation needed

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

      // Get the selected category and sub-category names
      const selectedMainCategory = categories.find(c => c.id === formData.category_id);
      const selectedSubCategory = categories.find(c => c.id === formData.sub_category_id);

      // NOTE: Do NOT update the 'name' field when editing - it should remain as originally set
      // The 'name' field is the public-facing obfuscated name and should not change after creation

      // Prepare property data
      const propertyData: any = {
        // name: DO NOT UPDATE - keeps the original obfuscated name
        real_name: formData.real_name, // Actual property name (admin only)
        sub_heading: formData.sub_heading,
        description: formData.description || '',
        address: formData.address,
        city: formData.city,
        county: formData.state, // Map state to county field
        zipcode: formData.zipcode || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        category_id: formData.category_id || null,
        sub_category_id: formData.sub_category_id || null,
        is_featured: formData.is_featured,
        is_exclusive: formData.is_exclusive,
        // Include both main category and sub-category names in categories array
        categories: [
          selectedMainCategory?.name,
          selectedSubCategory?.name
        ].filter(Boolean), // Remove null/undefined values
        property_tags: propertyTags,
        primary_image: reorderedImages[0]?.url || null,
        images: reorderedImages.map(img => img.url),
        contacts: contacts,
        updated_at: new Date().toISOString()
      };

      // Only save albumkey for admin-owned properties
      if (isAdminProperty) {
        propertyData.albumkey = formData.albumkey || null;
      }

      console.log('Updating property data:', propertyData);

      // Update property
      const { error: propertyError } = await (supabase
        .from('properties') as any)
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

      const { error: imagesError } = await (supabase
        .from('property_images') as any)
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
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

      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Property Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'images'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images & Tags
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'contacts'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              Contacts & Notes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'inquiries'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'terms'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Terms & Conditions
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Property Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Real Property Name *
                    <span className="text-gray-500 text-xs ml-2">(Admin only - Actual property name)</span>
                  </label>
                  <Input
                    name="real_name"
                    value={formData.real_name}
                    onChange={handleInputChange}
                    placeholder="e.g., 4608 Alta Dr. or Dallas Medical Center"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Public Display Name
                    <span className="text-gray-500 text-xs ml-2">(Auto-generated - Not editable)</span>
                  </label>
                  <Input
                    value={formData.name}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    placeholder="Generated automatically from real name"
                  />
                </div>

                {/* Public URL - Read-only clickable link */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Public URL
                    <span className="text-gray-500 text-xs ml-2">(Visible to visitors)</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/property/${propertyId}`}
                      disabled
                      className="bg-gray-50 cursor-not-allowed pr-10 text-gray-700"
                    />
                    <a
                      href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgslocations.com'}/property/${propertyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Open public page in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This is the public URL where visitors can view this property
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Sub-heading <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="sub_heading"
                    value={formData.sub_heading}
                    onChange={handleInputChange}
                    placeholder="e.g., A Modern Architectural Marvel in Fort Worth"
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Custom sub-heading displayed on the property detail page
                  </p>
                </div>

                {/* Only show albumkey field for admin-owned properties */}
                {isAdminProperty && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      SmugMug Album Key
                      {formData.albumkey && <span className="text-gray-500 text-xs ml-2">(Read-only - Already set)</span>}
                    </label>
                    <Input
                      name="albumkey"
                      value={formData.albumkey}
                      onChange={handleInputChange}
                      placeholder={formData.albumkey ? "" : "Enter SmugMug album key if available"}
                      disabled={!!formData.albumkey}
                      className={formData.albumkey ? "bg-gray-100 cursor-not-allowed" : ""}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Description
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAIContent}
                      disabled={generatingContent || !formData.real_name || !formData.city || images.length === 0}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingContent ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Generate with AI
                        </>
                      )}
                    </button>
                  </div>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed property description..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Generate with AI" to automatically create sub-heading and description based on property details and images
                  </p>
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
                    placeholder="75201"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Main Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Reset sub-category when main category changes
                      setFormData(prev => ({ ...prev, sub_category_id: '' }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand"
                    required
                  >
                    <option value="">Select a main category</option>
                    {mainCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sub-Category *</label>
                  <select
                    name="sub_category_id"
                    value={formData.sub_category_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand"
                    required
                    disabled={!formData.category_id}
                  >
                    <option value="">Select a sub-category</option>
                    {subCategories
                      .filter((subCat: any) => subCat.parent_id === formData.category_id)
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  {!formData.category_id && (
                    <p className="text-xs text-gray-500 mt-1">Select a main category first</p>
                  )}
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
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Images & Tags Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div>
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

              {/* PROPERTY-LEVEL TAGS SECTION */}
              <div className="border-t pt-6">
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

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <PropertyCalendar propertyId={propertyId} />
            </div>
          )}

          {/* Contacts & Notes Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              {/* CONTACTS SECTION */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Contacts</h3>
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
                            placeholder="Contact name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            placeholder="email@example.com"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={addContact}
                  className="mt-4"
                >
                  Add Another Contact
                </Button>
              </div>

              {/* NOTES SECTION - AUTO-SAVES */}
              <div className="border-t pt-6">
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

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {!selectedProject ? (
                /* Project Folders List */
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Project Folders</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Organize documents into project folders
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewProjectModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New Project
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FolderOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">No project folders yet</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Create a project folder to organize your documents
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowNewProjectModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create First Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="group relative bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-brand hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => handleSelectProject(project)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Folder className="h-12 w-12 text-amber-500 group-hover:text-amber-600 transition-colors" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-brand hover:bg-red-50 rounded transition-all"
                              title="Delete Project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-brand transition-colors">
                            {project.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Created {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Selected Project - Documents View */
                <div>
                  {/* Back Button and Project Title */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(null);
                          setDocuments([]);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Back to Projects"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-amber-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Upload and manage documents for this project
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div
                    onDrop={handleDocumentDrop}
                    onDragOver={handleDocumentDragOver}
                    onDragLeave={handleDocumentDragLeave}
                    className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
                      isDraggingDoc
                        ? 'border-brand bg-red-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <label htmlFor="document-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-brand hover:text-brand-hover">
                          Click to upload documents
                        </span>
                        <span className="text-sm text-gray-600"> or drag and drop</span>
                        <input
                          id="document-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleDocumentInputChange}
                          disabled={uploadingDocuments}
                          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, Word, Excel, PowerPoint, or Text files (multiple files supported)
                      </p>
                    </div>
                  </div>

                  {/* Documents List */}
                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No documents in this project yet</p>
                      <p className="text-sm mt-1">Upload documents using the area above</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Documents ({documents.length})
                      </h4>
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <FileText className="h-8 w-8 text-gray-400" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{doc.title}</h4>
                              <p className="text-sm text-gray-500">
                                {doc.file_name} • {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(doc.file_url, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc)}
                              className="p-2 text-brand hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div>
              <PropertyInquiriesTab propertyId={propertyId} />
            </div>
          )}

          {/* Terms & Conditions Tab */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              {/* Owner Information Alert */}
              {!ownerInfo ? (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">No Property Owner</h4>
                      <p className="text-sm text-amber-800">
                        This property does not have an owner assigned. Terms and conditions can only be sent to properties with an assigned owner.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Property Owner</h4>
                      <p className="text-sm text-blue-800">
                        <strong>{ownerInfo.name}</strong> ({ownerInfo.email})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Terms Display */}
              {existingTerms.type && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Previously Sent Terms & Conditions</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Sent on {existingTerms.sentAt ? new Date(existingTerms.sentAt).toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full uppercase">
                      {existingTerms.type}
                    </span>
                  </div>

                  {existingTerms.type === 'text' && existingTerms.content && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Text Content:</p>
                      <div className="text-sm text-gray-900 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {existingTerms.content}
                      </div>
                    </div>
                  )}

                  {existingTerms.type === 'pdf' && existingTerms.pdfUrl && (
                    <div className="mt-4">
                      <a
                        href={existingTerms.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        View PDF Document
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Send New Terms Form */}
              {ownerInfo && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Send {existingTerms.type ? 'New' : ''} Terms & Conditions
                  </h3>

                  {/* Terms Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Terms Format
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setTermsType('text')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          termsType === 'text'
                            ? 'border-brand bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            termsType === 'text' ? 'border-brand' : 'border-gray-300'
                          }`}>
                            {termsType === 'text' && (
                              <div className="w-3 h-3 rounded-full bg-brand"></div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Text Content</p>
                            <p className="text-xs text-gray-600">Write terms directly in the email</p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTermsType('pdf')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          termsType === 'pdf'
                            ? 'border-brand bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            termsType === 'pdf' ? 'border-brand' : 'border-gray-300'
                          }`}>
                            {termsType === 'pdf' && (
                              <div className="w-3 h-3 rounded-full bg-brand"></div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">PDF Document</p>
                            <p className="text-xs text-gray-600">Upload a PDF file</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Conditional Input based on Terms Type */}
                  {termsType === 'text' ? (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Terms & Conditions Content *
                      </label>
                      <Textarea
                        value={termsContent}
                        onChange={(e) => setTermsContent(e.target.value)}
                        placeholder="Enter the terms and conditions that will be sent to the property owner..."
                        rows={12}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This content will be included in the email sent to the property owner
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF Document *
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer">
                          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            termsPdfFile
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}>
                            {termsPdfFile ? (
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                  {termsPdfFile.name}
                                </span>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                  Click to select PDF file
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== 'application/pdf') {
                                  alert('Please select a PDF file');
                                  e.target.value = '';
                                  return;
                                }
                                setTermsPdfFile(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {termsPdfFile && (
                          <button
                            type="button"
                            onClick={() => setTermsPdfFile(null)}
                            className="p-2 text-brand hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        The PDF will be uploaded to S3 and a download link will be included in the email
                      </p>
                    </div>
                  )}

                  {/* Send Button */}
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      onClick={handleSendTerms}
                      disabled={sendingTerms || (termsType === 'text' && !termsContent.trim()) || (termsType === 'pdf' && !termsPdfFile)}
                      className="bg-brand hover:bg-brand-hover flex items-center gap-2"
                    >
                      {sendingTerms ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Terms & Conditions
                        </>
                      )}
                    </Button>
                    {(termsContent || termsPdfFile) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setTermsContent('');
                          setTermsPdfFile(null);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Document Upload Progress Modal */}
      {uploadingFiles.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Uploading Documents</h3>
              <p className="text-sm text-gray-600">
                {uploadingFiles.filter(f => f.status === 'completed').length} of {uploadingFiles.length} completed
              </p>
            </div>

            <div className="space-y-4">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {file.status === 'uploading' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                      )}
                      {file.status === 'completed' && (
                        <div className="text-green-600">✓</div>
                      )}
                      {file.status === 'error' && (
                        <div className="text-brand">✗</div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {file.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        file.status === 'completed'
                          ? 'bg-green-600'
                          : file.status === 'error'
                          ? 'bg-brand'
                          : 'bg-brand'
                      }`}
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>

                  {/* Error Message */}
                  {file.error && (
                    <p className="text-xs text-brand mt-2">{file.error}</p>
                  )}

                  {/* Status Text */}
                  {file.status === 'uploading' && (
                    <p className="text-xs text-gray-500 mt-2">
                      {file.progress < 50 ? 'Uploading to S3...' : 'Saving to database...'}
                    </p>
                  )}
                  {file.status === 'completed' && (
                    <p className="text-xs text-green-600 mt-2">Upload complete</p>
                  )}
                </div>
              ))}
            </div>

            {!uploadingDocuments && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setUploadingFiles([])}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a name for this project folder
            </p>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g., Summer 2024 Production"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProjectName.trim()) {
                  handleCreateProject();
                }
              }}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
