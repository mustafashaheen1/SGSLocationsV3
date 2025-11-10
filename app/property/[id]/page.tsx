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

interface ImageWithCategory {
  url: string;
  categories: string[];
}

function generateImagesWithCategories(): ImageWithCategory[] {
  const categories = ['Pool', 'Jacuzzi', 'Hot Tub', 'Patio', 'Kitchen', 'Garden', 'Staircase', 'Gazebo', 'Living Room', 'Bathroom', 'Dining Room', 'Studio', 'Rooftop', 'Parking'];
  const imageList: ImageWithCategory[] = [];

  const workingUrls = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&q=80',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
    'https://images.unsplash.com/photo-1565953522043-baea26b83b7e?w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dce4d33be?w=1200&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80',
    'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1200&q=80',
    'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1200&q=80',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
    'https://images.unsplash.com/photo-1560185127-6a86733ccc14?w=1200&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
    'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=1200&q=80',
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&q=80',
    'https://images.unsplash.com/photo-1556911073-52527ac43761?w=1200&q=80',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80',
    'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=1200&q=80'
  ];

  for (let i = 0; i < 100; i++) {
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const imageCategories: string[] = [];

    for (let j = 0; j < numCategories; j++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      if (!imageCategories.includes(randomCategory)) {
        imageCategories.push(randomCategory);
      }
    }

    imageList.push({
      url: workingUrls[i % workingUrls.length],
      categories: imageCategories
    });
  }
  return imageList;
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

        const { data: similarData } = await supabase
          .from('properties')
          .select('*')
          .neq('id', propertyData.id)
          .limit(4);

        const { data: nearbyData } = await supabase
          .from('properties')
          .select('*')
          .neq('id', propertyData.id)
          .limit(4);

        setSimilarProperties(similarData || []);
        setNearbyProperties(nearbyData || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const imagesWithCats = generateImagesWithCategories();
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
  }, []);

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

  const handleDownloadImages = () => {
    console.log('Downloading images...');
  };

  const handleDownloadPDF = () => {
    console.log('Generating PDF...');
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
              gridTemplateColumns: 'repeat(6, 1fr)',
              gridAutoRows: 'minmax(100px, auto)',
              gap: '0',
              maxHeight: '450px',
              overflow: 'hidden',
              padding: '0',
              margin: '0'
            }}>
              {displayedImages.slice(0, 12).map((imgData, index) => {
                const img = imgData.url;
                const spans = [
                  { col: '1 / 3', row: '1 / 3' },
                  { col: '3 / 5', row: '1 / 4' },
                  { col: '5 / 7', row: '1 / 2' },
                  { col: '1 / 4', row: '3 / 5' },
                  { col: '4 / 5', row: '2 / 4' },
                  { col: '5 / 7', row: '2 / 4' },
                  { col: '1 / 3', row: '5 / 6' },
                  { col: '3 / 5', row: '4 / 6' },
                  { col: '5 / 6', row: '4 / 6' },
                  { col: '6 / 7', row: '4 / 6' },
                  { col: '1 / 3', row: '6 / 7' },
                  { col: '3 / 7', row: '6 / 7' },
                ];

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setShowLightbox(true);
                    }}
                    style={{
                      gridColumn: spans[index].col,
                      gridRow: spans[index].row,
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                  >
                    <Image
                      src={img || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80'}
                      alt={`${property.name} - Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
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
                    unoptimized
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
                unoptimized
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
                ].map((btn, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (btn.text === 'CONTACT US') setShowContactModal(true);
                      else if (btn.text === 'THUMBNAILS') setShowThumbnails(true);
                      else if (btn.text === 'DOWNLOAD IMAGES') handleDownloadImages();
                      else if (btn.text === 'LOCATION PDF') handleDownloadPDF();
                    }}
                    style={{
                      background: 'rgb(225, 25, 33)',
                      color: '#fff',
                      border: '1px solid rgb(225, 25, 33)',
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
                      e.currentTarget.style.background = '#bf151c';
                      e.currentTarget.style.borderColor = '#bf151c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgb(225, 25, 33)';
                      e.currentTarget.style.borderColor = 'rgb(225, 25, 33)';
                    }}
                  >
                    <btn.icon style={{ width: '14px', height: '14px' }} />
                    {btn.text}
                  </button>
                ))}
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
                      unoptimized
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
          {properties.map((prop, index) => (
            <PropertyCard key={prop.id} property={prop} distance={showDistance ? `.${index + 1}2 miles away` : undefined} />
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
          unoptimized
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
          <span style={{ fontSize: '1.5rem', fontWeight: 300, color: '#212529' }}>IMAGE LOCATIONS</span>
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
