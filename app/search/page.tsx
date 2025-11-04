'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: number;
  title: string;
  location: string;
  image: string;
}

interface FilterOption {
  text: string;
  count?: number;
}

interface ActiveFilter {
  category: string;
  values: string[];
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownSearches, setDropdownSearches] = useState<{[key: string]: string}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterCategories = {
    Categories: [
      { text: 'Retro', count: 34 },
      { text: 'Pool', count: 20 },
      { text: 'Modern', count: 17 },
      { text: 'Zen', count: 14 },
      { text: 'Architectural', count: 13 },
      { text: 'Americana', count: 11 },
      { text: 'Views', count: 11 },
      { text: 'Kitchen', count: 9 },
      { text: 'Tropical', count: 9 },
      { text: 'Mid-Century Modern', count: 8 },
      { text: 'Bar', count: 7 }
    ],
    Permits: [
      { text: 'Film Permit' },
      { text: 'Photo Permit' },
      { text: 'Event Permit' }
    ],
    City: [
      { text: 'Los Angeles' },
      { text: 'Beverly Hills' },
      { text: 'Santa Monica' },
      { text: 'Malibu' }
    ],
    County: [
      { text: 'Los Angeles County' },
      { text: 'Orange County' },
      { text: 'Ventura County' }
    ],
    Access: [
      { text: '24/7' },
      { text: 'Business Hours' },
      { text: 'By Appointment' }
    ],
    Floors: [
      { text: 'wood', count: 44 },
      { text: 'tile', count: 30 },
      { text: 'concrete', count: 25 },
      { text: 'dark wood', count: 17 },
      { text: 'carpet', count: 13 },
      { text: 'light wood', count: 8 },
      { text: 'linoleum', count: 6 },
      { text: 'white', count: 5 },
      { text: 'black', count: 4 },
      { text: 'marble', count: 4 },
      { text: 'slate', count: 4 },
      { text: 'cobblestone', count: 3 }
    ],
    'Patio Balconies': [
      { text: 'furnished' },
      { text: 'unfurnished' },
      { text: 'large' },
      { text: 'small' }
    ],
    Pool: [
      { text: 'Yes' },
      { text: 'No' },
      { text: 'Indoor' },
      { text: 'Outdoor' }
    ],
    Walls: [
      { text: 'White' },
      { text: 'Brick' },
      { text: 'Glass' },
      { text: 'Wood' }
    ],
    Yard: [
      { text: 'Large' },
      { text: 'Small' },
      { text: 'Landscaped' }
    ]
  };

  useEffect(() => {
    const sampleProperties = Array.from({ length: 96 }, (_, i) => ({
      id: i + 1,
      title: `Club ${31 + i}`,
      location: 'Los Angeles',
      image: `/api/placeholder/400/300`
    }));
    setProperties(sampleProperties);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.category === category);

      if (existing) {
        const hasValue = existing.values.includes(value);
        if (hasValue) {
          const newValues = existing.values.filter(v => v !== value);
          if (newValues.length === 0) {
            return prev.filter(f => f.category !== category);
          }
          return prev.map(f =>
            f.category === category ? { ...f, values: newValues } : f
          );
        } else {
          return prev.map(f =>
            f.category === category ? { ...f, values: [...f.values, value] } : f
          );
        }
      } else {
        return [...prev, { category, values: [value] }];
      }
    });
  };

  const isFilterActive = (category: string, value: string) => {
    const filter = activeFilters.find(f => f.category === category);
    return filter ? filter.values.includes(value) : false;
  };

  const removeFilterValue = (category: string, value: string) => {
    toggleFilter(category, value);
  };

  const getCategoryKey = (category: string) => {
    return category.toLowerCase().replace(' ', '');
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 250px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .dropdown-search {
          padding: 10px;
          border-bottom: 1px solid #e5e5e5;
        }

        .dropdown-search-input {
          width: 100%;
          padding: 8px 12px 8px 35px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 14px;
          position: relative;
        }

        .dropdown-search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          pointer-events: none;
          z-index: 1;
        }

        .dropdown-options {
          max-height: 350px;
          overflow-y: auto;
        }

        .dropdown-option {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-option:hover {
          background: #f8f9fa;
        }

        .toggle-switch {
          width: 44px;
          height: 24px;
          background: #e9ecef;
          border-radius: 12px;
          margin-right: 12px;
          position: relative;
          transition: all 0.3s;
          cursor: pointer;
        }

        .toggle-switch.active {
          background: #28a745;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .toggle-switch.active::after {
          transform: translateX(20px);
        }

        .option-text {
          flex: 1;
          font-size: 14px;
          color: #333;
        }

        .option-count {
          font-size: 13px;
          color: #dc3545;
          font-weight: 500;
          background: #fce4e5;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .main-search-container {
          padding: 15px 20px;
          background: #f8f9fa;
        }

        .main-search-wrapper {
          max-width: 600px;
          position: relative;
        }

        .main-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .main-search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 16px;
        }

        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 15px 20px;
          background: #f8f9fa;
        }

        .filter-pill-group {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .filter-label {
          color: #333;
          font-size: 14px;
        }

        .filter-value {
          display: inline-flex;
          align-items: center;
          background: #dc3545;
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 14px;
          margin-left: 5px;
        }

        .filter-remove {
          background: none;
          border: none;
          color: white;
          margin-left: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          padding: 20px;
        }

        @media (max-width: 1200px) {
          .property-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .property-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .property-card {
          background: white;
          border: 1px solid #e5e5e5;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.3s;
        }

        .property-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: #f0f0f0;
        }

        .property-info {
          padding: 12px;
        }

        .property-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 5px 0;
        }

        .property-location {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
      `}</style>

      <div className="search-page">
        <div className="filter-bar" ref={dropdownRef}>
          <div className="filter-row">
            {Object.keys(filterCategories).map(category => {
              const categoryKey = getCategoryKey(category);
              const hasActive = activeFilters.some(f => f.category === categoryKey);

              return (
                <div key={category} className="filter-dropdown">
                  <button
                    className={`dropdown-toggle ${hasActive ? 'has-active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === category ? null : category)}
                  >
                    {category}
                    <ChevronDown size={14} />
                  </button>

                  {openDropdown === category && (
                    <div className="dropdown-menu">
                      <div className="dropdown-search">
                        <div style={{ position: 'relative' }}>
                          <Search className="dropdown-search-icon" size={18} />
                          <input
                            type="text"
                            className="dropdown-search-input"
                            placeholder="Search here..."
                            value={dropdownSearches[category] || ''}
                            onChange={(e) => setDropdownSearches({
                              ...dropdownSearches,
                              [category]: e.target.value
                            })}
                          />
                        </div>
                      </div>

                      <div className="dropdown-options">
                        {(filterCategories[category as keyof typeof filterCategories] as FilterOption[])
                          .filter(option =>
                            !dropdownSearches[category] ||
                            option.text.toLowerCase().includes(dropdownSearches[category].toLowerCase())
                          )
                          .map(option => (
                            <div
                              key={option.text}
                              className="dropdown-option"
                              onClick={() => toggleFilter(categoryKey, option.text)}
                            >
                              <div className={`toggle-switch ${isFilterActive(categoryKey, option.text) ? 'active' : ''}`} />
                              <span className="option-text">{option.text}</span>
                              {option.count && (
                                <span className="option-count">{option.count}</span>
                              )}
                            </div>
                          ))
                        }
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

        <div className="property-grid">
          {getCurrentPageItems().map(property => (
            <div key={property.id} className="property-card">
              <Link href={`/property/${property.id}`}>
                <img
                  src={property.image}
                  alt={property.title}
                  className="property-image"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/400x300/808080/ffffff?text=${property.title}`;
                  }}
                />
                <div className="property-info">
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-location">{property.location}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
