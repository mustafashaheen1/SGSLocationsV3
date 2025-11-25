'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Image as ImageIcon,
  Download,
  FileText,
  Search,
  Phone,
  Camera,
  Plus,
  X
} from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import { generateLocationPDF } from '@/lib/pdf-generator';
import { calculateDistance, formatDistance } from '@/lib/distance';
import ContactFormModal from '@/components/ContactFormModal';

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

  useEffect(() => {
    async function fetchData() {
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (propertyData) {
        setProperty(propertyData);

        // Increment view count
        try {
          const newViewCount = (propertyData.view_count || 0) + 1;
          await supabase
            .from('properties')
            .update({ view_count: newViewCount })
            .eq('id', propertyData.id);
          console.log('✓ View tracked for property:', propertyData.id);
        } catch (error) {
          console.error('Failed to track view:', error);
          // Don't break the page if tracking fails
        }

        // Fetch all properties to filter on the client side
        const { data: allProperties } = await supabase
          .from('properties')
          .select('*')
          .neq('id', propertyData.id)
          .eq('status', 'active');

        if (allProperties) {
          // Filter for similar locations (matching categories AND tags)
          const currentCategories = propertyData.categories || [];
          const currentTags = propertyData.property_tags || [];

          const similarLocations = allProperties.filter(location => {
            // Check if at least one category matches
            const hasMatchingCategory = location.categories?.some((cat: string) =>
              currentCategories.includes(cat)
            );

            // Check if at least one tag matches
            const hasMatchingTag = location.property_tags?.some((tag: string) =>
              currentTags.includes(tag)
            );

            // Must have both matching category AND matching tag
            return hasMatchingCategory && hasMatchingTag;
          });

          // Sort by number of matching attributes (most relevant first)
          similarLocations.sort((a, b) => {
            const aMatches = countMatches(a, propertyData);
            const bMatches = countMatches(b, propertyData);
            return bMatches - aMatches;
          });

          // Limit to 12 results
          setSimilarProperties(similarLocations.slice(0, 12));

          // For nearby locations, calculate actual distances if coordinates are available
          if (propertyData.latitude && propertyData.longitude) {
            const nearbyLocations = allProperties
              .filter(p => p.latitude && p.longitude)
              .map(prop => ({
                ...prop,
                distance: calculateDistance(
                  propertyData.latitude!,
                  propertyData.longitude!,
                  prop.latitude!,
                  prop.longitude!
                )
              }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 12);

            setNearbyProperties(nearbyLocations as any);
          } else {
            // Fallback: use same city if no coordinates
            const nearbyLocations = allProperties
              .filter(p => p.city === propertyData.city)
              .slice(0, 12);
            setNearbyProperties(nearbyLocations);
          }
        }
      }
      setLoading(false);
    }

    // Helper function to count matching attributes
    function countMatches(location: Property, currentProperty: Property): number {
      const currentCategories = currentProperty.categories || [];
      const currentTags = currentProperty.property_tags || [];
      const locationCategories = location.categories || [];
      const locationTags = location.property_tags || [];

      const categoryMatches = locationCategories.filter((cat: string) =>
        currentCategories.includes(cat)
      ).length;

      const tagMatches = locationTags.filter((tag: string) =>
        currentTags.includes(tag)
      ).length;

      return categoryMatches + tagMatches;
    }

    fetchData();
  }, [params.id]);

  useEffect(() => {
    async function loadImages() {
      if (!property) return;

      // Fetch images from property_images table with display_order and tags
      const { data: propertyImages, error } = await supabase
        .from('property_images')
        .select('image_url, display_order, tags')
        .eq('property_id', property.id)
        .order('display_order', { ascending: true });

      let imagesWithCats: Array<{ url: string; categories: string[] }> = [];

      if (propertyImages && propertyImages.length > 0) {
        // Use property_images with their tags as categories
        imagesWithCats = propertyImages.map(img => ({
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
      a.download = `${property.name.replace(/[^a-z0-9]/gi, '-')}-images.zip`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log('✓ Images downloaded successfully');

      // Track the download
      try {
        console.log('Starting download tracking for property:', property.id);
        console.log('Number of images to track:', property.images?.length || 0);

        // Get current user (if logged in)
        let userId = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id || null;
          console.log('User ID:', userId || 'anonymous');
        } catch (userError) {
          console.log('Not logged in, tracking as anonymous');
        }

        // Track each image download
        if (property.images && property.images.length > 0) {
          const downloadRecords = property.images.map(imageUrl => ({
            property_id: property.id,
            image_url: imageUrl,
            user_id: userId
          }));

          console.log('Inserting download records:', downloadRecords.length);
          const { data, error } = await supabase.from('image_downloads').insert(downloadRecords);

          if (error) {
            console.error('❌ Download tracking error:', error);
            throw error;
          }

          console.log('✓ Download tracked successfully:', downloadRecords.length, 'images');
        } else {
          console.log('⚠️ No images to track');
        }
      } catch (trackError: any) {
        console.error('❌ Failed to track download:', trackError);
        console.error('Error details:', trackError.message, trackError.details);
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
      a.download = `${data.property.name.replace(/[^a-z0-9]/gi, '-')}.pdf`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ paddingTop: '110px' }}>
        <div className="text-xl" style={{ color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ paddingTop: '110px' }}>
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
      `}</style>

      <main className="min-h-screen bg-white">
        <div style={{ position: 'relative', width: '100%' }}>

          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 300px)',
              gap: '4px',
              maxHeight: '604px',
              overflow: 'hidden',
              padding: '0',
              margin: '0'
            }}>
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
                      alt={`${property.name} - Image ${index + 1}`}
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
                    alt={`${property.name} - Image ${index + 1}`}
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
                alt={property.name}
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
        <div style={{
          padding: '2rem',
          background: '#fff'
        }}>
          <div style={{
            display: 'flex',
            gap: '2rem'
          }}>
            {/* LEFT COLUMN - 50% Width */}
            <div style={{
              flex: '1 1 50%',
              paddingRight: '2rem',
              borderRight: '1px solid #e5e5e5'
            }}>
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
                  {property.name}
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
                  {property.name}: An Architectural Marvel in {property.city} for Filmmakers and Photographers
                </h2>
                <p>
                  {property.description || 'Nestled in the vibrant city, this location stands as a testament to innovative design and modern architecture. A unique blend of functional space and striking visual appeal, this building offers an exciting backdrop for filming, photography, and various production activities.'}
                </p>
              </div>

              {/* Inquire Button */}
              <div style={{ marginTop: '1.5rem' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowContactModal(true);
                  }}
                  style={{
                    background: 'rgb(225, 25, 33)',
                    backgroundColor: 'rgb(225, 25, 33)',
                    color: 'rgb(255, 255, 255)',
                    border: '1px solid rgb(225, 25, 33)',
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
                    e.currentTarget.style.background = '#bf151c';
                    e.currentTarget.style.backgroundColor = '#bf151c';
                    e.currentTarget.style.borderColor = '#bf151c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgb(225, 25, 33)';
                    e.currentTarget.style.backgroundColor = 'rgb(225, 25, 33)';
                    e.currentTarget.style.borderColor = 'rgb(225, 25, 33)';
                  }}
                >
                  Inquire About {property.name}
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN - 50% Width */}
            <div style={{
              flex: '1 1 50%',
              paddingLeft: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}>
              {/* Action Buttons - Single Row */}
              <div style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: '0.5rem',
                justifyContent: 'flex-start',
                marginBottom: '2rem',
                width: '100%'
              }}>
                {/* Copy Button - White with Red Border */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    console.log('Link copied!');
                  }}
                  style={{
                    background: '#fff',
                    color: 'rgb(33, 37, 41)',
                    border: '2px solid rgb(225, 25, 33)',
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
                    e.currentTarget.style.background = 'rgb(225, 25, 33)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = 'rgb(33, 37, 41)';
                  }}
                >
                  <Copy style={{ width: '14px', height: '14px' }} />
                  COPY
                </button>

                {/* Other Action Buttons */}
                {[
                  { icon: Mail, text: 'CONTACT US' },
                  { icon: ImageIcon, text: 'THUMBNAILS' },
                  { icon: Download, text: 'DOWNLOAD IMAGES' },
                  { icon: FileText, text: 'LOCATION PDF' }
                ].map((btn, index) => {
                  const isLocationPDF = btn.text === 'LOCATION PDF';
                  const isDownloadImages = btn.text === 'DOWNLOAD IMAGES';
                  const isDisabled = (isLocationPDF && generatingPDF) || (isDownloadImages && downloadingImages);

                  return (
                    <button
                      key={index}
                      disabled={isDisabled}
                      onClick={() => {
                        if (btn.text === 'CONTACT US') setShowContactModal(true);
                        else if (btn.text === 'THUMBNAILS') setShowThumbnails(true);
                        else if (btn.text === 'DOWNLOAD IMAGES') handleDownloadImages();
                        else if (btn.text === 'LOCATION PDF') handleDownloadPDF();
                      }}
                      style={{
                        background: isDisabled ? '#999' : 'rgb(225, 25, 33)',
                        color: '#fff',
                        border: isDisabled ? '1px solid #999' : '1px solid rgb(225, 25, 33)',
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
                          e.currentTarget.style.background = '#bf151c';
                          e.currentTarget.style.borderColor = '#bf151c';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = 'rgb(225, 25, 33)';
                          e.currentTarget.style.borderColor = 'rgb(225, 25, 33)';
                        }
                      }}
                    >
                      <btn.icon style={{ width: '14px', height: '14px' }} />
                      {isLocationPDF && generatingPDF ? 'GENERATING...' :
                       isDownloadImages && downloadingImages ? 'DOWNLOADING...' :
                       btn.text}
                    </button>
                  );
                })}
              </div>

              {/* SGS Verified Logo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgb(225, 25, 33)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera style={{
                    width: '24px',
                    height: '24px',
                    color: '#fff'
                  }} />
                </div>
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'rgb(33, 37, 41)',
                    fontFamily: 'acumin-pro-wide, sans-serif',
                    letterSpacing: '0.05em'
                  }}>
                    SGS
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 300,
                    color: '#6b7280',
                    fontFamily: 'acumin-pro-wide, sans-serif',
                    letterSpacing: '0.02em'
                  }}>
                    VERIFIED
                  </div>
                </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
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

        <Footer />

        {/* Plus button - Fixed at bottom left corner of viewport */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowThumbnails(true);
          }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            width: '56px',
            height: '56px',
            background: '#e11921',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          aria-label="Show all thumbnails"
        >
          <Plus style={{ width: '28px', height: '28px', color: '#fff' }} />
        </button>

        {/* Contact Form Modal */}
        <ContactFormModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyName={property?.name}
        />
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
        background: '#e11921',
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
      onMouseEnter={(e) => e.currentTarget.style.background = '#bf151c'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#e11921'}
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
    <div style={{ background: bgColor, padding: '4rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 300, color: '#212529', marginBottom: '2rem' }}>
          {title}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
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
          alt={property.name}
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
        {property.name}
      </h3>
      <p style={{ fontSize: '0.875rem', fontWeight: 300, color: '#6b7280' }}>
        {property.city}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '3rem 0', textAlign: 'center' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#e11921',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera style={{ width: '24px', height: '24px', color: '#fff' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 300, color: '#212529' }}>SGS LOCATIONS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#4b5563' }}>
          <Phone style={{ width: '20px', height: '20px' }} />
          <span style={{ fontSize: '1.125rem' }}>(310) 871-8004</span>
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
          American Express Preferred Partner
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1rem' }}>
          CalDRE #01234567
        </div>

        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          © {new Date().getFullYear()} Image Locations. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
