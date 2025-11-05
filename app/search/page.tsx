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
      { text: 'Modern', count: 25 },
      { text: 'Ranch', count: 18 },
      { text: 'Colonial', count: 12 },
      { text: 'Victorian', count: 8 },
      { text: 'Contemporary', count: 22 },
      { text: 'Traditional', count: 15 },
      { text: 'Spanish', count: 10 },
      { text: 'Mediterranean', count: 9 },
      { text: 'Industrial', count: 14 },
      { text: 'Loft', count: 11 }
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
      { text: 'Richardson', count: 15 }
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
  propertyType: {
    name: 'Property Type',
    options: [
      { text: 'Residential', count: 180 },
      { text: 'Commercial', count: 65 },
      { text: 'Industrial', count: 35 },
      { text: 'Land', count: 28 },
      { text: 'Historical', count: 12 }
    ]
  },
  features: {
    name: 'Features',
    options: [
      { text: 'Pool', count: 85 },
      { text: 'Garage', count: 145 },
      { text: 'Fireplace', count: 92 },
      { text: 'Hardwood Floors', count: 110 },
      { text: 'Updated Kitchen', count: 78 },
      { text: 'Backyard', count: 125 },
      { text: 'Patio', count: 95 }
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
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
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
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openDropdown]);

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

  const getFilteredOptions = (category: string, options: FilterOption[]) => {
    const searchTerm = searchTerms[category]?.toLowerCase() || '';
    if (!searchTerm) return options;
    return options.filter(opt => opt.text.toLowerCase().includes(searchTerm));
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600&display=swap');

        .search-page {
          font-family: acumin-pro-wide, sans-serif;
          background: #fff;
          min-height: 100vh;
          font-size: 16px;
          font-weight: 300;
          line-height: 24px;
          color: rgb(33, 37, 41);
          -webkit-font-smoothing: antialiased;
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

        .il-search-options-container {
          display: block;
          font-family: acumin-pro-wide, sans-serif;
          font-size: 16px;
          font-weight: 300;
          line-height: 24px;
          margin-bottom: 16px;
          order: -1;
          color: rgb(33, 37, 41);
          -webkit-font-smoothing: antialiased;
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 16px 20px;
        }

        .il-filter-row {
          display: flex;
          align-items: flex-end;
          gap: 0;
          flex-wrap: wrap;
          max-width: 1425px;
          margin: 0 auto;
        }

        .il-drop-down-container {
          position: relative;
          display: inline-block;
        }

        .il-btn-trigger {
          display: flex;
          align-items: flex-end;
          margin-right: 8px;
          background-color: rgba(0, 0, 0, 0);
          border: 0px none;
          border-radius: 3.2px;
          color: rgb(108, 117, 125);
          font-family: acumin-pro-wide, sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 21px;
          padding: 4px 8px;
          cursor: pointer;
          transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
                      border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          text-align: center;
          user-select: none;
          vertical-align: middle;
          -webkit-font-smoothing: antialiased;
        }

        .il-btn-trigger:hover {
          background-color: #f8f9fa;
        }

        .il-drop-down-label {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
          font-size: 14px;
          line-height: 21px;
        }

        .il-dropdown-icon {
          width: 12px;
          height: 12px;
          margin-left: 8px;
        }

        .il-pop-over {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.3rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.175);
          min-width: 200px;
          max-width: 280px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1050;
        }

        .il-pop-over.d-none {
          display: none !important;
        }

        .popover-body {
          padding: 0;
        }

        .arrow {
          position: absolute;
          display: block;
          width: 0.8rem;
          height: 0.4rem;
        }

        .arrow::before {
          position: absolute;
          display: block;
          content: "";
          border-color: transparent;
          border-style: solid;
        }

        .bs-popover-bottom .arrow {
          top: calc(-0.4rem - 1px);
        }

        .bs-popover-bottom .arrow::before {
          top: 0;
          border-width: 0 0.4rem 0.4rem 0.4rem;
          border-bottom-color: rgba(0, 0, 0, 0.15);
        }

        .ais-RefinementList-searchBox {
          padding: 10px;
          border-bottom: 1px solid #e9ecef;
        }

        .ais-SearchBox-input {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .ais-RefinementList-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .ais-RefinementList-item {
          padding: 8px 15px;
        }

        .ais-RefinementList-item:hover {
          background: #f8f9fa;
        }

        .ais-RefinementList-item--selected {
          background: #e9ecef;
        }

        .ais-RefinementList-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
          font-size: 14px;
          margin: 0;
        }

        .ais-RefinementList-checkbox {
          margin-right: 8px;
          cursor: pointer;
        }

        .ais-RefinementList-labelText {
          flex: 1;
        }

        .ais-RefinementList-count {
          color: #6c757d;
          font-size: 12px;
          margin-left: 5px;
        }

        .d-none {
          display: none !important;
        }

        .d-md-block {
          display: block !important;
        }

        @media (max-width: 767px) {
          .d-md-block {
            display: none !important;
          }
        }

        .mb-3 {
          margin-bottom: 1rem !important;
        }

        .mr-2 {
          margin-right: 0.5rem !important;
        }

        .position-relative {
          position: relative !important;
        }

        .order-first {
          order: -1 !important;
        }

        .d-flex {
          display: flex !important;
        }

        .align-items-end {
          align-items: flex-end !important;
        }

        .shadow-sm {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        }

        .main-search-container {
          padding: 20px;
          background: #f8f9fa;
        }

        .main-search-wrapper {
          max-width: 1425px;
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
          max-width: 1425px;
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
          max-width: 1425px;
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

        <div className="il-search-options-container mb-3 d-none d-md-block order-first" ref={dropdownRef}>
          <div className="il-filter-row">
            {Object.entries(searchCategories).map(([key, category]) => (
              <div key={key} className="il-drop-down-container position-relative">
                <button
                  id={`trigger-${key}`}
                  aria-haspopup="true"
                  aria-expanded={openDropdown === key ? 'true' : 'false'}
                  className="d-flex align-items-end mr-2 il-btn-trigger btn btn-sm btn-outline-secondary dropdown-toggle border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === key ? null : key);
                  }}
                >
                  <span className="il-drop-down-label">{category.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="il-dropdown-icon ml-2">
                    <path fill="currentColor" d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
                  </svg>
                </button>

                <div
                  id={`popup-${key}`}
                  role="menu"
                  className={`${openDropdown === key ? '' : 'd-none'} il-pop-over popover bs-popover-bottom shadow-sm`}
                  aria-labelledby={`trigger-${key}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="arrow"></div>
                  <div className="popover-body">
                    <div className="ais-RefinementList">
                      <div className="ais-RefinementList-searchBox">
                        <div className="ais-SearchBox">
                          <form noValidate className="ais-SearchBox-form" action="" role="search" onSubmit={(e) => e.preventDefault()}>
                            <input
                              type="search"
                              placeholder="Search here…"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              required
                              maxLength={512}
                              className="ais-SearchBox-input"
                              value={searchTerms[key] || ''}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                          </form>
                        </div>
                      </div>
                      <ul className="ais-RefinementList-list">
                        {getFilteredOptions(key, category.options).map((option, idx) => {
                          const isActive = isFilterActive(category.name, option.text);
                          return (
                            <li key={idx} className={`ais-RefinementList-item ${isActive ? 'ais-RefinementList-item--selected' : ''}`}>
                              <label className="ais-RefinementList-label">
                                <input
                                  className="ais-RefinementList-checkbox"
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => toggleFilter(category.name, option.text)}
                                />
                                <span className="ais-RefinementList-labelText">{option.text}</span>
                                {option.count && (
                                  <span className="ais-RefinementList-count">{option.count}</span>
                                )}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
