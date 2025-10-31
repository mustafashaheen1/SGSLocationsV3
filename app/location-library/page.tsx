'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

function PropertyCard({ property }: { property: Property }) {
  const images = property.images.length > 0 ? property.images : [property.primary_image || ''];

  return (
    <div className="bg-white overflow-hidden">
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
        <div className="p-3">
          <h5 className="text-lg font-light text-gray-900 mb-1 property-title">
            {property.name}
          </h5>
          <p className="text-sm text-gray-600">
            {property.city}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function LocationLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('exclusives');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: 'exclusives', label: 'Exclusives' },
    { id: 'new', label: 'New' },
    { id: 'most-viewed', label: 'Most Viewed' },
    { id: 'top-categories', label: 'Top Categories' },
    { id: 'all', label: 'All Categories' },
  ];

  useEffect(() => {
    const category = searchParams.get('category') || 'exclusives';
    setActiveCategory(category);
    fetchProperties(category);
  }, [searchParams]);

  const fetchProperties = async (category: string) => {
    setLoading(true);
    let query = supabase.from('properties').select('*').eq('status', 'active');

    if (category === 'exclusives') {
      query = query.eq('is_exclusive', true);
    } else if (category === 'new') {
      query = query.order('created_at', { ascending: false }).limit(20);
    } else if (category === 'most-viewed') {
      query = query.order('created_at', { ascending: false }).limit(20);
    }

    const { data } = await query;
    setProperties(data || []);
    setLoading(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setMobileMenuOpen(false);
    router.push(`/location-library?category=${categoryId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryTitle = () => {
    return categories.find(c => c.id === activeCategory)?.label || 'Exclusives';
  };

  const getSectionTitle = () => {
    const title = getCategoryTitle();
    if (activeCategory === 'top-categories') {
      return 'Top Categories';
    }
    return `All ${title} Locations`;
  };

  const CategoryButton = ({ category }: { category: typeof categories[0] }) => (
    <button
      onClick={() => handleCategoryChange(category.id)}
      className={`w-full text-left py-3 px-4 text-sm font-light uppercase transition-colors ${
        activeCategory === category.id
          ? 'bg-[#dc2626] text-white'
          : 'bg-white text-gray-900 hover:bg-gray-50'
      }`}
    >
      {category.label}
    </button>
  );

  return (
    <>
      <style jsx global>{`
        /* Remove all margins/padding that create white space */
        body {
          margin: 0;
          padding: 0;
        }

        .location-library-main {
          background: #f8f9fa;
          min-height: 100vh;
          padding-top: 110px;
          margin: 0;
          padding-left: 0;
          padding-right: 0;
        }

        .location-library-flex {
          display: flex;
          margin: 0;
          padding: 0;
        }

        /* Sidebar - flush to left edge */
        .location-sidebar {
          width: 200px;
          background: white;
          position: sticky;
          top: 110px;
          height: calc(100vh - 110px);
          overflow-y: auto;
          margin: 0;
          padding: 0;
        }

        /* Main content - no gaps */
        .location-main-content {
          flex: 1;
          width: calc(100% - 200px);
          margin: 0;
          padding: 0;
        }

        /* Property grid */
        .property-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
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

        /* Responsive image heights */
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

        .property-title {
          font-weight: 300;
        }

        .property-title:hover {
          color: #dc2626;
        }

        /* Mobile responsive */
        @media (max-width: 1023px) {
          .location-sidebar {
            display: none;
          }

          .location-main-content {
            width: 100%;
          }
        }

        /* Mobile menu */
        .mobile-filter-button {
          width: 100%;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .mobile-filter-button:hover {
          background: #f9fafb;
        }
      `}</style>

      <main className="location-library-main">
        <div className="location-library-flex">
          {/* Sidebar - Desktop only, flush to left */}
          <aside className="location-sidebar">
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {categories.map(category => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="location-main-content">
            {/* Mobile filter button - ONLY visible below lg (1024px) */}
            <div className="lg:hidden" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem' }}>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="mobile-filter-button"
              >
                <Menu style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Filter by Category
              </button>
            </div>

            {/* Mobile menu modal */}
            {mobileMenuOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
                <div
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div style={{
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '16rem',
                  background: 'white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Categories</h2>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <X style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                  </div>
                  <nav style={{ display: 'flex', flexDirection: 'column' }}>
                    {categories.map(category => (
                      <CategoryButton key={category.id} category={category} />
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* Content area */}
            <div style={{ padding: '2rem 1.5rem' }}>
              {/* Breadcrumbs and title */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Categories / {getCategoryTitle()}
                </p>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  {getCategoryTitle()}
                </h1>
                <h5 style={{ fontSize: '1.25rem', fontWeight: 300, color: '#4b5563' }}>
                  Location Library
                </h5>
              </div>

              {/* Section header */}
              <div style={{ background: '#4a4a4a', color: 'white', padding: '0.75rem 1.5rem', marginBottom: 0 }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  {getSectionTitle()}
                </h2>
              </div>

              {/* Property grid */}
              <div style={{ background: 'white', padding: '1.5rem' }}>
                {loading ? (
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
                ) : activeCategory === 'top-categories' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {['Modern', 'Luxury', 'Historical', 'Natural'].map((cat) => {
                      const catProperties = properties.filter(p =>
                        p.categories.includes(cat)
                      ).slice(0, 8);

                      if (catProperties.length === 0) return null;

                      return (
                        <div key={cat}>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>
                            {cat} Architecture
                          </h3>
                          <div className="property-grid">
                            {catProperties.map(property => (
                              <PropertyCard key={property.id} property={property} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="property-grid">
                    {properties.map(property => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
