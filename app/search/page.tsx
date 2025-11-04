'use client';

import { useState, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: number;
  title: string;
  location: string;
  category: string;
  image: string;
  slug: string;
}

interface ActiveFilter {
  key: string;
  value: string;
}

interface FilterOption {
  label: string;
  key: string;
  options: string[];
}

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const itemsPerPage = 24;

  const filterOptions: FilterOption[] = [
    { label: 'Categories', key: 'categories', options: ['Residential', 'Commercial', 'Industrial', 'Event Space'] },
    { label: 'Permits', key: 'permits', options: ['Film Permit', 'Photo Permit', 'Event Permit'] },
    { label: 'City', key: 'city', options: ['Los Angeles', 'Beverly Hills', 'Santa Monica', 'Malibu'] },
    { label: 'County', key: 'county', options: ['Los Angeles County', 'Orange County', 'Ventura County'] },
    { label: 'Access', key: 'access', options: ['24/7', 'Business Hours', 'By Appointment'] },
    { label: 'Floors', key: 'floors', options: ['Hardwood', 'Tile', 'Carpet', 'Concrete'] },
    { label: 'Patio Balconies', key: 'patioBalconies', options: ['furnished', 'unfurnished', 'covered', 'uncovered'] },
    { label: 'Pool', key: 'pool', options: ['Indoor', 'Outdoor', 'Heated', 'Infinity'] },
    { label: 'Walls', key: 'walls', options: ['White', 'Brick', 'Glass', 'Wood'] },
    { label: 'Yard', key: 'yard', options: ['Large', 'Small', 'Landscaped', 'Natural'] }
  ];

  const searchSuggestions = [
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
  ];

  useEffect(() => {
    const sampleProperties = Array.from({ length: 96 }, (_, i) => ({
      id: i + 1,
      title: `Club ${i + 1}`,
      location: `Los Angeles`,
      category: ['Residential', 'Commercial', 'Industrial', 'Event Space'][i % 4],
      image: `/api/placeholder/400/300`,
      slug: `property-${i + 1}`
    }));
    setProperties(sampleProperties);
  }, []);

  const handleFilterSelect = (filterKey: string, value: string) => {
    const existingFilter = activeFilters.find(f => f.key === filterKey);
    if (!existingFilter) {
      setActiveFilters([...activeFilters, { key: filterKey, value }]);
    }
  };

  const removeFilter = (filterKey: string) => {
    setActiveFilters(activeFilters.filter(f => f.key !== filterKey));
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return properties.slice(startIndex, endIndex);
  };

  return (
    <>
      <style jsx global>{`
        .filter-bar {
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          padding: 15px 0;
          position: sticky;
          top: 60px;
          z-index: 100;
        }

        .filter-dropdowns {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .filter-dropdown {
          position: relative;
        }

        .filter-dropdown-toggle {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: #495057;
          transition: all 0.2s;
        }

        .filter-dropdown-toggle:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .filter-dropdown-toggle.active {
          background: #e11921;
          color: white;
          border-color: #e11921;
        }

        .filter-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 5px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          min-width: 150px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          display: none;
        }

        .filter-dropdown-menu.show {
          display: block;
        }

        .filter-dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: #495057;
          transition: background 0.2s;
        }

        .filter-dropdown-item:hover {
          background: #f8f9fa;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-input-wrapper {
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 40px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 5px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .search-suggestion-item {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-suggestion-item:hover {
          background: #f8f9fa;
        }

        .search-suggestion-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #ced4da;
          border-radius: 50%;
          margin-right: 10px;
          background: #e9ecef;
        }

        .search-suggestion-text {
          flex: 1;
          font-size: 14px;
          color: #495057;
        }

        .search-suggestion-count {
          font-size: 12px;
          color: #e11921;
          font-weight: 600;
        }

        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 15px 0;
          margin-bottom: 20px;
          min-height: 20px;
        }

        .filter-pill {
          display: inline-flex;
          align-items: center;
        }

        .filter-pill-label {
          color: #333;
          font-size: 14px;
          margin-right: 5px;
        }

        .filter-pill-value {
          display: inline-flex;
          align-items: center;
          background: #dc3545;
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 14px;
        }

        .filter-pill-close {
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
          gap: 20px;
          margin-bottom: 40px;
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
          position: relative;
          background: white;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.3s;
        }

        .property-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: #f0f0f0;
        }

        .property-info {
          padding: 15px;
        }

        .property-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 5px 0;
        }

        .property-location {
          font-size: 14px;
          color: #666;
        }

        .add-to-list {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 40px;
          height: 40px;
          background: #e11921;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .ais-Pagination {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }

        .ais-Pagination-list {
          display: flex;
          align-items: center;
          gap: 5px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ais-Pagination-item {
          display: inline-block;
        }

        .ais-Pagination-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          border: 1px solid #ddd;
          background: white;
          color: #333;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ais-Pagination-link:hover {
          background: #f8f9fa;
        }

        .ais-Pagination-item--selected .ais-Pagination-link {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .ais-Pagination-item--disabled .ais-Pagination-link {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
      `}</style>

      <div className="search-page" style={{ paddingTop: '60px' }}>
        <div className="filter-bar">
          <div className="container mx-auto px-4">
            <div className="filter-dropdowns">
              {filterOptions.map(filter => (
                <div key={filter.key} className="filter-dropdown">
                  <button
                    className={`filter-dropdown-toggle ${activeFilters.find(f => f.key === filter.key) ? 'active' : ''}`}
                    onClick={(e) => {
                      const menu = e.currentTarget.nextElementSibling;
                      menu?.classList.toggle('show');
                    }}
                  >
                    {filter.label}
                    <ChevronDown size={16} />
                  </button>
                  <div className="filter-dropdown-menu">
                    {filter.options.map(option => (
                      <div
                        key={option}
                        className="filter-dropdown-item"
                        onClick={() => handleFilterSelect(filter.key, option)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search here..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  />
                  {showSearchSuggestions && (
                    <div className="search-suggestions">
                      {searchSuggestions.map(suggestion => (
                        <div key={suggestion.text} className="search-suggestion-item">
                          <div className="search-suggestion-checkbox"></div>
                          <span className="search-suggestion-text">{suggestion.text}</span>
                          <span className="search-suggestion-count">{suggestion.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {activeFilters.length > 0 && (
            <div className="filter-pills">
              {activeFilters.map(filter => (
                <div key={filter.key} className="filter-pill">
                  <span className="filter-pill-label">{filter.key}:</span>
                  <span className="filter-pill-value">
                    {filter.value}
                    <button
                      className="filter-pill-close"
                      onClick={() => removeFilter(filter.key)}
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="property-grid">
            {getCurrentPageItems().map(property => (
              <div key={property.id} className="property-card">
                <button className="add-to-list">+</button>
                <Link href={`/property/${property.slug}`}>
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

          <div className="ais-Pagination">
            <ul className="ais-Pagination-list">
              <li className={`ais-Pagination-item ais-Pagination-item--firstPage ${currentPage === 1 ? 'ais-Pagination-item--disabled' : ''}`}>
                <a
                  className="ais-Pagination-link"
                  onClick={() => currentPage !== 1 && setCurrentPage(1)}
                  aria-label="First"
                >
                  «
                </a>
              </li>

              <li className={`ais-Pagination-item ais-Pagination-item--previousPage ${currentPage === 1 ? 'ais-Pagination-item--disabled' : ''}`}>
                <a
                  className="ais-Pagination-link"
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  aria-label="Previous"
                >
                  ‹
                </a>
              </li>

              {[1, 2, 3, 4].map(page => (
                <li
                  key={page}
                  className={`ais-Pagination-item ais-Pagination-item--page ${currentPage === page ? 'ais-Pagination-item--selected' : ''}`}
                >
                  <a
                    className="ais-Pagination-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </a>
                </li>
              ))}

              <li className={`ais-Pagination-item ais-Pagination-item--nextPage ${currentPage === totalPages ? 'ais-Pagination-item--disabled' : ''}`}>
                <a
                  className="ais-Pagination-link"
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  aria-label="Next"
                >
                  ›
                </a>
              </li>

              <li className={`ais-Pagination-item ais-Pagination-item--lastPage ${currentPage === totalPages ? 'ais-Pagination-item--disabled' : ''}`}>
                <a
                  className="ais-Pagination-link"
                  onClick={() => currentPage !== totalPages && setCurrentPage(totalPages)}
                  aria-label="Last"
                >
                  »
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
