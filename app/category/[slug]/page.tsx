'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string;
}

function PropertyCard({ property }: { property: Property }) {
  const images = property.images.length > 0 ? property.images : [property.primary_image || ''];

  return (
    <div className="bg-white overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all">
      <Link href={`/property/${property.id}`}>
        <div className="relative w-full property-image-container">
          <Image
            src={images[0]}
            alt={property.name}
            width={400}
            height={300}
            className="property-image w-full"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="p-4">
          <h5 className="text-lg font-light text-gray-900 mb-1 property-title">
            {property.name}
          </h5>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {property.city}, Texas
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch category details
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (categoryData) {
        setCategory(categoryData);

        // Fetch all properties that have this category
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .contains('categories', [categoryData.name])
          .order('name', { ascending: true });

        if (propertiesData) {
          setProperties(propertiesData);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <>
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
          }

          .category-page-main {
            background: #f8f9fa;
            min-height: 100vh;
            padding-top: 110px;
          }

          .property-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 1.5rem;
          }

          @media (min-width: 640px) {
            .property-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .property-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (min-width: 1345px) {
            .property-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }

          .property-image-container {
            position: relative;
            width: 100%;
          }

          .property-image {
            width: 100%;
            height: auto;
          }

          @media (min-width: 1345px) {
            .property-image {
              height: 230px;
            }
          }

          @media (min-width: 992px) and (max-width: 1344px) {
            .property-image {
              height: 17vw;
            }
          }

          @media (min-width: 768px) and (max-width: 991px) {
            .property-image {
              height: 23vw;
            }
          }

          @media (min-width: 576px) and (max-width: 767px) {
            .property-image {
              height: 35vw;
            }
          }

          @media (max-width: 575px) {
            .property-image {
              height: 60vw;
            }
          }

          .property-title:hover {
            color: #dc2626;
          }
        `}</style>

        <main className="category-page-main">
          <div style={{ maxWidth: '1345px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ height: '200px', background: '#e5e7eb', borderRadius: '0.5rem', marginBottom: '1.5rem' }} />
              <div style={{ height: '2.5rem', background: '#e5e7eb', borderRadius: '0.5rem', width: '40%', marginBottom: '1rem' }} />
              <div style={{ height: '1.5rem', background: '#e5e7eb', borderRadius: '0.5rem', width: '60%' }} />
            </div>
            <div className="property-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ background: '#f3f4f6', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '4/3', background: '#e5e7eb' }} />
                  <div style={{ padding: '1rem' }}>
                    <div style={{ height: '1.25rem', background: '#e5e7eb', borderRadius: '0.25rem', width: '75%', marginBottom: '0.75rem' }} />
                    <div style={{ height: '1rem', background: '#e5e7eb', borderRadius: '0.25rem', width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
          }

          .category-page-main {
            background: #f8f9fa;
            min-height: 100vh;
            padding-top: 110px;
          }
        `}</style>

        <main className="category-page-main">
          <div style={{ maxWidth: '1345px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '1rem', color: '#212529' }}>
              Category Not Found
            </h1>
            <p style={{ fontSize: '1.125rem', fontWeight: 300, color: '#6b7280' }}>
              The category you're looking for doesn't exist.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                marginTop: '2rem',
                padding: '0.75rem 1.5rem',
                background: '#e11921',
                color: 'white',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontWeight: 300
              }}
            >
              Back to Home
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }

        .category-page-main {
          background: #f8f9fa;
          min-height: 100vh;
          padding-top: 110px;
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .property-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .property-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1345px) {
          .property-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .property-image-container {
          position: relative;
          width: 100%;
        }

        .property-image {
          width: 100%;
          height: auto;
        }

        @media (min-width: 1345px) {
          .property-image {
            height: 230px;
          }
        }

        @media (min-width: 992px) and (max-width: 1344px) {
          .property-image {
            height: 17vw;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .property-image {
            height: 23vw;
          }
        }

        @media (min-width: 576px) and (max-width: 767px) {
          .property-image {
            height: 35vw;
          }
        }

        @media (max-width: 575px) {
          .property-image {
            height: 60vw;
          }
        }

        .property-title:hover {
          color: #dc2626;
        }

        .category-banner {
          position: relative;
          height: 250px;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .category-banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2));
        }

        .category-banner-content {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          right: 2rem;
          z-index: 10;
          color: white;
        }
      `}</style>

      <main className="category-page-main">
        <div style={{ maxWidth: '1345px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Category Banner */}
          <div className="category-banner">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover"
            />
            <div className="category-banner-content">
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                Categories
              </p>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>
                {category.name}
              </h1>
              {category.description && (
                <p style={{ fontSize: '1rem', fontWeight: 300, opacity: 0.95 }}>
                  {category.description}
                </p>
              )}
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.9 }}>
                {properties.length} {properties.length === 1 ? 'Location' : 'Locations'}
              </p>
            </div>
          </div>

          {/* Properties Grid */}
          {properties.length > 0 ? (
            <div className="property-grid">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 400, color: '#6b7280', marginBottom: '0.5rem' }}>
                No locations found
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 300, color: '#9ca3af' }}>
                Check back later for new locations in this category
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
