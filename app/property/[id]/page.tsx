'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);

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

  const images = property?.images && property.images.length > 0
    ? property.images
    : property?.primary_image
    ? [property.primary_image]
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
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

  const categoryTags = ['Pool', 'Jacuzzi', 'Hot Tub', 'Patio', 'Kitchen', 'Garden', 'Staircase', 'Gazebo', 'Living Room', 'Bathroom', 'Dining Room'];

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

        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          grid-auto-rows: 20px;
          gap: 3px;
          padding: 0;
          margin: 0;
        }

        .masonry-item {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .masonry-item:hover {
          opacity: 0.9;
        }

        .masonry-item:nth-child(1) { grid-row-end: span 15; }
        .masonry-item:nth-child(2) { grid-row-end: span 20; }
        .masonry-item:nth-child(3) { grid-row-end: span 12; }
        .masonry-item:nth-child(4) { grid-row-end: span 18; }
        .masonry-item:nth-child(5) { grid-row-end: span 10; }
        .masonry-item:nth-child(6) { grid-row-end: span 16; }
        .masonry-item:nth-child(7) { grid-row-end: span 22; }
        .masonry-item:nth-child(8) { grid-row-end: span 14; }
        .masonry-item:nth-child(9) { grid-row-end: span 19; }
      `}</style>

      <main className="min-h-screen bg-white">
        {/* Masonry Image Grid - FULL WIDTH */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div className="masonry-grid">
            {images.slice(0, 9).map((img, index) => (
              <div
                key={index}
                className="masonry-item"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={img}
                  alt={`${property.name} - Image ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              </div>
            ))}
          </div>

          {/* Image Counter - Bottom Right */}
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
            1 / {images.length}
          </div>

          {/* Plus Button - Bottom Left */}
          <button
            onClick={() => setShowThumbnails(true)}
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              width: '48px',
              height: '48px',
              background: '#e11921',
              border: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#bf151c'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e11921'}
          >
            <Plus style={{ width: '24px', height: '24px', color: '#fff' }} />
          </button>
        </div>

        {/* Lightbox Modal */}
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
            {/* Close Button */}
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

            {/* Main Image */}
            <div style={{ position: 'relative', width: '100%', height: '100%', padding: '2rem' }}>
              <Image
                src={images[currentImageIndex]}
                alt={property.name}
                fill
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
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

            {/* Image Counter */}
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
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Category Tags Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '2rem', padding: '1rem 2rem', minWidth: 'max-content' }}>
            {categoryTags.map((tag) => (
              <button
                key={tag}
                style={{
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 300,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#212529'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Property Details Section */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* LEFT COLUMN */}
            <div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 300, color: '#212529', marginBottom: '0.5rem' }}>
                {property.name}
              </h1>

              <p style={{ fontSize: '1.75rem', fontWeight: 300, color: '#6b7280', marginBottom: '1.5rem' }}>
                {property.city}
              </p>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{
                  background: '#3b82f6',
                  color: '#fff',
                  padding: '0.25rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '14px'
                }}>
                  Film
                </span>
                {property.permits_available && (
                  <span style={{
                    background: '#e11921',
                    color: '#fff',
                    padding: '0.25rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '14px'
                  }}>
                    Pull My Permit
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ color: '#4b5563', lineHeight: 1.75, fontWeight: 300, marginBottom: '2rem' }}>
                {property.description || 'Raw industrial space with exposed brick, high ceilings, and dramatic natural light. Perfect for urban scenes and edgy productions.'}
              </p>

              {/* Inquire Button */}
              <button
                style={{
                  background: '#e11921',
                  color: '#fff',
                  padding: '0.75rem 2rem',
                  border: 'none',
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
                INQUIRE ABOUT {property.name.toUpperCase()}
              </button>
            </div>

            {/* RIGHT COLUMN - Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={copyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#fff',
                  border: '2px solid #e11921',
                  color: '#e11921',
                  padding: '0.75rem 1.5rem',
                  fontSize: '14px',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e11921';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#e11921';
                }}
              >
                <Copy style={{ width: '16px', height: '16px' }} />
                COPY
              </button>

              <ActionButton icon={<Mail style={{ width: '16px', height: '16px' }} />} text="CONTACT US" />
              <ActionButton
                icon={<ImageIcon style={{ width: '16px', height: '16px' }} />}
                text="THUMBNAILS"
                onClick={() => setShowThumbnails(true)}
              />
              <ActionButton icon={<Download style={{ width: '16px', height: '16px' }} />} text="DOWNLOAD IMAGES" />
              <ActionButton icon={<FileText style={{ width: '16px', height: '16px' }} />} text="LOCATION PDF" />
            </div>
          </div>
        </div>

        {/* Thumbnails Modal */}
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
                {images.map((img, index) => (
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
                    <Image src={img} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Similar Locations */}
        {similarProperties.length > 0 && (
          <LocationSection
            title="Similar Locations"
            properties={similarProperties}
            bgColor="#f9fafb"
          />
        )}

        {/* Nearby Locations */}
        {nearbyProperties.length > 0 && (
          <LocationSection
            title="Nearby Locations"
            properties={nearbyProperties}
            bgColor="#fff"
            showDistance
          />
        )}

        <Footer />
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

        <div style={{
          position: 'absolute',
          bottom: '0.75rem',
          right: '0.75rem',
          width: '40px',
          height: '40px',
          background: '#e11921',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.3s'
        }}>
          <Search style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
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
