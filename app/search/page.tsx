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

interface ActiveFilter {
  key: string;
  value: string;
}

interface FilterOption {
  label: string;
  key: string;
  options: any[];
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterOptions: FilterOption[] = [
    { label: 'Categories', key: 'categories', options: ['Residential', 'Commercial', 'Industrial'] },
    { label: 'Permits', key: 'permits', options: ['Film', 'Photo', 'Event'] },
    { label: 'City', key: 'city', options: ['Los Angeles', 'Beverly Hills', 'Santa Monica', 'Malibu'] },
    { label: 'County', key: 'county', options: ['Los Angeles', 'Orange', 'Ventura'] },
    { label: 'Access', key: 'access', options: ['24/7', 'Business Hours', 'By Appointment'] },
    {
      label: 'Floors',
      key: 'floors',
      options: [
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
      ]
    },
    { label: 'Patio Balconies', key: 'patioBalconies', options: ['furnished', 'unfurnished'] },
    { label: 'Pool', key: 'pool', options: ['Yes', 'No', 'Indoor', 'Outdoor'] },
    { label: 'Walls', key: 'walls', options: ['White', 'Brick', 'Glass', 'Wood'] },
    { label: 'Yard', key: 'yard', options: ['Large', 'Small', 'None'] }
  ];

  useEffect(() => {
    const sampleProperties = Array.from({ length: 96 }, (_, i) => ({
      id: i + 1,
      title: `Club ${31 + i}`,
      location: `Los Angeles`,
      image: `/api/placeholder/400/300`
    }));
    setProperties(sampleProperties);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterSelect = (key: string, value: string) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.key === key);
      if (existing) {
        return prev.map(f => f.key === key ? { ...f, value } : f);
      }
      return [...prev, { key, value }];
    });
    setOpenDropdown(null);
  };

  const removeFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key));
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const getCurrentPageItems = () => {
    const start = (currentPage - 1) * 24;
    return properties.slice(start, start + 24);
  };

  return (
    <>
      <style jsx global>{`
        .search-page {
          font-family: acumin-pro-wide, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 300;
          background: #fff;
          min-height: 100vh;
        }

        .filter-bar {
          background: #f8f9fa;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 20px;
          position: sticky;
          top: 60px;
          z-index: 100;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-dropdown {
          position: relative;
        }

        .dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          color: #495057;
          transition: all 0.2s;
          font-family: inherit;
          font-weight: 300;
        }

        .dropdown-toggle:hover {
          background: #f8f9fa;
        }

        .dropdown-toggle.active {
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
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          min-width: 200px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: #f8f9fa;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-wrapper {
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 6px 12px 6px 35px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 14px;
          font-family: inherit;
          font-weight: 300;
        }

        .search-input:focus {
          outline: none;
          border-color: #80bdff;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          pointer-events: none;
        }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .search-item {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-item:hover {
          background: #f8f9fa;
        }

        .search-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #ced4da;
          border-radius: 50%;
          background: #e9ecef;
          margin-right: 12px;
        }

        .search-text {
          flex: 1;
          font-size: 14px;
          color: #495057;
        }

        .search-count {
          font-size: 13px;
          color: #e11921;
          font-weight: 500;
          margin-left: 10px;
        }

        .ais-CurrentRefinements {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 15px 20px;
          min-height: 20px;
        }

        .ais-CurrentRefinements-item {
          display: inline-flex;
          align-items: center;
        }

        .ais-CurrentRefinements-label {
          color: #333;
          font-size: 14px;
          margin-right: 5px;
        }

        .ais-CurrentRefinements-category {
          display: inline-flex;
          align-items: center;
          background: #dc3545;
          color: white;
          padding: 4px 10px;
          border-radius: 3px;
          font-size: 14px;
        }

        .ais-CurrentRefinements-delete {
          background: none;
          border: none;
          color: white;
          margin-left: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .ais-Hits-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          padding: 20px;
          list-style: none;
          margin: 0;
        }

        @media (max-width: 1200px) {
          .ais-Hits-list {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .ais-Hits-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .property-card {
          position: relative;
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
        }

        .add-button {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 36px;
          height: 36px;
          background: #e11921;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 300;
        }

        .ais-Pagination {
          display: flex;
          justify-content: center;
          padding: 40px 20px;
        }

        .ais-Pagination-list {
          display: flex;
          align-items: center;
          gap: 5px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ais-Pagination-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 10px;
          border: 1px solid #dee2e6;
          background: white;
          color: #495057;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ais-Pagination-link:hover {
          background: #f8f9fa;
        }

        .ais-Pagination-item--selected .ais-Pagination-link {
          background: #e11921;
          color: white;
          border-color: #e11921;
        }

        .ais-Pagination-item--disabled .ais-Pagination-link {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>

      <div className="search-page" style={{ paddingTop: '60px' }}>
        <div className="filter-bar" ref={dropdownRef}>
          <div className="filter-row">
            {filterOptions.map(filter => (
              <div key={filter.key} className="filter-dropdown">
                <button
                  className={`dropdown-toggle ${activeFilters.find(f => f.key === filter.key) ? 'active' : ''}`}
                  onClick={() => toggleDropdown(filter.key)}
                >
                  {filter.label}
                  <ChevronDown size={14} />
                </button>

                {openDropdown === filter.key && (
                  <div className="dropdown-menu">
                    {filter.key === 'floors' ? (
                      filter.options.map((option: any) => (
                        <div
                          key={option.text}
                          className="search-item"
                          onClick={() => handleFilterSelect(filter.key, option.text)}
                        >
                          <div className="search-checkbox"></div>
                          <span className="search-text">{option.text}</span>
                          <span className="search-count">{option.count}</span>
                        </div>
                      ))
                    ) : (
                      filter.options.map((option: string) => (
                        <div
                          key={option}
                          className="dropdown-item"
                          onClick={() => handleFilterSelect(filter.key, option)}
                        >
                          {option}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="search-container">
              <div className="search-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                />

                {showSearchDropdown && (
                  <div className="search-dropdown">
                    {[
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
                    ].map(item => (
                      <div key={item.text} className="search-item">
                        <div className="search-checkbox"></div>
                        <span className="search-text">{item.text}</span>
                        <span className="search-count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="ais-CurrentRefinements">
            {activeFilters.map(filter => (
              <div key={filter.key} className="ais-CurrentRefinements-item">
                <span className="ais-CurrentRefinements-label">{filter.key}:</span>
                <span className="ais-CurrentRefinements-category">
                  {filter.value}
                  <button
                    className="ais-CurrentRefinements-delete"
                    onClick={() => removeFilter(filter.key)}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <ul className="ais-Hits-list">
          {getCurrentPageItems().map(property => (
            <li key={property.id}>
              <div className="property-card">
                <button className="add-button">+</button>
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
            </li>
          ))}
        </ul>

        <div className="ais-Pagination">
          <ul className="ais-Pagination-list">
            <li className={`ais-Pagination-item ${currentPage === 1 ? 'ais-Pagination-item--disabled' : ''}`}>
              <a className="ais-Pagination-link" onClick={() => currentPage > 1 && setCurrentPage(1)}>«</a>
            </li>
            <li className={`ais-Pagination-item ${currentPage === 1 ? 'ais-Pagination-item--disabled' : ''}`}>
              <a className="ais-Pagination-link" onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>‹</a>
            </li>
            {[1, 2, 3, 4].map(page => (
              <li key={page} className={`ais-Pagination-item ${currentPage === page ? 'ais-Pagination-item--selected' : ''}`}>
                <a className="ais-Pagination-link" onClick={() => setCurrentPage(page)}>{page}</a>
              </li>
            ))}
            <li className={`ais-Pagination-item ${currentPage === 4 ? 'ais-Pagination-item--disabled' : ''}`}>
              <a className="ais-Pagination-link" onClick={() => currentPage < 4 && setCurrentPage(currentPage + 1)}>›</a>
            </li>
            <li className={`ais-Pagination-item ${currentPage === 4 ? 'ais-Pagination-item--disabled' : ''}`}>
              <a className="ais-Pagination-link" onClick={() => currentPage < 4 && setCurrentPage(4)}>»</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
