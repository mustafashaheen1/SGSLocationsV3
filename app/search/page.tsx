'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeFilters] = useState<ActiveFilter[]>([
    { key: 'city', value: 'Los Angeles' },
    { key: 'patioBalconies', value: 'furnished' }
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(4);
  const itemsPerPage = 24;

  useEffect(() => {
    const sampleProperties = Array.from({ length: 96 }, (_, i) => ({
      id: i + 1,
      title: `Property ${i + 1}`,
      location: `Los Angeles, CA`,
      category: ['Residential', 'Commercial', 'Industrial', 'Event Space'][i % 4],
      image: `/api/placeholder/400/300`,
      slug: `property-${i + 1}`
    }));
    setProperties(sampleProperties);
  }, []);

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return properties.slice(startIndex, endIndex);
  };

  const removeFilter = (filterKey: string) => {
    console.log('Remove filter:', filterKey);
  };

  return (
    <>
      <style jsx global>{`
        .search-page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: #fff;
          min-height: 100vh;
        }

        .ais-CurrentRefinements {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 15px 0;
          margin-bottom: 20px;
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
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 14px;
        }

        .ais-CurrentRefinements-categoryLabel {
          display: none;
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

        .ais-CurrentRefinements-delete:hover {
          opacity: 0.8;
        }

        .ais-Hits-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          list-style: none;
          padding: 0;
          margin: 0 0 40px 0;
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

        @media (max-width: 480px) {
          .ais-Hits-list {
            grid-template-columns: 1fr;
          }
        }

        .ais-Hits-item {
          background: white;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }

        .ais-Hits-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .hit-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: #f0f0f0;
        }

        .hit-content {
          padding: 15px;
        }

        .hit-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 5px 0;
          color: #333;
        }

        .hit-location {
          font-size: 14px;
          color: #666;
          margin: 0 0 5px 0;
        }

        .hit-category {
          font-size: 13px;
          color: #999;
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

        .ais-Pagination-item--firstPage .ais-Pagination-link,
        .ais-Pagination-item--previousPage .ais-Pagination-link,
        .ais-Pagination-item--nextPage .ais-Pagination-link,
        .ais-Pagination-item--lastPage .ais-Pagination-link {
          font-weight: normal;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
      `}</style>

      <div className="search-page" style={{ paddingTop: '60px' }}>
        <div className="container">
          <div className="ais-CurrentRefinements">
            {activeFilters.map(filter => (
              <div key={filter.key} className="ais-CurrentRefinements-item">
                <span className="ais-CurrentRefinements-label">{filter.key}:</span>
                <span className="ais-CurrentRefinements-category">
                  <span className="ais-CurrentRefinements-categoryLabel"></span>
                  {filter.value}
                  <button
                    className="ais-CurrentRefinements-delete"
                    onClick={() => removeFilter(filter.key)}
                    aria-label={`Remove ${filter.key} filter`}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <ul className="ais-Hits-list">
            {getCurrentPageItems().map(property => (
              <li key={property.id} className="ais-Hits-item">
                <Link href={`/property/${property.slug}`}>
                  <img
                    src={property.image}
                    alt={property.title}
                    className="hit-image"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/400x300/808080/ffffff?text=${property.title}`;
                    }}
                  />
                  <div className="hit-content">
                    <h3 className="hit-title">{property.title}</h3>
                    <p className="hit-location">{property.location}</p>
                    <p className="hit-category">{property.category}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

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
