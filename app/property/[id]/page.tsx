'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  Mail,
  Image as ImageIcon,
  Download,
  FileText,
  Search,
  Phone,
  Plus,
  X,
  Heart
} from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import { generateLocationPDF } from '@/lib/pdf-generator';
import { calculateDistance, formatDistance } from '@/lib/distance';
import ContactFormModal from '@/components/ContactFormModal';
import LoginModal from '@/components/LoginModal';

interface ImageWithCategory {
  url: string;
  categories: string[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Pool');
  const categoryTags = ['Pool', 'Jacuzzi', 'Hot Tub', 'Patio', 'Kitchen', 'Garden', 'Staircase', 'Gazebo', 'Living Room', 'Bathroom', 'Dining Room', 'Studio', 'Rooftop', 'Parking'];
  const categoryRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const [redBarPosition, setRedBarPosition] = useState({ left: '0px', width: '50px' });
  const [allImages, setAllImages] = useState<Array<{ url: string; categories: string[] }>>([]);
  const [displayedImages, setDisplayedImages] = useState<Array<{ url: string; categories: string[] }>>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  // Footer content from database
  const [footerPhone, setFooterPhone] = useState('(310) 871-8004');
  const [footerPartnerText, setFooterPartnerText] = useState('American Express Preferred Partner');
  const [footerLicense, setFooterLicense] = useState('CalDRE #01234567');
  const [footerCompanyName, setFooterCompanyName] = useState('Image Locations');

  const updateRedBarPosition = (category: string) => {
    const element = categoryRefs.current[category];

    if (element) {
      const rect = element.getBoundingClientRect();
      setRedBarPosition({
        left: `${rect.left}px`,
        width: `${rect.width}px`
      });
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    updateRedBarPosition(category);

    setViewMode('carousel');

    const filteredImages = allImages.filter(img => img.categories.includes(category));
    setDisplayedImages(filteredImages);

    setCurrentImageIndex(0);

    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  // Fetch user type on component mount
  useEffect(() => {
    async function fetchUserType() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setUserType(null);
          return;
        }

        const { data: userData, error } = await (supabase
          .from('users') as any)
          .select('user_type')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user type:', error);
          return;
        }

        if (userData) {
          setUserType(userData.user_type);
        }
      } catch (error) {
        console.error('Error loading user type:', error);
      }
    }

    fetchUserType();
  }, []);

  // Check for pending inquiry after registration and auto-open modal
  useEffect(() => {
    const pendingInquiry = sessionStorage.getItem('pendingInquiry');
    if (pendingInquiry) {
      try {
        const { propertyId: savedPropertyId } = JSON.parse(pendingInquiry);
        // Only open modal if we're on the same property page
        if (savedPropertyId === params.id) {
          setShowContactModal(true);
        }
      } catch (error) {
        console.error('Error checking pending inquiry:', error);
      }
    }
  }, [params.id]);

  useEffect(() => {
    async function fetchData() {
      const { data: propertyData } = await (supabase
        .from('properties') as any)
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (propertyData) {
        setProperty(propertyData);

        // Increment view count using API route
        try {
          await fetch(`/api/properties/${propertyData.id}/track-view`, {
            method: 'POST'
          });
          console.log('✓ View tracked for property:', propertyData.id);
        } catch (error) {
          console.error('Failed to track view:', error);
          // Don't break the page if tracking fails
        }

        // Fetch all properties to filter on the client side
        const { data: allProperties } = await (supabase
          .from('properties') as any)
          .select('*')
          .neq('id', propertyData.id)
          .eq('status', 'active');

        if (allProperties) {
          // Filter for similar locations (matching category OR sub-category OR tags)
          const currentCategoryId = propertyData.category_id;
          const currentSubCategoryId = propertyData.sub_category_id;
          const currentTags = propertyData.property_tags || [];

          const similarLocations = (allProperties as any[]).filter((location: any) => {
            // Match if ANY of these conditions are true:
            // 1. Same category_id
            const hasSameCategory = currentCategoryId && location.category_id === currentCategoryId;

            // 2. Same sub_category_id
            const hasSameSubCategory = currentSubCategoryId && location.sub_category_id === currentSubCategoryId;

            // 3. At least one matching tag
            const hasSameTag = currentTags.length > 0 && location.property_tags?.some((tag: string) =>
              currentTags.includes(tag)
            );

            // Return true if ANY match (OR logic)
            return hasSameCategory || hasSameSubCategory || hasSameTag;
          });

          // Sort by number of matching attributes (most relevant first)
          similarLocations.sort((a: any, b: any) => {
            const aMatches = countMatches(a, propertyData);
            const bMatches = countMatches(b, propertyData);
            return bMatches - aMatches;
          });

          // Take exactly 8 results
          setSimilarProperties(similarLocations.slice(0, 8));

          // For nearby locations, use cascading fallback strategy
          if (propertyData.latitude && propertyData.longitude) {
            // PRIORITY 1: Property has coordinates - calculate distance to other properties with coordinates
            let nearbyLocations: any[] = (allProperties as any[])
              .filter((p: any) => p.latitude && p.longitude) // Only properties with coordinates
              .map((prop: any) => ({
                ...prop,
                distance: calculateDistance(
                  parseFloat(propertyData.latitude!),
                  parseFloat(propertyData.longitude!),
                  parseFloat(prop.latitude!),
                  parseFloat(prop.longitude!)
                )
              }))
              .sort((a: any, b: any) => a.distance - b.distance);

            // If we have fewer than 4 properties with coordinates, supplement with properties from same city
            if (nearbyLocations.length < 4 && propertyData.city) {
              const sameCityProperties = (allProperties as any[])
                .filter((p: any) =>
                  p.city === propertyData.city &&
                  !nearbyLocations.find((nl: any) => nl.id === p.id) // Avoid duplicates
                )
                .map((prop: any) => ({
                  ...prop,
                  distance: null // No distance for properties without coordinates
                }));

              nearbyLocations = [...nearbyLocations, ...sameCityProperties];
            }

            // Take exactly 4 locations
            setNearbyProperties(nearbyLocations.slice(0, 4) as any);
          } else if (propertyData.city || propertyData.county) {
            // PRIORITY 2: No coordinates - show properties from same city, then supplement with state
            let nearbyLocations: any[] = [];

            // First, get properties from same city
            if (propertyData.city) {
              nearbyLocations = (allProperties as any[])
                .filter((p: any) => p.city === propertyData.city)
                .map((prop: any) => ({
                  ...prop,
                  distance: null // No distance for properties without coordinates
                }));
            }

            // If we don't have 4 yet, supplement with properties from same state/county
            if (nearbyLocations.length < 4 && propertyData.county) {
              const sameStateProperties = (allProperties as any[])
                .filter((p: any) =>
                  p.county === propertyData.county &&
                  !nearbyLocations.find((nl: any) => nl.id === p.id) // Avoid duplicates
                )
                .map((prop: any) => ({
                  ...prop,
                  distance: null // No distance for properties without coordinates
                }));

              nearbyLocations = [...nearbyLocations, ...sameStateProperties];
            }

            // Take up to 4 locations
            setNearbyProperties(nearbyLocations.slice(0, 4) as any);
          } else {
            // No location data at all, don't show nearby section
            setNearbyProperties([]);
          }
        }
      }

      // Fetch footer settings
      const { data: footerSettings } = await supabase
        .from('site_settings')
        .select('*')
        .eq('page', 'property')
        .eq('section', 'footer');

      if (footerSettings) {
        footerSettings.forEach((setting: any) => {
          let value = setting.value;
          if (typeof value === 'string') {
            try {
              while (typeof value === 'string' && (value.startsWith('"') || value.startsWith('\\"'))) {
                value = JSON.parse(value);
              }
            } catch (e) {
              value = value.replace(/^"|"$/g, '');
            }
          }

          switch(setting.key) {
            case 'property_footer_phone': setFooterPhone(value); break;
            case 'property_footer_partner_text': setFooterPartnerText(value); break;
            case 'property_footer_license': setFooterLicense(value); break;
            case 'property_footer_company_name': setFooterCompanyName(value); break;
          }
        });
      }

      setLoading(false);
    }

    // Helper function to count matching attributes
    function countMatches(location: Property, currentProperty: Property): number {
      let matches = 0;

      // Count category matches (handle both old and new format)
      const currentCategories = currentProperty.categories || [];
      const locationCategories = location.categories || [];

      // Old format: categories array
      if (currentCategories.length > 0 && locationCategories.length > 0) {
        matches += locationCategories.filter((cat: string) =>
          currentCategories.includes(cat)
        ).length;
      }

      // New format: category_id and sub_category_id
      const currentCategoryId = (currentProperty as any).category_id;
      const currentSubCategoryId = (currentProperty as any).sub_category_id;
      const locationCategoryId = (location as any).category_id;
      const locationSubCategoryId = (location as any).sub_category_id;

      if (currentCategoryId && locationCategoryId === currentCategoryId) {
        matches += 2; // Main category match is worth 2 points
      }
      if (currentSubCategoryId && locationSubCategoryId === currentSubCategoryId) {
        matches += 3; // Sub-category match is worth 3 points (more specific)
      }

      // Count tag matches
      const currentTags = currentProperty.property_tags || [];
      const locationTags = location.property_tags || [];

      matches += locationTags.filter((tag: string) =>
        currentTags.includes(tag)
      ).length;

      return matches;
    }

    fetchData();
  }, [params.id]);

  // Check favorite status when property loads
  useEffect(() => {
    if (property) {
      checkFavoriteStatus();
    }
  }, [property]);

  // Execute pending favorite action after login
  useEffect(() => {
    async function executePendingFavorite() {
      if (!pendingFavoriteAction || !property) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // User is now logged in, execute the favorite action
        setPendingFavoriteAction(false);

        try {
          // Add to favorites
          const { error } = await (supabase
            .from('favorite_properties') as any)
            .insert([{
              user_id: user.id,
              property_id: property.id
            }]);

          if (error) {
            // Check if it's a duplicate error (already favorited)
            if (error.code === '23505') {
              console.log('Property already in favorites');
            } else {
              throw error;
            }
          }

          setIsFavorite(true);
          console.log('Property added to favorites after login');
        } catch (error: any) {
          console.error('Error adding to favorites after login:', error);
        }
      }
    }

    executePendingFavorite();
  }, [pendingFavoriteAction, property, showLoginModal]);

  useEffect(() => {
    async function loadImages() {
      if (!property) return;

      // Fetch images from property_images table with display_order and tags
      const { data: propertyImages, error } = await (supabase
        .from('property_images') as any)
        .select('image_url, display_order, tags')
        .eq('property_id', property.id)
        .order('display_order', { ascending: true });

      let imagesWithCats: Array<{ url: string; categories: string[] }> = [];

      if (propertyImages && propertyImages.length > 0) {
        // Use property_images with their tags as categories
        imagesWithCats = (propertyImages as any[]).map((img: any) => ({
          url: img.image_url,
          categories: img.tags || []
        }));
      } else if (property.images && property.images.length > 0) {
        // Fallback to property.images array
        imagesWithCats = property.images.map((url, index) => ({
          url,
          categories: index < categoryTags.length ? [categoryTags[index]] : ['General']
        }));
      } else if (property.primary_image) {
        imagesWithCats = [{ url: property.primary_image, categories: ['General'] }];
      } else {
        imagesWithCats = [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', categories: ['General'] }];
      }

      setAllImages(imagesWithCats);
      setDisplayedImages(imagesWithCats);

      setTimeout(() => {
        if (categoryRefs.current['Pool']) {
          const element = categoryRefs.current['Pool'];
          const rect = element.getBoundingClientRect();
          setRedBarPosition({
            left: `${rect.left}px`,
            width: `${rect.width}px`
          });
          setActiveCategory('Pool');
        }
      }, 100);
    }

    loadImages();
  }, [property]);

  useEffect(() => {
    const handleResize = () => updateRedBarPosition(activeCategory);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [activeCategory]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayedImages.length) % displayedImages.length);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleDownloadImages = async () => {
    if (!property) return;

    setDownloadingImages(true);

    try {
      console.log('Starting image download for property:', property.id);

      const response = await fetch(`/api/download-images/${property.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/zip, application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.error || error.details || 'Failed to download images');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('ZIP blob size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('Received empty ZIP file');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(property.public_name || property.name).replace(/[^a-z0-9]/gi, '-')}-images.zip`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log('✓ Images downloaded successfully');

      // Track the download as a single event using API route
      try {
        console.log('Starting download tracking for property:', property.id);

        await fetch(`/api/properties/${property.id}/track-download`, {
          method: 'POST'
        });

        console.log('✓ Download tracked successfully (1 ZIP download)');
      } catch (trackError: any) {
        console.error('❌ Failed to track download:', trackError);
        // Don't show error to user, tracking failure shouldn't break download
      }

      alert('Images downloaded successfully!');

    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download images: ' + error.message);
    } finally {
      setDownloadingImages(false);
    }
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);

    try {
      const response = await fetch(`/api/generate-pdf/${property?.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF');
      }

      const pdfBlob = await generateLocationPDF(data.property, data.images);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.property.public_name || data.property.name).replace(/[^a-z0-9]/gi, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Check if property is in user's favorites
  const checkFavoriteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !property) {
        setCheckingFavorite(false);
        return;
      }

      const { data, error } = await (supabase
        .from('favorite_properties') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', property.id)
        .maybeSingle();

      if (error) throw error;

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setCheckingFavorite(false);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPendingFavoriteAction(true);
        setShowLoginModal(true);
        return;
      }

      if (!property) return;

      if (isFavorite) {
        // Remove from favorites
        const { error } = await (supabase
          .from('favorite_properties') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id);

        if (error) throw error;

        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await (supabase
          .from('favorite_properties') as any)
          .insert([{
            user_id: user.id,
            property_id: property.id
          }]);

        if (error) {
          // Check if it's a duplicate error (already favorited)
          if (error.code === '23505') {
            console.log('Property already in favorites, refreshing status');
            // Refresh the favorite status from database
            await checkFavoriteStatus();
            return;
          } else {
            throw error;
          }
        }

        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16 md:pt-20 lg:pt-28">
        <div className="text-xl" style={{ color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16 md:pt-20 lg:pt-28">
        <div className="text-xl" style={{ color: '#6b7280' }}>Property not found</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://use.typekit.net/jhk6rqb.css');

        body {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        h1, h2, h3 {
          font-family: acumin-pro-wide, sans-serif;
          letter-spacing: -0.02em;
        }

        /* Navigation arrows - gradient bars */
        .nav-arrow {
          position: absolute;
          top: 0;
          bottom: 18px;
          width: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.3s ease;
        }

        @media (max-width: 767px) {
          .nav-arrow {
            width: 48px;
          }
        }

        .nav-arrow-left {
          left: 0;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0));
        }

        .nav-arrow-left:hover {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
        }

        .nav-arrow-right {
          right: 0;
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0));
        }

        .nav-arrow-right:hover {
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
        }

        /* Hide scrollbar */
        .carousel-container::-webkit-scrollbar {
          display: none;
        }

        .carousel-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Hide scrollbar for category tags */
        div::-webkit-scrollbar {
          display: none;
        }

        /* Responsive image grid */
        .property-image-grid {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: repeat(2, 200px);
          gap: 4px;
          max-height: 404px;
          overflow: hidden;
          padding: 0;
          margin: 0;
        }

        @media (min-width: 640px) {
          .property-image-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 250px);
            max-height: 504px;
          }
        }

        @media (min-width: 1024px) {
          .property-image-grid {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 300px);
            max-height: 604px;
          }
        }

        /* Responsive two-column layout */
        .property-details-container {
          padding: 1rem;
          background: #fff;
        }

        @media (min-width: 768px) {
          .property-details-container {
            padding: 2rem;
          }
        }

        .property-details-flex {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .property-details-flex {
            flex-direction: row;
          }
        }

        .property-left-column {
          flex: 1 1 100%;
          padding-right: 0;
          border-right: none;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 2rem;
        }

        @media (min-width: 1024px) {
          .property-left-column {
            flex: 1 1 50%;
            padding-right: 2rem;
            border-right: 1px solid #e5e5e5;
            border-bottom: none;
            padding-bottom: 0;
          }
        }

        .property-right-column {
          flex: 1 1 100%;
          padding-left: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        @media (min-width: 1024px) {
          .property-right-column {
            flex: 1 1 50%;
            padding-left: 2rem;
          }
        }

        /* Action buttons responsive */
        .action-buttons-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        /* Similar locations grid */
        .similar-locations-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .similar-locations-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .similar-locations-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1200px) {
          .similar-locations-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .similar-locations-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        @media (min-width: 768px) {
          .similar-locations-container {
            padding: 0 2rem;
          }
        }

        .similar-locations-title {
          font-size: 2rem;
          font-weight: 300;
          color: #212529;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .similar-locations-title {
            font-size: 3rem;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white">
        <div style={{ position: 'relative', width: '100%' }}>

          {viewMode === 'grid' ? (
            <div className="property-image-grid">
              {displayedImages.slice(0, 6).map((imgData, index) => {
                const img = imgData.url;

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setShowLightbox(true);
                    }}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      backgroundColor: '#f3f4f6'
                    }}
                  >
                    <Image
                      src={img || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'}
                      alt={`${property.public_name || property.name} - Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized={img.includes('unsplash.com') || img.includes('placeholder.com')}
                      onError={(e: any) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="carousel-container"
              style={{
                display: 'flex',
                height: '600px',
                overflowX: 'auto',
                scrollBehavior: 'smooth'
              }}
            >
              {displayedImages.map((imgData, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    height: '100%',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setShowLightbox(true);
                  }}
                >
                  <Image
                    src={imgData.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'}
                    alt={`${property.public_name || property.name} - Image ${index + 1}`}
                    width={900}
                    height={600}
                    style={{
                      height: '100%',
                      width: 'auto',
                      objectFit: 'cover'
                    }}
                    unoptimized={imgData.url.includes('unsplash.com') || imgData.url.includes('placeholder.com')}
                    onError={(e: any) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80';
                    }}
                  />

                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    fontSize: '14px'
                  }}>
                    {index + 1} / {displayedImages.length}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'carousel' && (
            <div
              className="nav-arrow nav-arrow-left"
              onClick={() => {
                if (carouselRef.current) {
                  carouselRef.current.scrollBy({ left: -800, behavior: 'smooth' });
                }
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          )}

          <div
            className="nav-arrow nav-arrow-right"
            onClick={() => {
              if (viewMode === 'grid') {
                setViewMode('carousel');
              } else if (carouselRef.current) {
                carouselRef.current.scrollBy({ left: 800, behavior: 'smooth' });
              }
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>

          {viewMode === 'grid' && (
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              fontSize: '14px',
              zIndex: 10
            }}>
              1 / {displayedImages.length}
            </div>
          )}
        </div>


        {showLightbox && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setShowLightbox(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              <X style={{ width: '24px', height: '24px', color: '#000' }} />
            </button>

            <div style={{ position: 'relative', width: '90%', height: '90%' }}>
              <Image
                src={displayedImages[currentImageIndex]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'}
                alt={property.public_name || property.name}
                fill
                style={{ objectFit: 'contain' }}
                priority
                unoptimized={(displayedImages[currentImageIndex]?.url || '').includes('unsplash.com') || (displayedImages[currentImageIndex]?.url || '').includes('placeholder.com')}
                onError={(e: any) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80';
                }}
              />
            </div>

            {displayedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '48px',
                    height: '48px',
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10000
                  }}
                >
                  <ChevronLeft style={{ width: '24px', height: '24px', color: '#000' }} />
                </button>

                <button
                  onClick={nextImage}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '48px',
                    height: '48px',
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10000
                  }}
                >
                  <ChevronRight style={{ width: '24px', height: '24px', color: '#000' }} />
                </button>
              </>
            )}

            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              fontSize: '14px',
              zIndex: 10000
            }}>
              {currentImageIndex + 1} / {displayedImages.length}
            </div>
          </div>
        )}

        {/* Property Details Section - 50/50 Split Layout */}
        <div className="property-details-container">
          <div className="property-details-flex">
            {/* LEFT COLUMN - 50% Width */}
            <div className="property-left-column">
              {/* Property Title Row with City */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                {/* Property Name */}
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 300,
                  margin: 0,
                  fontFamily: 'acumin-pro-wide, sans-serif',
                  color: 'rgb(33, 37, 41)',
                  letterSpacing: '-0.56px',
                  lineHeight: '36.4px'
                }}>
                  {property.public_name || property.name}
                </h1>

                {/* Vertical Separator */}
                <div style={{
                  height: '24px',
                  width: '1px',
                  background: '#e5e5e5'
                }} />

                {/* City Name */}
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 100,
                  color: 'rgb(33, 37, 41)',
                  fontFamily: 'acumin-pro-wide, sans-serif',
                  letterSpacing: '-0.32px',
                  lineHeight: '16px',
                  whiteSpace: 'nowrap'
                }}>
                  {property.city}
                </p>
              </div>

              {/* Description */}
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'rgb(33, 37, 41)',
                fontFamily: 'acumin-pro-wide, sans-serif',
                fontWeight: 300,
                marginTop: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '12pt',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  fontFamily: 'acumin-pro-wide, sans-serif'
                }}>
                  {property.sub_heading || `${property.public_name || property.name}: An Architectural Marvel in ${property.city} for Filmmakers and Photographers`}
                </h2>
                <p>
                  {property.description || 'Nestled in the vibrant city, this location stands as a testament to innovative design and modern architecture. A unique blend of functional space and striking visual appeal, this building offers an exciting backdrop for filming, photography, and various production activities.'}
                </p>
              </div>

              {/* Inquire Button - Only show for non-property owners */}
              {userType !== 'property_owner' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowContactModal(true);
                    }}
                    style={{
                      background: '#e65a00',
                      backgroundColor: '#e65a00',
                      color: 'rgb(255, 255, 255)',
                      border: '1px solid #e65a00',
                      borderRadius: '3.2px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      fontWeight: 300,
                      fontFamily: 'acumin-pro-wide, sans-serif',
                      lineHeight: '21px',
                      height: '31px',
                      width: '266.07px',
                      textAlign: 'center',
                      display: 'inline-block',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                      userSelect: 'none',
                      verticalAlign: 'middle',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#cc5200';
                      e.currentTarget.style.backgroundColor = '#cc5200';
                      e.currentTarget.style.borderColor = '#cc5200';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#e65a00';
                      e.currentTarget.style.backgroundColor = '#e65a00';
                      e.currentTarget.style.borderColor = '#e65a00';
                    }}
                  >
                    Inquire About {property.public_name || property.name}
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - 50% Width */}
            <div className="property-right-column">
              {/* Action Buttons - Single Row */}
              <div className="action-buttons-container">
                {/* Share Button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  style={{
                    background: '#e65a00',
                    color: '#fff',
                    border: '1px solid #e65a00',
                    borderRadius: '3.2px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 400,
                    cursor: 'pointer',
                    fontFamily: 'acumin-pro-wide, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease-in-out',
                    whiteSpace: 'nowrap',
                    minWidth: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#cc5200';
                    e.currentTarget.style.borderColor = '#cc5200';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#e65a00';
                    e.currentTarget.style.borderColor = '#e65a00';
                  }}
                >
                  <Share2 style={{ width: '14px', height: '14px' }} />
                  SHARE
                </button>

                {/* Other Action Buttons */}
                {[
                  { icon: Heart, text: 'FAVORITE', isFavorite: true },
                  { icon: Mail, text: 'CONTACT US' },
                  { icon: ImageIcon, text: 'THUMBNAILS' },
                  { icon: Download, text: 'DOWNLOAD IMAGES' },
                  { icon: FileText, text: 'LOCATION PDF' }
                ].filter(btn => {
                  // Hide FAVORITE button for property owners
                  if (btn.text === 'FAVORITE' && userType === 'property_owner') {
                    return false;
                  }
                  return true;
                }).map((btn, index) => {
                  const isLocationPDF = btn.text === 'LOCATION PDF';
                  const isDownloadImages = btn.text === 'DOWNLOAD IMAGES';
                  const isFavoriteBtn = btn.text === 'FAVORITE';
                  const isDisabled = (isLocationPDF && generatingPDF) || (isDownloadImages && downloadingImages) || (isFavoriteBtn && checkingFavorite);

                  return (
                    <button
                      key={index}
                      disabled={isDisabled}
                      onClick={() => {
                        if (btn.text === 'FAVORITE') handleToggleFavorite();
                        else if (btn.text === 'CONTACT US') setShowContactModal(true);
                        else if (btn.text === 'THUMBNAILS') setShowThumbnails(true);
                        else if (btn.text === 'DOWNLOAD IMAGES') handleDownloadImages();
                        else if (btn.text === 'LOCATION PDF') handleDownloadPDF();
                      }}
                      style={{
                        background: isDisabled ? '#999' : '#e65a00',
                        color: '#fff',
                        border: isDisabled ? '1px solid #999' : '1px solid #e65a00',
                        borderRadius: '3.2px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: 400,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'acumin-pro-wide, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease-in-out',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        opacity: isDisabled ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = '#cc5200';
                          e.currentTarget.style.borderColor = '#cc5200';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = '#e65a00';
                          e.currentTarget.style.borderColor = '#e65a00';
                        }
                      }}
                    >
                      <btn.icon
                        style={{ width: '14px', height: '14px' }}
                        fill={isFavoriteBtn && isFavorite ? '#fff' : 'none'}
                      />
                      {isLocationPDF && generatingPDF ? 'GENERATING...' :
                       isDownloadImages && downloadingImages ? 'DOWNLOADING...' :
                       isFavoriteBtn && checkingFavorite ? 'CHECKING...' :
                       isFavoriteBtn ? (isFavorite ? 'FAVORITED' : 'FAVORITE') :
                       btn.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {showThumbnails && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            overflowY: 'auto'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 300, color: '#fff' }}>All Images</h2>
                <button
                  onClick={() => setShowThumbnails(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '3rem',
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedImages.map((imgData, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setShowThumbnails(false);
                      setShowLightbox(true);
                    }}
                    style={{
                      position: 'relative',
                      aspectRatio: '4/3',
                      overflow: 'hidden',
                      borderRadius: '0.5rem',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Image
                      src={imgData.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'}
                      alt={`Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized={imgData.url.includes('unsplash.com') || imgData.url.includes('placeholder.com')}
                      onError={(e: any) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {similarProperties.length > 0 && (
          <LocationSection
            title="Similar Locations"
            properties={similarProperties}
            bgColor="#f9fafb"
          />
        )}

        {nearbyProperties.length > 0 && (
          <LocationSection
            title="Nearby Locations"
            properties={nearbyProperties}
            bgColor="#fff"
            showDistance
          />
        )}

        <Footer
          phone={footerPhone}
          partnerText={footerPartnerText}
          license={footerLicense}
          companyName={footerCompanyName}
        />

        {/* Contact Form Modal */}
        <ContactFormModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyName={property?.name}
          propertyId={property?.id}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          redirectAfterLogin={`/property/${params.id}`}
          onSuccess={() => {
            setShowLoginModal(false);
            checkFavoriteStatus();
          }}
        />

        {/* Share Modal */}
        {showShareModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowShareModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Share Property</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">Share this property link:</p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
                  style={{ fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-hover transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {copySuccess && (
                <p className="text-green-600 text-sm mt-2">Link copied to clipboard!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function ActionButton({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: '#fe751f',
        color: '#fff',
        border: 'none',
        padding: '0.75rem 1.5rem',
        fontSize: '14px',
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#e65a00'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#fe751f'}
    >
      {icon}
      {text}
    </button>
  );
}

function LocationSection({
  title,
  properties,
  bgColor,
  showDistance
}: {
  title: string;
  properties: Property[];
  bgColor: string;
  showDistance?: boolean;
}) {
  return (
    <div style={{ background: bgColor, padding: '2rem 0' }}>
      <div className="similar-locations-container">
        <h2 className="similar-locations-title">
          {title}
        </h2>
        <div className="similar-locations-grid">
          {properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              distance={showDistance && (prop as any).distance ? formatDistance((prop as any).distance) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property, distance }: { property: Property; distance?: string }) {
  const router = useRouter();
  const image = property.primary_image || property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

  return (
    <div
      onClick={() => router.push(`/property/${property.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
        <Image
          src={image}
          alt={property.public_name || property.name}
          fill
          style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
          unoptimized={image.includes('unsplash.com') || image.includes('placeholder.com')}
        />

        {distance && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            background: '#fff',
            color: '#212529',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '12px',
            fontWeight: 500
          }}>
            {distance}
          </div>
        )}
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: 300, color: '#212529', marginBottom: '0.25rem' }}>
        {property.public_name || property.name}
      </h3>
      <p style={{ fontSize: '0.875rem', fontWeight: 300, color: '#6b7280' }}>
        {property.city}
      </p>
    </div>
  );
}

function Footer({ phone, partnerText, license, companyName }: { phone: string; partnerText: string; license: string; companyName: string }) {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '3rem 0', textAlign: 'center' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 300, color: '#212529' }}>SGS LOCATIONS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#4b5563' }}>
          <Phone style={{ width: '20px', height: '20px' }} />
          <span style={{ fontSize: '1.125rem' }}>{phone}</span>
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
          {partnerText}
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1rem' }}>
          {license}
        </div>

        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
