'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase, Project } from '@/lib/supabase';

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolioItems, setPortfolioItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('status', 'active')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setPortfolioItems(data);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const handleVisitLocation = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center pt-16 md:pt-20 lg:pt-28">
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

        /* Additional mobile improvements */
        @media (max-width: 767px) {
          main h1 {
            font-size: 1.875rem !important;
          }

          main > div {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          main h1 {
            font-size: 1.5rem !important;
          }
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
            const image = item.banner_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';

            return (
              <div
                key={item.id}
                className={`portfolio-item group ${item.property_id ? 'cursor-pointer' : ''}`}
                style={{
                  flexBasis: `${aspectRatio * 250}px`
                }}
                onClick={() => item.property_id && handleVisitLocation(item.property_id)}
              >
                <Image
                  src={image}
                  alt={item.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized={image.includes('unsplash.com') || image.includes('placeholder.com')}
                />

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <h3 className="overlay-title text-white text-xl mb-4 px-4 text-center">
                    {item.name}
                  </h3>
                  {item.property_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.property_id) {
                          handleVisitLocation(item.property_id);
                        }
                      }}
                      className="visit-btn bg-brand text-white px-6 py-2 text-sm hover:bg-[#e65a00] transition-colors"
                    >
                      VISIT LOCATION
                    </button>
                  )}
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
