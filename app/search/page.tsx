'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, Upload, X, MapPin } from 'lucide-react';
import { supabase, Property } from '@/lib/supabase';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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
        { name: 'Gated Entry', count: 320 },
        { name: 'Loading Dock', count: 180 },
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
        { name: 'Vinyl', count: 180 },
        { name: 'Stone', count: 240 },
      ],
    },
    patioBalconies: {
      label: 'Patio Balconies',
      options: [
        { name: 'Patio', count: 450 },
        { name: 'Balcony', count: 380 },
        { name: 'Terrace', count: 220 },
        { name: 'Deck', count: 340 },
        { name: 'Covered Patio', count: 280 },
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
        { name: 'Lap Pool', count: 180 },
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
        { name: 'Wallpaper', count: 180 },
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

  const removeFilter = (filterType: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: (prev[filterType] || []).filter(v => v !== value),
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
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
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).reduce((acc, curr) => acc + curr.length, 0);
  };

  return (
    <main className="min-h-screen bg-white pt-[110px]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-1">
            Search a Location Using An Image As Reference
          </p>
          <p className="text-sm text-gray-500">
            Drag & Drop an image here or click here to select a file
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" ref={dropdownRef}>
          {Object.entries(filterDefinitions).map(([key, { label }]) => (
            <div key={key} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                className="text-xs px-3 py-2 h-auto whitespace-nowrap"
              >
                {label} <ChevronDown className="w-3 h-3 ml-1" />
              </Button>

              {activeFilter === key && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <div className="p-3">
                    <Input
                      placeholder="Search here..."
                      className="mb-3 text-sm"
                    />
                    <div className="space-y-2">
                      {filterDefinitions[key].options.map((option) => (
                        <div
                          key={option.name}
                          className="flex items-center justify-between py-2"
                        >
                          <label
                            htmlFor={`${key}-${option.name}`}
                            className="text-sm cursor-pointer flex-1 flex items-center justify-between"
                          >
                            <span>{option.name}</span>
                            <span className="text-gray-400 text-xs ml-2">({option.count})</span>
                          </label>
                          <Switch
                            id={`${key}-${option.name}`}
                            checked={selectedFilters[key]?.includes(option.name)}
                            onCheckedChange={() => toggleFilter(key, option.name)}
                            className="data-[state=checked]:bg-[#dc2626] ml-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {getActiveFiltersCount() > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {Object.entries(selectedFilters).map(([filterType, values]) =>
              values.map((value) => (
                <div
                  key={`${filterType}-${value}`}
                  className="inline-flex items-center gap-2 bg-[#dc2626] text-white text-sm px-3 py-1 rounded-full"
                >
                  <span className="text-xs lowercase">{filterDefinitions[filterType].label}:</span>
                  <span>{value}</span>
                  <button
                    onClick={() => removeFilter(filterType, value)}
                    className="hover:opacity-75"
                    aria-label="Remove filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-gray-600"
            >
              Clear All
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {properties.length} Locations Found
          </h2>
          <select className="border border-gray-300 rounded px-3 py-2 text-sm">
            <option>Sort by: Relevance</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[3/2] bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/property/${property.id}`}
                  className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <div className="aspect-[3/2] relative overflow-hidden">
                    <Image
                      src={property.primary_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                      alt={property.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{property.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4" />
                      {property.city}, Texas
                    </p>
                    <p className="text-lg font-bold text-[#dc2626]">
                      ${property.daily_rate}/day
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pb-8">
              <Button variant="outline" size="sm">«</Button>
              <Button variant="outline" size="sm">‹</Button>
              <Button variant="outline" size="sm" className="bg-[#dc2626] text-white">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">4</Button>
              <Button variant="outline" size="sm">5</Button>
              <Button variant="outline" size="sm">6</Button>
              <Button variant="outline" size="sm">7</Button>
              <Button variant="outline" size="sm">›</Button>
              <Button variant="outline" size="sm">»</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white pt-[110px]">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
