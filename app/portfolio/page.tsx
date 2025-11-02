'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase, Property } from '@/lib/supabase';

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolioItems, setPortfolioItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .limit(30);

      if (data && data.length > 0) {
        setPortfolioItems(data);
      } else {
        setPortfolioItems(getMockProperties());
      }
      setLoading(false);
    }
    fetchProperties();
  }, []);

  const handleVisitLocation = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center" style={{ paddingTop: '110px' }}>
        <div className="text-xl text-gray-600">Loading...</div>
      </main>
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

        .portfolio-grid {
          width: 100%;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
        }

        .portfolio-item {
          position: relative;
          overflow: hidden;
          background-color: #e9ecef;
          flex-grow: 1;
          height: 250px;
        }

        .portfolio-item img {
          transition: transform 0.3s ease;
        }

        .portfolio-item:hover img {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .portfolio-item {
            height: 250px !important;
            flex-basis: calc(50% - 1.5px) !important;
          }
        }

        @media (max-width: 480px) {
          .portfolio-item {
            height: 200px !important;
            flex-basis: 100% !important;
          }

          .portfolio-grid {
            gap: 3px 0;
          }
        }

        h1 {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 100;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .overlay-title {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .visit-btn {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
          letter-spacing: 0.05rem;
          text-transform: uppercase;
        }
      `}</style>

      <main className="min-h-screen bg-white">
        <div style={{ paddingLeft: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#212529', margin: 0 }}>
            Recent Projects
          </h1>
        </div>

        <div className="portfolio-grid">
          {portfolioItems.map((item, index) => {
            const aspectRatio = getAspectRatio(index);
            const image = item.primary_image || item.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

            return (
              <div
                key={item.id}
                className="portfolio-item group cursor-pointer"
                style={{
                  flexBasis: `${aspectRatio * 250}px`
                }}
                onClick={() => handleVisitLocation(item.id)}
              >
                <Image
                  src={image}
                  alt={item.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <h3 className="overlay-title text-white text-xl mb-4 px-4 text-center">
                    {item.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisitLocation(item.id);
                    }}
                    className="visit-btn bg-[#e11921] text-white px-6 py-2 text-sm hover:bg-[#bf151c] transition-colors"
                  >
                    VISIT LOCATION
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

function getAspectRatio(index: number): number {
  const ratios = [1.5, 1.2, 1.8, 0.7, 1.6, 0.8, 1.3, 0.9, 1.4, 1.7, 1.5, 0.6, 1.3, 0.8, 2.0, 1.0, 1.6, 0.9, 1.7, 1.4];
  return ratios[index % ratios.length];
}

function getMockProperties(): Property[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: `mock-${i + 1}`,
    name: `Property ${i + 1}`,
    description: null,
    address: '123 Main St',
    city: 'Dallas',
    county: null,
    zipcode: null,
    property_type: 'Residential',
    square_footage: null,
    lot_size: null,
    bedrooms: null,
    bathrooms: null,
    parking_spaces: null,
    year_built: null,
    features: [],
    categories: [],
    permits_available: false,
    permit_details: null,
    daily_rate: 0,
    images: [],
    primary_image: `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800`,
    status: 'active',
    owner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}
