'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown, Plus, Upload } from 'lucide-react';
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

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterOptions = [
    { label: 'Categories', key: 'categories' },
    { label: 'Permits', key: 'permits' },
    { label: 'City', key: 'city' },
    { label: 'County', key: 'county' },
    { label: 'Access', key: 'access' },
    { label: 'Floors', key: 'floors' },
    { label: 'Patio Balconies', key: 'patioBalconies' },
    { label: 'Pool', key: 'pool' },
    { label: 'Walls', key: 'walls' },
    { label: 'Yard', key: 'yard' }
  ];

  useEffect(() => {
    const sampleProperties = Array.from({ length: 96 }, (_, i) => ({
      id: i + 1,
      title: `Club ${31 + i}`,
      location: `Los Angeles`,
      image: `/api/placeholder/400/300`
    }));
    setProperties(sampleProperties);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('File dropped:', e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      console.log('File selected:', e.target.files[0]);
    }
  };

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

        .image-search-container {
          margin: 20px auto;
          max-width: 1200px;
          padding: 0 20px;
        }

        .image-search-box {
          border: 2px dashed #333;
          border-radius: 4px;
          padding: 40px 20px;
          text-align: center;
          background: #f9f9f9;
          cursor: pointer;
          transition: all 0.3s;
        }

        .image-search-box.drag-active {
          background: #e8f4f8;
          border-color: #0073e6;
        }

        .image-search-box:hover {
          background: #f0f0f0;
        }

        .image-search-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #333;
        }

        .image-search-text {
          font-size: 16px;
          color: #666;
        }

        .image-search-link {
          color: #0073e6;
          text-decoration: underline;
          cursor: pointer;
        }

        .filter-bar {
          background: #f8f9fa;
          border-top: 1px solid #e5e5e5;
          border-bottom: 1px solid #e5e5e5;
          padding: 12px 0;
        }

        .filter-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
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
          padding: 6px 12px;
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
          border-color: #adb5bd;
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
          min-width: 150px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          display: none;
        }

        .dropdown-menu.show {
          display: block;
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

        .search-button {
          padding: 6px 12px;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-button:hover {
          background: #f8f9fa;
        }

        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 15px 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .filter-pill {
          display: inline-flex;
          align-items: center;
        }

        .filter-label {
          color: #333;
          font-size: 14px;
          margin-right: 5px;
        }

        .filter-value {
          display: inline-flex;
          align-items: center;
          background: #dc3545;
          color: white;
          padding: 4px 10px;
          border-radius: 3px;
          font-size: 14px;
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
          max-width: 1400px;
          margin: 0 auto;
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
          margin: 0;
        }

        .floating-add-button {
          position: fixed;
          bottom: 30px;
          left: 30px;
          width: 56px;
          height: 56px;
          background: #e11921;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 1000;
          transition: all 0.3s;
        }

        .floating-add-button:hover {
          background: #c5161d;
          transform: scale(1.1);
        }

        .pagination {
          display: flex;
          justify-content: center;
          padding: 40px 20px;
        }

        .pagination-list {
          display: flex;
          align-items: center;
          gap: 5px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .pagination-link {
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

        .pagination-link:hover {
          background: #f8f9fa;
        }

        .pagination-link.active {
          background: #e11921;
          color: white;
          border-color: #e11921;
        }

        .pagination-link.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="search-page">
        <div className="image-search-container">
          <div
            className={`image-search-box ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <h2 className="image-search-title">Search a Location Using An Image As Reference</h2>
            <p className="image-search-text">
              Drag & Drop an image here or <span className="image-search-link">click here</span> to select a file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="filter-bar" ref={dropdownRef}>
          <div className="filter-container">
            <div className="filter-row">
              {filterOptions.map(filter => (
                <div key={filter.key} className="filter-dropdown">
                  <button
                    className={`dropdown-toggle ${activeFilters.find(f => f.key === filter.key) ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === filter.key ? null : filter.key)}
                  >
                    {filter.label}
                    <ChevronDown size={14} />
                  </button>

                  <div className={`dropdown-menu ${openDropdown === filter.key ? 'show' : ''}`}>
                    <div className="dropdown-item" onClick={() => handleFilterSelect(filter.key, 'Option 1')}>
                      Option 1
                    </div>
                    <div className="dropdown-item" onClick={() => handleFilterSelect(filter.key, 'Option 2')}>
                      Option 2
                    </div>
                  </div>
                </div>
              ))}

              <button className="search-button">
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="filter-pills">
            {activeFilters.map(filter => (
              <div key={filter.key} className="filter-pill">
                <span className="filter-label">{filter.key}:</span>
                <span className="filter-value">
                  {filter.value}
                  <button
                    className="filter-remove"
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

        <button className="floating-add-button" title="Add to List">
          +
        </button>

        <div className="pagination">
          <ul className="pagination-list">
            <li>
              <a className={`pagination-link ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => currentPage > 1 && setCurrentPage(1)}>«</a>
            </li>
            <li>
              <a className={`pagination-link ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>‹</a>
            </li>
            {[1, 2, 3, 4].map(page => (
              <li key={page}>
                <a className={`pagination-link ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</a>
              </li>
            ))}
            <li>
              <a className={`pagination-link ${currentPage === 4 ? 'disabled' : ''}`} onClick={() => currentPage < 4 && setCurrentPage(currentPage + 1)}>›</a>
            </li>
            <li>
              <a className={`pagination-link ${currentPage === 4 ? 'disabled' : ''}`} onClick={() => currentPage < 4 && setCurrentPage(4)}>»</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
