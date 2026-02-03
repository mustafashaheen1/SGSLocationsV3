'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import { sortLocationsByExclusivity } from '@/lib/utils';

function PropertyCard({ property }: { property: Property }) {
  const images = property.images.length > 0 ? property.images : [property.primary_image || ''];

  return (
    <div className="bg-white overflow-hidden">
      <Link href={`/property/${property.id}`}>
        <div className="relative w-full property-image-container">
          <Image
            src={images[0]}
            alt={property.public_name || property.name}
            width={400}
            height={300}
            className="property-image w-full"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="p-3">
          <h5 className="text-lg font-light text-gray-900 mb-1 property-title">
            {property.public_name || property.name}
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
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  // Permanent tabs (always shown)
  const permanentCategories = [
    { id: 'exclusives', label: 'Exclusives', type: 'permanent' },
    { id: 'new', label: 'New', type: 'permanent' },
    { id: 'most-viewed', label: 'Most Viewed', type: 'permanent' },
  ];

  // Convert sub-categories to tab format
  const subCategoryTabs = subCategories.map(cat => ({
    id: cat.slug,
    label: cat.name,
    type: 'subcategory',
    categoryId: cat.id,
  }));

  // Merge: permanent tabs first, then sub-categories
  const categories = [...permanentCategories, ...subCategoryTabs];

  const fetchEnabledSubCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('show_in_location_library', true)
      .eq('is_active', true)
      .not('parent_id', 'is', null) // Only sub-categories
      .order('display_order');

    setSubCategories(data || []);
  };

  useEffect(() => {
    fetchEnabledSubCategories();
  }, []);

  useEffect(() => {
    const category = searchParams.get('category') || 'exclusives';

    // Validate category exists after sub-categories are loaded
    if (subCategories.length > 0) {
      const validCategory = categories.find(c => c.id === category);
      if (!validCategory) {
        router.push('/location-library?category=exclusives');
        return;
      }
    }

    setActiveCategory(category);
    fetchProperties(category);
  }, [searchParams, subCategories]);

  const fetchProperties = async (category: string) => {
    setLoading(true);
    let query = supabase.from('properties').select('*').eq('status', 'active');

    if (category === 'exclusives') {
      // Show all exclusive properties in alphabetical order
      query = query.eq('is_exclusive', true).order('name', { ascending: true });
    } else if (category === 'new') {
      // Show latest 8 properties from newest to oldest
      query = query.order('created_at', { ascending: false }).limit(8);
    } else if (category === 'most-viewed') {
      // Show properties with more than 5 views, sorted from most to least viewed
      query = query.gt('view_count', 5).order('view_count', { ascending: false });
    } else if (category === 'top-categories') {
      // Fetch top categories instead of properties
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_top', true)
        .eq('is_active', true)
        .order('display_order');

      setTopCategories(categoriesData || []);
      setProperties([]);
      setLoading(false);
      return;
    } else {
      // Handle sub-category filtering
      const subCat = subCategories.find(sc => sc.slug === category);
      if (subCat) {
        query = query.eq('sub_category_id', subCat.id).order('name', { ascending: true });
      } else {
        // Fallback to exclusives if invalid category
        query = query.eq('is_exclusive', true).order('name', { ascending: true });
      }
    }

    const { data } = await query;
    setProperties(data || []);
    setTopCategories([]);
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
          ? 'bg-[#fe751f] text-white'
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

        @media (max-width: 767px) {
          .location-library-main {
            padding-top: 70px;
          }
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
          color: #fe751f;
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

        /* Content area padding */
        .content-area-padding {
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .content-area-padding {
            padding: 2rem 1.5rem;
          }
        }

        /* Responsive typography */
        .library-title {
          font-size: 1.875rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        @media (min-width: 640px) {
          .library-title {
            font-size: 2.5rem;
          }
        }

        .library-subtitle {
          font-size: 1rem;
          font-weight: 300;
          color: #4b5563;
        }

        @media (min-width: 640px) {
          .library-subtitle {
            font-size: 1.25rem;
          }
        }

        /* Property grid container */
        .property-grid-container {
          background: white;
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .property-grid-container {
            padding: 1.5rem;
          }
        }

        /* Section header */
        .section-header {
          background: #4a4a4a;
          color: white;
          padding: 0.75rem 1rem;
          margin-bottom: 0;
        }

        @media (min-width: 768px) {
          .section-header {
            padding: 0.75rem 1.5rem;
          }
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
            <div className="content-area-padding">
              {/* Breadcrumbs and title */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Categories / {getCategoryTitle()}
                </p>
                <h1 className="library-title">
                  {getCategoryTitle()}
                </h1>
                <h5 className="library-subtitle">
                  Location Library
                </h5>
              </div>

              {/* Section header */}
              <div className="section-header">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  {getSectionTitle()}
                </h2>
              </div>

              {/* Property grid */}
              <div className="property-grid-container">
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
                  topCategories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
                      <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 400 }}>No Top Categories</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 300 }}>Admin hasn't selected any top categories yet</p>
                    </div>
                  ) : (
                    <div className="property-grid">
                      {topCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/search?category=${category.slug}`}
                          className="bg-white overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="relative w-full property-image-container">
                            <Image
                              src={category.image || 'https://via.placeholder.com/400x300?text=' + category.name}
                              alt={category.name}
                              width={400}
                              height={300}
                              className="property-image w-full"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div className="p-3">
                            <h5 className="text-lg font-light text-gray-900 mb-1 property-title">
                              {category.name}
                            </h5>
                            {category.description && (
                              <p className="text-sm text-gray-600">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                ) : properties.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 400 }}>No properties found</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 300 }}>Try selecting a different category</p>
                  </div>
                ) : activeCategory === 'top-categories-old' ? (
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
