'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, Search, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

function PropertyCard({ property }: { property: Property }) {
  const images = property.images.length > 0 ? property.images : [property.primary_image || ''];

  return (
    <div className="bg-white overflow-hidden hover:shadow-md transition-shadow">
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
          <p className="text-sm font-light text-gray-600">
            {property.city}
          </p>
        </div>
      </Link>
    </div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    categories: [],
    permits: [],
    city: [],
    county: [],
    access: [],
    floors: [],
    patioBalconies: [],
    pool: [],
    walls: [],
    yard: [],
  });

  const filterDefinitions: Record<string, { label: string; options: Array<{ name: string; count: number }> }> = {
    categories: {
      label: 'Categories',
      options: [
        { name: 'Modern', count: 450 },
        { name: 'New', count: 320 },
        { name: 'Historical', count: 280 },
        { name: 'Luxury', count: 560 },
        { name: 'Industrial', count: 190 },
        { name: 'Commercial', count: 640 },
        { name: 'Residential', count: 780 },
        { name: 'Natural', count: 420 },
      ],
    },
    permits: {
      label: 'Permits',
      options: [
        { name: 'Available', count: 520 },
        { name: 'Not Available', count: 340 },
      ],
    },
    city: {
      label: 'City',
      options: [
        { name: 'Dallas', count: 380 },
        { name: 'Fort Worth', count: 290 },
        { name: 'Arlington', count: 180 },
        { name: 'Plano', count: 240 },
        { name: 'Irving', count: 160 },
        { name: 'Frisco', count: 150 },
        { name: 'McKinney', count: 130 },
        { name: 'Denton', count: 170 },
      ],
    },
    county: {
      label: 'County',
      options: [
        { name: 'Dallas County', count: 540 },
        { name: 'Tarrant County', count: 420 },
        { name: 'Collin County', count: 360 },
        { name: 'Denton County', count: 280 },
      ],
    },
    access: {
      label: 'Access',
      options: [
        { name: 'Kitchen', count: 680 },
        { name: 'Bathroom', count: 720 },
        { name: 'Driveway', count: 540 },
        { name: 'Garage', count: 480 },
        { name: 'Elevator', count: 220 },
        { name: 'Parking', count: 650 },
      ],
    },
    floors: {
      label: 'Floors',
      options: [
        { name: 'Hardwood', count: 520 },
        { name: 'Tile', count: 460 },
        { name: 'Carpet', count: 380 },
        { name: 'Concrete', count: 340 },
        { name: 'Marble', count: 210 },
        { name: 'Laminate', count: 290 },
      ],
    },
    patioBalconies: {
      label: 'Patio/Balconies',
      options: [
        { name: 'Patio', count: 450 },
        { name: 'Balcony', count: 380 },
        { name: 'Terrace', count: 220 },
        { name: 'Deck', count: 340 },
        { name: 'Rooftop', count: 160 },
      ],
    },
    pool: {
      label: 'Pool',
      options: [
        { name: 'Swimming Pool', count: 420 },
        { name: 'Spa', count: 280 },
        { name: 'Infinity Pool', count: 150 },
        { name: 'Indoor Pool', count: 120 },
        { name: 'Hot Tub', count: 240 },
      ],
    },
    walls: {
      label: 'Walls',
      options: [
        { name: 'Painted', count: 720 },
        { name: 'Brick', count: 380 },
        { name: 'Stone', count: 290 },
        { name: 'Wood Panel', count: 240 },
        { name: 'Concrete', count: 320 },
        { name: 'Exposed Brick', count: 210 },
      ],
    },
    yard: {
      label: 'Yard',
      options: [
        { name: 'Front Yard', count: 540 },
        { name: 'Backyard', count: 620 },
        { name: 'Garden', count: 380 },
        { name: 'Lawn', count: 480 },
        { name: 'Landscaped', count: 420 },
        { name: 'Fenced', count: 350 },
      ],
    },
  };

  useEffect(() => {
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    if (category) {
      setSelectedFilters(prev => ({
        ...prev,
        categories: [category],
      }));
    }

    if (query) {
      setSearchQuery(query);
    }

    fetchProperties();
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };

    if (activeFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilter]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase.from('properties').select('*').eq('status', 'active');

    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    setProperties(data || []);
    setLoading(false);
  };

  const toggleFilter = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[filterType] || [];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Image uploaded:', file);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      console.log('Image dropped:', file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <style jsx global>{`
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
          letter-spacing: -0.02em;
        }

        .font-light {
          font-weight: 300;
        }

        /* Search page layout */
        .search-page-main {
          background: #f8f9fa;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* Search bar */
        .search-bar-container {
          background: white;
          padding: 1.5rem;
          border-bottom: 1px solid #dee2e6;
        }

        .search-input {
          border: 1px solid #ced4da;
          border-radius: 0;
          padding: 0.375rem 0.75rem;
          font-weight: 300;
          width: 100%;
        }

        .search-button {
          background: #e11921;
          color: white;
          border: none;
          padding: 0.375rem 1.5rem;
          border-radius: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-button:hover {
          background: #c01419;
        }

        /* Image search box */
        .image-search-container {
          background: white;
          padding: 3rem 0;
        }

        .image-search-box {
          border: 4px dashed #5B9BD5;
          background-color: #EBF3FB;
          border-radius: 0.5rem;
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .image-search-box:hover {
          background-color: #D6E8F7;
        }

        .image-search-title {
          font-size: 1.5rem;
          font-weight: 300;
          color: #2E5C8A;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .image-search-text {
          font-size: 1rem;
          font-weight: 300;
          color: #6c757d;
        }

        /* Filter dropdowns */
        .filter-bar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 1.5rem;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid #ced4da;
          background: white;
          font-weight: 300;
          font-size: 1rem;
          cursor: pointer;
          border-radius: 0;
        }

        .filter-button:hover {
          background: #f8f9fa;
        }

        .filter-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.25rem;
          background: white;
          border: 1px solid #ced4da;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.13);
          min-width: 300px;
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem;
          z-index: 50;
        }

        .filter-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .filter-option label {
          font-weight: 300;
          font-size: 1rem;
          cursor: pointer;
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Property grid */
        .property-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
        }

        @media (min-width: 576px) {
          .property-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 992px) {
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
          color: #e11921;
        }
      `}</style>

      <main className="search-page-main">
        {/* Search bar */}
        <div className="search-bar-container">
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="search-button" onClick={handleSearch}>
              <Search style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>

        {/* Image search box */}
        <div className="image-search-container">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div
              className="image-search-box"
              onClick={() => document.getElementById('imageUploadInput')?.click()}
              onDrop={handleImageDrop}
              onDragOver={handleDragOver}
            >
              <h2 className="image-search-title">
                Search a Location Using An Image As Reference
              </h2>
              <p className="image-search-text">
                Drag & Drop an image here or click here to select a file
              </p>
              <input
                id="imageUploadInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>

        {/* Horizontal filter dropdowns */}
        <div className="filter-bar" ref={dropdownRef}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(filterDefinitions).map(([key, { label, options }]) => (
              <div key={key} style={{ position: 'relative' }}>
                <button
                  className="filter-button"
                  onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                >
                  <span>{label}</span>
                  <ChevronDown style={{ width: '1rem', height: '1rem' }} />
                </button>

                {activeFilter === key && (
                  <div className="filter-dropdown">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {options.map((option) => (
                        <div key={option.name} className="filter-option">
                          <label>
                            <span>{option.name}</span>
                            <span style={{ color: '#6c757d', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                              ({option.count})
                            </span>
                          </label>
                          <Switch
                            checked={selectedFilters[key]?.includes(option.name)}
                            onCheckedChange={() => toggleFilter(key, option.name)}
                            style={{
                              backgroundColor: selectedFilters[key]?.includes(option.name) ? '#e11921' : undefined
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results area */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Results count */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#212529' }}>
              {properties.length} Locations Found
            </h2>
          </div>

          {/* Property grid */}
          <div style={{ background: 'white', padding: '1.5rem' }}>
            {loading ? (
              <div className="property-grid">
                {[...Array(12)].map((_, i) => (
                  <div key={i} style={{ background: '#f3f4f6', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '4/3', background: '#e5e7eb' }} />
                    <div style={{ padding: '1rem' }}>
                      <div style={{ height: '1.25rem', background: '#e5e7eb', width: '75%', marginBottom: '0.75rem' }} />
                      <div style={{ height: '1rem', background: '#e5e7eb', width: '50%' }} />
                    </div>
                  </div>
                ))}
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
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
