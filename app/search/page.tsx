'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Upload, ChevronDown, X } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

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
      { text: 'Estate', count: 12 },
      { text: 'Exterior', count: 42 },
      { text: 'Farm/Ranch', count: 3 },
      { text: 'Garden', count: 15 },
      { text: 'Gym/Fitness', count: 2 },
      { text: 'Historical', count: 5 },
      { text: 'Hospital/Medical', count: 1 },
      { text: 'Hotel', count: 3 },
      { text: 'Industrial', count: 7 },
      { text: 'Kitchen', count: 28 },
      { text: 'Lake House', count: 4 },
      { text: 'Living Room', count: 32 },
      { text: 'Loft', count: 5 },
      { text: 'Mansion', count: 8 },
      { text: 'Mid-Century Modern', count: 6 },
      { text: 'Modern', count: 15 },
      { text: 'Mountain', count: 2 },
      { text: 'Office', count: 11 },
      { text: 'Outdoor Space', count: 10 },
      { text: 'Park', count: 4 },
      { text: 'Pool', count: 18 },
      { text: 'Restaurant', count: 6 },
      { text: 'Retail/Store', count: 7 },
      { text: 'Rustic', count: 9 },
      { text: 'School/University', count: 4 },
      { text: 'Sports Facility', count: 3 },
      { text: 'Traditional', count: 14 },
      { text: 'Urban', count: 12 },
      { text: 'Warehouse', count: 5 }
    ]
  },
  permits: {
    name: 'Permits',
    options: [
      { text: 'Film Permit Available' },
      { text: 'No Permit Required' },
      { text: 'Permit Assistance Available' }
    ]
  },
  city: {
    name: 'City',
    options: [
      { text: 'Arlington' },
      { text: 'Carrollton' },
      { text: 'Cedar Hill' },
      { text: 'Dallas' },
      { text: 'Denton' },
      { text: 'DeSoto' },
      { text: 'Flower Mound' },
      { text: 'Fort Worth' },
      { text: 'Frisco' },
      { text: 'Garland' },
      { text: 'Grand Prairie' },
      { text: 'Grapevine' },
      { text: 'Irving' },
      { text: 'Lancaster' },
      { text: 'Lewisville' },
      { text: 'McKinney' },
      { text: 'Mesquite' },
      { text: 'Plano' },
      { text: 'Richardson' },
      { text: 'Rowlett' }
    ]
  },
  county: {
    name: 'County',
    options: [
      { text: 'Collin' },
      { text: 'Dallas' },
      { text: 'Denton' },
      { text: 'Ellis' },
      { text: 'Johnson' },
      { text: 'Kaufman' },
      { text: 'Parker' },
      { text: 'Rockwall' },
      { text: 'Tarrant' },
      { text: 'Wise' }
    ]
  },
  access: {
    name: 'Access',
    options: [
      { text: '24/7 Access' },
      { text: 'Business Hours Only' },
      { text: 'Flexible Schedule' },
      { text: 'Weekend Access' }
    ]
  },
  floors: {
    name: 'Floors',
    options: [
      { text: 'Single Story' },
      { text: 'Two Story' },
      { text: 'Three+ Stories' },
      { text: 'Multi-Level' },
      { text: 'Ground Floor Only' }
    ]
  },
  patioBalconies: {
    name: 'Patio Balconies',
    options: [
      { text: 'Balcony' },
      { text: 'Covered Patio' },
      { text: 'Open Patio' },
      { text: 'Rooftop Deck' },
      { text: 'Terrace' }
    ]
  },
  pool: {
    name: 'Pool',
    options: [
      { text: 'Indoor Pool' },
      { text: 'Infinity Pool' },
      { text: 'Lap Pool' },
      { text: 'No Pool' },
      { text: 'Outdoor Pool' },
      { text: 'Pool with Spa' }
    ]
  },
  walls: {
    name: 'Walls',
    options: [
      { text: 'Brick' },
      { text: 'Concrete' },
      { text: 'Exposed Brick' },
      { text: 'Glass' },
      { text: 'Stone' },
      { text: 'White Walls' },
      { text: 'Wood Paneling' }
    ]
  },
  yard: {
    name: 'Yard',
    options: [
      { text: 'Large Backyard' },
      { text: 'Small Yard' },
      { text: 'No Yard' },
      { text: 'Landscaped' },
      { text: 'Natural/Wild' }
    ]
  }
};

interface FilterOption {
  text: string;
  count?: number;
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
        .search-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #fff;
          min-height: 100vh;
          padding-top: 60px;
        }

        .image-upload-section {
          margin-top: 0;
          background: white;
          padding: 30px 20px;
          border-bottom: 1px solid #e5e5e5;
        }

        .image-upload-box {
          max-width: 1200px;
          margin: 0 auto;
          border: 2px dashed #3b9cd9;
          border-radius: 4px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f0f8ff;
        }

        .image-upload-box.dragging {
          background: #e6f3ff;
          border-color: #2980b9;
        }

        .image-upload-box:hover {
          background: #e6f3ff;
        }

        .upload-title {
          font-size: 20px;
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 12px;
        }

        .upload-subtitle {
          font-size: 16px;
          color: #5a6c7d;
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
              <div key={property.id} className="property-card">
                <Link href={`/property/${property.id}`}>
                  <img
                    src={property.primary_image || property.images[0] || 'https://via.placeholder.com/400x300'}
                    alt={property.name}
                    className="property-image"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/400x300/808080/ffffff?text=${property.name}`;
                    }}
                  />
                  <div className="property-info">
                    <h3 className="property-title">{property.name}</h3>
                    <p className="property-location">{property.city}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
