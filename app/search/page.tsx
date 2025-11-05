'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Upload, ChevronDown, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

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

function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const images = property.images && property.images.length > 0
    ? property.images
    : property.primary_image
    ? [property.primary_image]
    : ['https://via.placeholder.com/400x300'];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleCardClick = () => {
    router.push(`/property/${property.id}`);
  };

  const handleMagnifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowLightbox(true);
  };

  return (
    <>
      <div
        className="property-card"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ cursor: 'pointer' }}
      >
        <div
          className="property-image-container"
          style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}
          onClick={handleCardClick}
        >
          <img
            src={images[currentImageIndex]}
            alt={property.name}
            className="property-image"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/400x300/808080/ffffff?text=${property.name}`;
            }}
          />

          {images.length > 1 && isHovering && (
            <>
              <div
                className="nav-arrow nav-arrow-left"
                onClick={prevImage}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: '18px',
                  left: 0,
                  width: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0))'
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </div>

              <div
                className="nav-arrow nav-arrow-right"
                onClick={nextImage}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: '18px',
                  right: 0,
                  width: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  background: 'linear-gradient(270deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0))'
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </>
          )}

          <div
            className="magnify-icon"
            onClick={handleMagnifyClick}
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '12px',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              border: '2px solid #e11921'
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e11921"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>

          {images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '18px',
                background: 'rgba(128, 128, 128, 0.6)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px'
              }}
            >
              <div style={{ width: '100%', height: '4px', background: 'rgba(200, 200, 200, 0.5)', borderRadius: '2px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${((currentImageIndex + 1) / images.length) * 100}%`,
                    background: '#e11921',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="property-info" onClick={handleCardClick}>
          <h3 className="property-title">{property.name}</h3>
          <p className="property-location">{property.city}</p>
        </div>
      </div>

      {showLightbox && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10001
            }}
          >
            <X size={24} color="white" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              background: 'white',
              padding: '20px',
              borderRadius: '8px'
            }}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>{property.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${property.name} ${idx + 1}`}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                  onClick={() => {
                    setCurrentImageIndex(idx);
                    setShowLightbox(false);
                  }}
                />
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

        .property-grid {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .property-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .property-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .property-info {
          padding: 15px;
        }

        .property-title {
          font-size: 16px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 5px;
        }

        .property-location {
          font-size: 14px;
          color: #6c757d;
        }

        .nav-arrow-left:hover {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .nav-arrow-right:hover {
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0)) !important;
        }

        .magnify-icon:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }

        .property-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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
