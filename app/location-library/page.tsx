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
    <li className="col-sm-6 col-lg-4 col-xl-3 px-2 mb-3">
      <Link href={`/property/${property.id}`} className="property-card">
        <div className="order-first">
          <Image
            src={images[0]}
            alt={property.name}
            width={400}
            height={300}
            className="property-image"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <h5 className="mb-0 w-100 mt-2 pr-md-5 font-weight-light text-dark property-title">
          {property.name}
        </h5>
        <p className="small mb-2 w-100 property-city">
          {property.city}
        </p>
      </Link>
    </li>
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
    <h6
      onClick={() => handleCategoryChange(category.id)}
      className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
      style={{ cursor: 'pointer' }}
    >
      {category.label}
    </h6>
  );

  return (
    <>
      <style jsx global>{`
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
          letter-spacing: -0.02em;
        }

        .font-weight-light {
          font-weight: 300;
        }

        /* Sidebar */
        .sidebar {
          width: 200px;
          background: white;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        .category-button {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          letter-spacing: 0.05rem;
          text-align: left;
          background: white;
          color: #212529;
          margin: 0;
          border: none;
          transition: all 0.2s;
          font-weight: 400;
        }

        .category-button.active {
          background: #e11921;
          color: white;
        }

        .category-button:not(.active):hover {
          background: #f8f9fa;
        }

        /* Main content area */
        .main-content {
          width: calc(100% - 200px);
          margin-left: 200px;
        }

        /* Breadcrumbs */
        .breadcrumb {
          background: transparent;
          padding: 0;
          margin-bottom: 0;
        }

        /* Page header */
        .page-title {
          font-size: 2.5rem;
          display: inline-block;
          width: 100%;
          font-weight: 300;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 1.25rem;
          display: inline-block;
          width: 100%;
          font-weight: 300;
        }

        /* Property grid */
        .property-grid {
          display: flex;
          flex-wrap: wrap;
          list-style: none;
          padding: 0;
          margin: 0 -15px;
        }

        .col-sm-6 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }

        @media (min-width: 576px) {
          .col-sm-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }

        @media (min-width: 992px) {
          .col-lg-4 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
        }

        @media (min-width: 1345px) {
          .col-xl-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }

        .px-2 {
          padding-left: 15px;
          padding-right: 15px;
        }

        .mb-3 {
          margin-bottom: 1rem;
        }

        /* Property card */
        .property-card {
          display: block;
          text-decoration: none;
          background: transparent;
        }

        .property-image {
          width: 100%;
          height: auto;
        }

        /* Responsive image heights */
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
          font-size: 1.25rem;
          color: #212529;
          font-weight: 300;
        }

        .property-title:hover {
          color: #e11921;
        }

        .property-city {
          color: #6c757d;
          font-size: 0.875rem;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .sidebar {
            position: static;
            width: 100%;
            height: auto;
          }

          .main-content {
            width: 100%;
            margin-left: 0;
          }
        }

        /* Remove white space at top */
        .location-library-main {
          background: #f8f9fa;
          min-height: 100vh;
        }
      `}</style>

      <main className="location-library-main">
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <aside className="sidebar d-none d-lg-block">
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {categories.map(category => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </nav>
          </aside>

          <div className="main-content" style={{ flex: 1 }}>
            <div className="d-lg-none" style={{ background: 'white', borderBottom: '1px solid #dee2e6', padding: '1rem' }}>
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  cursor: 'pointer'
                }}
              >
                <Menu style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Filter by Category
              </button>
            </div>

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
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Categories</h2>
                    <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
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

            <div style={{ padding: '2rem 1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p className="breadcrumb" style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                  Categories / {getCategoryTitle()}
                </p>
                <h1 className="page-title">{getCategoryTitle()}</h1>
                <h5 className="page-subtitle">Location Library</h5>
              </div>

              <div style={{ background: '#4a4a4a', color: 'white', padding: '0.75rem 1.5rem', marginBottom: 0 }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{getSectionTitle()}</h2>
              </div>

              <div style={{ background: 'white', padding: '1.5rem' }}>
                {loading ? (
                  <ul className="property-grid">
                    {[...Array(12)].map((_, i) => (
                      <li key={i} className="col-sm-6 col-lg-4 col-xl-3 px-2 mb-3">
                        <div style={{ background: '#f8f9fa', borderRadius: '0.5rem', overflow: 'hidden' }}>
                          <div style={{ aspectRatio: '4/3', background: '#e9ecef' }} />
                          <div style={{ padding: '1rem' }}>
                            <div style={{ height: '1.25rem', background: '#e9ecef', borderRadius: '0.25rem', width: '75%', marginBottom: '0.75rem' }} />
                            <div style={{ height: '1rem', background: '#e9ecef', borderRadius: '0.25rem', width: '50%' }} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : activeCategory === 'top-categories' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {['Modern', 'Luxury', 'Historical', 'Natural'].map((cat) => {
                      const catProperties = properties.filter(p =>
                        p.categories.includes(cat)
                      ).slice(0, 8);

                      if (catProperties.length === 0) return null;

                      return (
                        <div key={cat}>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#212529', marginBottom: '1.5rem' }}>
                            {cat} Architecture
                          </h3>
                          <ul className="property-grid">
                            {catProperties.map(property => (
                              <PropertyCard key={property.id} property={property} />
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="property-grid">
                    {properties.map(property => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
