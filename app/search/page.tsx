'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Upload, ChevronDown, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';

const searchCategories = {
  categories: {
    name: 'Categories',
    options: [
      { text: 'Airport', count: 1 },
      { text: 'Bar/Club/Lounge', count: 5 },
      { text: 'Bathroom', count: 30 },
      { text: 'Beach House', count: 1 },
      { text: 'Bedroom', count: 36 },
      { text: 'Church/Temple', count: 2 },
      { text: 'Commercial Space', count: 9 },
      { text: 'Desert', count: 1 },
      { text: 'Dining Room', count: 21 },
      { text: 'Downtown', count: 12 },
      { text: 'Farm/Ranch', count: 7 },
      { text: 'Garden', count: 15 },
      { text: 'Industrial Warehouse Loft', count: 8 },
      { text: 'Kitchen', count: 28 },
      { text: 'Lake/River', count: 4 },
      { text: 'Living Room', count: 32 },
      { text: 'Mountains', count: 3 },
      { text: 'Office', count: 14 },
      { text: 'Penthouse', count: 6 },
      { text: 'Pool', count: 18 },
      { text: 'Restaurant', count: 11 },
      { text: 'Rooftop', count: 9 },
      { text: 'Studio', count: 13 },
      { text: 'Suburban', count: 24 },
      { text: 'Urban', count: 19 }
    ]
  },
  city: {
    name: 'City',
    options: [
      { text: 'Dallas', count: 45 },
      { text: 'Fort Worth', count: 38 },
      { text: 'Plano', count: 32 },
      { text: 'Frisco', count: 28 },
      { text: 'Arlington', count: 25 },
      { text: 'Irving', count: 22 },
      { text: 'McKinney', count: 20 },
      { text: 'Allen', count: 18 },
      { text: 'Carrollton', count: 16 },
      { text: 'Richardson', count: 15 },
      { text: 'Denton', count: 14 },
      { text: 'Lewisville', count: 12 },
      { text: 'Garland', count: 11 },
      { text: 'Grand Prairie', count: 10 },
      { text: 'Mesquite', count: 9 }
    ]
  },
  county: {
    name: 'County',
    options: [
      { text: 'Dallas County', count: 120 },
      { text: 'Tarrant County', count: 95 },
      { text: 'Collin County', count: 80 },
      { text: 'Denton County', count: 55 }
    ]
  },
  access: {
    name: 'Access',
    options: [
      { text: '24/7 Access', count: 42 },
      { text: 'Business Hours Only', count: 88 },
      { text: 'Flexible Schedule', count: 65 },
      { text: 'Weekend Access', count: 51 }
    ]
  },
  walls: {
    name: 'Walls',
    options: [
      { text: 'Brick', count: 23 },
      { text: 'Concrete', count: 18 },
      { text: 'Exposed Brick', count: 15 },
      { text: 'Glass', count: 12 },
      { text: 'Stone', count: 19 },
      { text: 'White Walls', count: 45 },
      { text: 'Wood Paneling', count: 22 }
    ]
  },
  yard: {
    name: 'Yard',
    options: [
      { text: 'Arbor', count: 8 },
      { text: 'Fountain', count: 12 },
      { text: 'Garden', count: 28 },
      { text: 'Green House', count: 5 },
      { text: 'Hedges', count: 34 },
      { text: 'Large Deck', count: 19 },
      { text: 'Large Lawn', count: 42 },
      { text: 'Palm Trees', count: 15 },
      { text: 'Pond', count: 9 },
      { text: 'Rose Garden', count: 6 },
      { text: 'Stones', count: 22 },
      { text: 'Trees', count: 55 }
    ]
  },
  floors: {
    name: 'Floors',
    options: [
      { text: 'Wood', count: 44 },
      { text: 'Tile', count: 31 },
      { text: 'Concrete', count: 25 },
      { text: 'Dark Wood', count: 17 },
      { text: 'Carpet', count: 13 },
      { text: 'Light Wood', count: 8 },
      { text: 'Linoleum', count: 6 },
      { text: 'White', count: 5 },
      { text: 'Black', count: 4 },
      { text: 'Marble', count: 4 },
      { text: 'Slate', count: 4 },
      { text: 'Cobblestone', count: 3 }
    ]
  },
  pool: {
    name: 'Pool',
    options: [
      { text: 'Traditional', count: 13 },
      { text: 'Modern', count: 9 },
      { text: 'Kidney', count: 5 },
      { text: 'Large', count: 3 },
      { text: 'Empty', count: 1 },
      { text: 'Lagoon', count: 1 },
      { text: 'Lap', count: 1 }
    ]
  },
  patioBalconies: {
    name: 'Patio/Balconies',
    options: [
      { text: 'Furnished', count: 54 },
      { text: 'Large', count: 10 },
      { text: 'With View', count: 13 },
      { text: 'With City View', count: 8 },
      { text: 'With Mountain View', count: 5 }
    ]
  },
  permits: {
    name: 'Permits',
    options: [
      { text: 'Film Permit Available', count: 52 },
      { text: 'Commercial Permit', count: 38 },
      { text: 'Event Permit', count: 24 },
      { text: 'Photography Permit', count: 45 }
    ]
  }
};

interface FilterOption {
  text: string;
  count?: number;
}

function generatePropertyImages(propertyId: string | number, count: number = 50): string[] {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${propertyId}-${i}/800/600`);
  }
  return images;
}

function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const [showLightbox, setShowLightbox] = useState(false);
  const swiperRef = useRef<any>(null);

  const images = generatePropertyImages(property.id, 50);

  return (
    <>
      <article className="il-search-result">
        <div className="il-react-carousel">
          <div className="swiper-container-wrapper" style={{ position: 'relative' }}>
            <Swiper
              modules={[Navigation, Scrollbar, FreeMode]}
              spaceBetween={3}
              slidesPerView={1}
              freeMode={false}
              loop={false}
              navigation={{
                prevEl: `.nav-prev-${property.id}`,
                nextEl: `.nav-next-${property.id}`,
              }}
              scrollbar={{
                el: `.scrollbar-${property.id}`,
                draggable: true,
                dragClass: 'swiper-scrollbar-drag',
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              style={{
                width: '100%',
                height: '300px',
              }}
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <Link href={`/property/${property.id}`}>
                    <img
                      src={img}
                      alt={`${property.name} - ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300';
                      }}
                    />
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className={`swiper-button-prev nav-prev-${property.id}`}></div>
            <div className={`swiper-button-next nav-next-${property.id}`}></div>

            <div className={`swiper-scrollbar scrollbar-${property.id}`}></div>
          </div>

          <div style={{ padding: '12px 0', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: 400,
                marginBottom: '4px',
                fontFamily: 'acumin-pro-wide, sans-serif',
                margin: 0
              }}>
                <Link
                  href={`/property/${property.id}`}
                  style={{ color: '#212529', textDecoration: 'none' }}
                >
                  {property.name}
                </Link>
              </h5>
              <p style={{
                fontSize: '14px',
                color: '#6c757d',
                marginBottom: 0,
                fontFamily: 'acumin-pro-wide, sans-serif',
                margin: 0
              }}>
                {property.city}
              </p>
            </div>

            <button
              onClick={() => setShowLightbox(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginLeft: '12px',
                flexShrink: 0
              }}
            >
              <svg
                width="25"
                height="25"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                style={{ color: 'rgb(225, 25, 33)', display: 'block' }}
              >
                <path
                  fill="currentColor"
                  d="M319.8 204v8c0 6.6-5.4 12-12 12h-84v84c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12v-84h-84c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h84v-84c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v84h84c6.6 0 12 5.4 12 12zm188.5 293L497 508.3c-4.7 4.7-12.3 4.7-17 0l-129-129c-2.3-2.3-3.5-5.3-3.5-8.5v-8.5C310.6 395.7 261.7 416 208 416 93.8 416 1.5 324.9 0 210.7-1.5 93.7 93.7-1.5 210.7 0 324.9 1.5 416 93.8 416 208c0 53.7-20.3 102.6-53.7 139.5h8.5c3.2 0 6.2 1.3 8.5 3.5l129 129c4.7 4.7 4.7 12.3 0 17zM384 208c0-97.3-78.7-176-176-176S32 110.7 32 208s78.7 176 176 176 176-78.7 176-176z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </article>

      {showLightbox && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            zIndex: 9999,
            overflow: 'auto',
            padding: '40px 20px'
          }}
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10001
            }}
          >
            <X size={32} color="#212529" strokeWidth={2} />
          </button>

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#212529',
              marginBottom: '30px',
              fontFamily: 'acumin-pro-wide, sans-serif'
            }}>
              {property.name}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '16px'
            }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <img
                    src={img}
                    alt={`${property.name} ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '140px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                    onClick={() => router.push(`/property/${property.id}`)}
                  />
                  <div style={{
                    fontSize: '14px',
                    color: '#6c757d',
                    fontFamily: 'acumin-pro-wide, sans-serif'
                  }}>
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ category: string; values: string[] }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const query = searchParams.get('q');

      let supabaseQuery = supabase.from('properties').select('*').eq('status', 'active');

      if (query) {
        supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
      }

      const { data } = await supabaseQuery;
      if (data) {
        setProperties(data);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
  };

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const existingFilter = prev.find(f => f.category === category);
      if (existingFilter) {
        const newValues = existingFilter.values.includes(value)
          ? existingFilter.values.filter(v => v !== value)
          : [...existingFilter.values, value];

        if (newValues.length === 0) {
          return prev.filter(f => f.category !== category);
        }

        return prev.map(f =>
          f.category === category ? { ...f, values: newValues } : f
        );
      }
      return [...prev, { category, values: [value] }];
    });
  };

  const isFilterActive = (category: string, value: string) => {
    const filter = activeFilters.find(f => f.category === category);
    return filter ? filter.values.includes(value) : false;
  };

  const removeFilterValue = (category: string, value: string) => {
    toggleFilter(category, value);
  };

  const getCurrentPageItems = () => {
    const start = (currentPage - 1) * 24;
    return properties.slice(start, start + 24);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600&display=swap');

        .search-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #fff;
          min-height: 100vh;
          padding-top: 60px;
        }

        .image-upload-section {
          margin-top: 0;
          background: white;
          padding: 30px 16px;
          border-bottom: 1px solid #e5e5e5;
        }

        .image-upload-box {
          max-width: 1425px;
          height: 100px;
          margin: 0 auto;
          border: 2px dashed #3b9cd9;
          border-radius: 4px;
          padding-left: 16px;
          padding-right: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f0f8ff;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }

        .upload-title {
          font-family: 'Nunito', 'acumin-pro-wide', sans-serif;
          font-size: 16px;
          font-weight: 300;
          color: rgb(33, 37, 41);
          line-height: 24px;
          margin-bottom: 8px;
          text-align: center;
          display: block;
          -webkit-font-smoothing: antialiased;
        }

        .upload-subtitle {
          font-family: 'Nunito', 'acumin-pro-wide', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgb(33, 37, 41);
          line-height: 20px;
          text-align: center;
          display: block;
          -webkit-font-smoothing: antialiased;
        }

        .image-upload-box.dragging {
          background: #e6f3ff;
          border-color: #2980b9;
        }

        .image-upload-box:hover {
          background: #e6f3ff;
        }

        .hidden-input {
          display: none;
        }

        .filter-bar {
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 20px;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 0 auto;
        }

        .filter-dropdown {
          position: relative;
        }

        .dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          color: #6c757d;
          transition: all 0.2s;
        }

        .dropdown-toggle:hover {
          background: #f8f9fa;
        }

        .dropdown-toggle.has-active {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.175);
          min-width: 200px;
          max-width: 280px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1050;
        }

        .dropdown-header {
          padding: 10px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .dropdown-content {
          padding: 8px 0;
        }

        .option-item {
          padding: 8px 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 14px;
        }

        .option-item:hover {
          background-color: #f8f9fa;
        }

        .toggle-switch {
          width: 40px;
          height: 20px;
          background-color: #ccc;
          border-radius: 10px;
          position: relative;
          transition: background-color 0.3s;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .toggle-switch.active {
          background-color: #28a745;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: white;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }

        .toggle-switch.active::after {
          transform: translateX(20px);
        }

        .option-text {
          flex: 1;
          color: #495057;
        }

        .option-count {
          color: #6c757d;
          font-size: 12px;
        }

        .main-search-container {
          padding: 20px;
          background: #f8f9fa;
        }

        .main-search-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        .main-search-input {
          width: 100%;
          padding: 12px 40px 12px 45px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 16px;
        }

        .main-search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .filter-pills {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .filter-pill-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          color: #495057;
          font-weight: 500;
        }

        .filter-value {
          background: #6c757d;
          color: white;
          padding: 4px 10px;
          border-radius: 3px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .filter-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }


        .swiper-button-prev,
        .swiper-button-next {
          position: absolute !important;
          top: 0 !important;
          bottom: 18px !important;
          width: 60px !important;
          height: calc(100% - 18px) !important;
          margin-top: 0 !important;
          z-index: 10 !important;
          cursor: pointer !important;
          color: white !important;
        }

        .swiper-button-prev {
          left: 0 !important;
          right: auto !important;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-next {
          right: 0 !important;
          left: auto !important;
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-prev:hover {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-next:hover {
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .swiper-button-prev:after,
        .swiper-button-next:after {
          font-size: 8px !important;
          font-weight: 400 !important;
          font-family: swiper-icons !important;
          line-height: 1 !important;
        }

        .swiper-scrollbar {
          position: absolute !important;
          background: rgb(222, 226, 230) !important;
          border-radius: 10px !important;
          bottom: 4px !important;
          height: 8px !important;
          left: 1% !important;
          width: 98% !important;
          z-index: 50 !important;
        }

        .swiper-scrollbar-drag {
          background: rgb(225, 25, 33) !important;
          border-radius: 10px !important;
          height: 8px !important;
          width: 6.15625px !important;
          cursor: grab !important;
          position: relative !important;
        }

        .swiper-scrollbar-drag:active {
          cursor: grabbing !important;
        }

        .swiper-container-wrapper {
          position: relative;
          width: 100%;
        }

        .il-search-result {
          background: white;
          overflow: visible;
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
          max-width: 1425px;
          margin: 0 auto;
        }
      `}</style>

      <div className="search-page">
        <div className="image-upload-section">
          <div
            className={`image-upload-box ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <h2 className="upload-title">Search a Location Using An Image As Reference</h2>
            <p className="upload-subtitle">Drag & Drop an image here or click here to select a file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden-input"
            />
          </div>
        </div>

        <div className="filter-bar" ref={dropdownRef}>
          <div className="filter-row">
            {Object.entries(searchCategories).map(([key, category]) => {
              const hasActive = activeFilters.find(f => f.category === category.name)?.values.length || 0;

              return (
                <div key={key} className="filter-dropdown">
                  <button
                    className={`dropdown-toggle ${hasActive > 0 ? 'has-active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                  >
                    <span>{category.name}</span>
                    <ChevronDown size={16} />
                  </button>

                  {openDropdown === key && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">{category.name}</div>
                      <div className="dropdown-content">
                        {category.options.map((option, idx) => (
                          <div
                            key={idx}
                            className="option-item"
                            onClick={() => toggleFilter(category.name, option.text)}
                          >
                            <div className={`toggle-switch ${isFilterActive(category.name, option.text) ? 'active' : ''}`} />
                            <span className="option-text">{option.text}</span>
                            {'count' in option && option.count && (
                              <span className="option-count">{option.count}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="main-search-container">
          <div className="main-search-wrapper">
            <Search className="main-search-icon" size={20} />
            <input
              type="text"
              className="main-search-input"
              placeholder="Search locations..."
              defaultValue={searchParams.get('q') || ''}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value;
                  router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
                }
              }}
            />
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="filter-pills">
            {activeFilters.map(filter => (
              <div key={filter.category} className="filter-pill-group">
                <span className="filter-label">{filter.category}:</span>
                {filter.values.map(value => (
                  <span key={value} className="filter-value">
                    {value}
                    <button
                      className="filter-remove"
                      onClick={() => removeFilterValue(filter.category, value)}
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="property-grid">
            {getCurrentPageItems().map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
